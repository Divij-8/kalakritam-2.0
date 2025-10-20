import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigationWithLoading } from '../../hooks/useNavigationWithLoading';
import { useUsernameValidation } from '../ValidateUsername/ValidateUsername';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { toast } from '../../utils/notifications.js';
import { useMobileOptimizations } from '../../hooks/useMobileOptimizations';
import { getMobileBlurConfig } from '../../utils/mobileOptimizations';
import Header from '../Header';
import Footer from '../Footer';
import VideoLogo from '../VideoLogo';
import OptimizedParticles from '../OptimizedParticles';
import { config } from '../../config/environment';
import './Events.css';

const Events = () => {
  const { navigateWithLoading } = useNavigationWithLoading();
  const { username } = useParams();
  const { user, isAuthenticated } = useUserAuth();
  useUsernameValidation('events'); // Validate username in URL
  const [selectedView, setSelectedView] = useState('upcoming');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchCalled = useRef(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const itemsPerPage = 6;
  
  // Mobile optimizations
  const { particleConfig, networkOptimizations } = useMobileOptimizations('events');
  const [blurConfig, setBlurConfig] = useState(getMobileBlurConfig());

  useEffect(() => {
    if (!fetchCalled.current) {
      fetchEvents();
      fetchCalled.current = true;
    }
  }, []);

  // Helper function to generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleViewDetails = (event) => {
    const slug = event.slug || generateSlug(event.title);
    
    // If user is authenticated and has username in URL, use personalized path
    let eventPath;
    if (username && isAuthenticated && user) {
      eventPath = `/u/${username}/events/${slug}`;
    } else {
      eventPath = `/events/${slug}`;
    }
    
    // Navigate to slug-based URL
    navigateWithLoading(eventPath);
  };

  const fetchEvents = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const loadingId = toast.dataLoading(append ? 'Loading more events...' : 'Loading events...');
      
      const response = await fetch(`${config.apiBaseUrl}/events?page=${page}&limit=${itemsPerPage}`);
      const data = await response.json();
      
      toast.dismiss(loadingId);
      
      if (data.success) {
        // Transform database fields to camelCase and handle URLs
        const transformedData = data.data.map(event => ({
          id: event.id,
          title: event.title,
          slug: event.slug,
          description: event.description,
          category: event.category,
          venue: event.venue,
          startDate: event.start_date,
          endDate: event.end_date,
          ticketPrice: event.ticket_price,
          maxAttendees: event.max_attendees,
          imageUrl: config.transformImageUrl(event.image_url || event.imageUrl),
          videoUrl: event.video_url || event.videoUrl,
          districtUrl: event.district_url || event.districtUrl,
          bookMyShowUrl: event.book_my_show_url || event.bookMyShowUrl,
          active: event.active,
          createdAt: event.created_at,
          updatedAt: event.updated_at
        }));
        
        if (append) {
          setEvents(prev => [...prev, ...transformedData]);
        } else {
          setEvents(transformedData);
        }
        
        // Update pagination info
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total || 0);
        }
        
        toast.dataLoaded(`Loaded ${transformedData.length} events`);
      } else {
        setError('Failed to load events');
        toast.error('Failed to load events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to connect to server');
      toast.serverError('Failed to connect to server');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchEvents(currentPage + 1, true);
    }
  };

  if (loading) {
    return (
      <div className="events-container">
        <VideoLogo />
        <Header currentPage="events" />
        <div className="events-page-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading events...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-container">
        <VideoLogo />
        <Header currentPage="events" />
        <div className="events-page-content">
          <div className="error-container">
            <h2>Unable to load events</h2>
            <p>{error}</p>
            <button onClick={fetchEvents} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Filter events based on selected view
  const filteredEvents = selectedView === 'upcoming' 
    ? events.filter(event => event.active) 
    : events;

  return (
    <div className="events-container">
      {/* Particles Background - Optimized for mobile */}
      <OptimizedParticles 
        particleConfig={particleConfig}
        networkOptimizations={networkOptimizations}
        className="events-particles-background"
      />
      
      {/* Blur Overlay Layer - Optimized for mobile */}
      <div 
        className="events-blur-overlay"
        style={{
          backdropFilter: blurConfig.backdropFilter,
          background: blurConfig.background
        }}
      ></div>
      
      {/* Video Logo */}
      <VideoLogo />
      
      <Header currentPage="events" />
      
      <div className="events-page-content">
        <header className="events-page-header">
          <h1 className="events-title">Events</h1>
          <p className="events-subtitle">Discover Art Through Experiences</p>
          <div className="events-description">
            <p>Immerse yourself in our vibrant art events and cultural experiences. Connect with artists, explore creative workshops, and be part of the thriving art community at Kalakritam.</p>
          </div>
        </header>

        <main className="events-content">
          <div className="events-count">
            <p>Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}</p>
          </div>
          
          <div className="events-grid">
            {filteredEvents.map(event => (
              <div key={event.id} className="event-card universal-card flip-card" onClick={() => handleViewDetails(event)}>
                <div className="flip-card-inner">
                  {/* Front Side - Image and Event Info */}
                  <div className="flip-card-front">
                    <div className="event-image-container universal-card-image-container">
                      <img 
                        src={event.imageUrl || '/events/art poster.png'} 
                        alt={event.title}
                        className="event-image universal-card-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = e.target.parentNode.querySelector('.event-image-placeholder');
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="event-image-placeholder universal-card-image-placeholder" style={{ display: 'none' }}>
                        <div className="universal-card-logo-text">Kalakritam</div>
                        <div className="universal-card-image-not-available">Image not available</div>
                      </div>
                      <div className="event-overlay universal-card-overlay">
                        <div className="event-overlay-content universal-card-overlay-content">
                          <h3>{event.title}</h3>
                          <p>{event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'TBA'}</p>
                          <span className="highlight-text">₹{event.ticketPrice || '0'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="event-info universal-card-content">
                      <h4 className="event-title universal-card-title">{event.title}</h4>
                      <p className="event-venue universal-card-subtitle">{event.venue}</p>
                      <p className="event-description universal-card-description">{event.description}</p>
                      
                      <div className="event-details universal-card-details">
                        <div className="detail-row universal-card-detail-row">
                          <span className="detail-label universal-card-detail-label">Date:</span>
                          <span className="detail-value universal-card-detail-value">
                            {event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { 
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'TBA'}
                          </span>
                        </div>
                        <div className="detail-row universal-card-detail-row">
                          <span className="detail-label universal-card-detail-label">Time:</span>
                          <span className="detail-value universal-card-detail-value">
                            {event.startDate ? new Date(event.startDate).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit', 
                              hour12: true 
                            }) : 'TBA'}
                          </span>
                        </div>
                        <div className="detail-row universal-card-detail-row">
                          <span className="detail-label universal-card-detail-label">Location:</span>
                          <span className="detail-value universal-card-detail-value">{event.venue || 'TBA'}</span>
                        </div>
                        <div className="detail-row universal-card-detail-row">
                          <span className="detail-label universal-card-detail-label">Max Attendees:</span>
                          <span className="detail-value universal-card-detail-value">{event.maxAttendees || 'No limit'}</span>
                        </div>
                      </div>
                      
                      <div className="event-actions universal-card-actions">
                        <button 
                          className="btn-details universal-card-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(event);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Back Side - Video Only */}
                  {event.videoUrl && (
                    <div className="flip-card-back">
                      <div className="event-video-container">
                        <video 
                          className="event-video"
                          src={event.videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          onError={(e) => {
                            console.error('Video failed to load:', event.videoUrl);
                            e.target.style.display = 'none';
                            const fallback = e.target.parentNode.querySelector('.video-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="video-fallback" style={{ display: 'none' }}>
                          <div className="universal-card-logo-text">Kalakritam</div>
                          <div className="universal-card-image-not-available">Video unavailable</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="no-results">
              <div className="no-results-content">
                <h3>No events found</h3>
                <p>Check back soon for upcoming art events and cultural experiences.</p>
              </div>
            </div>
          )}
          
          {/* Load More Button */}
          {currentPage < totalPages && (
            <div className="load-more-container" style={{ 
                textAlign: 'center', 
                margin: '4rem 0 3rem 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <button 
                  className="load-more-btn"
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    position: 'relative',
                    padding: '1rem 2.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    background: loadingMore 
                      ? 'linear-gradient(135deg, #8a6a15 0%, #b89560 100%)'
                      : 'linear-gradient(135deg, #c38f21 0%, #d4af85 100%)',
                    border: '2px solid rgba(195, 143, 33, 0.3)',
                    borderRadius: '50px',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: loadingMore 
                      ? '0 4px 15px rgba(195, 143, 33, 0.2)'
                      : '0 6px 25px rgba(195, 143, 33, 0.4)',
                    transform: loadingMore ? 'scale(0.98)' : 'scale(1)',
                    overflow: 'hidden',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                  onMouseEnter={(e) => !loadingMore && (e.target.style.transform = 'scale(1.05)', e.target.style.boxShadow = '0 8px 30px rgba(195, 143, 33, 0.5)')}
                  onMouseLeave={(e) => !loadingMore && (e.target.style.transform = 'scale(1)', e.target.style.boxShadow = '0 6px 25px rgba(195, 143, 33, 0.4)')}
                >
                  {loadingMore ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '3px solid #1a1a1a',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}></span>
                      Loading...
                    </span>
                  ) : (
                    `Load More Events`
                  )}
                </button>
                {!loadingMore && (
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#d4af85',
                    fontWeight: '500',
                    opacity: 0.8
                  }}>
                  Showing {events.length} of {totalItems} events • Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
          )}
        </main>

        <section className="events-info">
          <div className="info-content">
            <h2>Art Events & Cultural Experiences in Hyderabad</h2>
            <p>
              Join <strong>Kalakritam's vibrant art events in Hyderabad</strong> where creativity meets community. 
              Our events showcase traditional Indian art forms, contemporary expressions, and provide opportunities 
              to connect with artists and art enthusiasts. Experience art workshops, exhibitions, cultural gatherings, 
              and creative sessions in inspiring venues across Hyderabad. Each event is designed to foster artistic 
              growth, cultural appreciation, and community building through the power of art.
            </p>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
  );
};

export default Events;