import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { heroBannersApi } from '../../lib/adminApi';
import { useUserAuth } from '../../contexts/UserAuthContext';
import './HeroBanner.css';

const HeroBanner = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUserAuth();
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showCampaignButton, setShowCampaignButton] = useState(false);
  const videoRef = React.useRef(null);

  useEffect(() => {
    fetchActiveBanners();
  }, []);

  // Check campaign eligibility for logged-in users
  useEffect(() => {
    console.log('🔍 Campaign eligibility check:', { isAuthenticated, user });
    
    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated or no user');
      setShowCampaignButton(false);
      return;
    }

    // Check if user account was created today and hasn't participated
    const checkEligibility = () => {
      try {
        console.log('🔍 User object:', user);
        console.log('🔍 User properties:', Object.keys(user));
        
        // Check if user has already participated (stored in localStorage)
        const hasParticipated = localStorage.getItem(`campaign_participated_${user.id}`);
        console.log('🔍 Has participated:', hasParticipated);
        
        if (hasParticipated) {
          console.log('❌ User already participated');
          setShowCampaignButton(false);
          return;
        }

        // Check if account was created today
        // Try different possible field names for created date
        const createdAtField = user.created_at || user.createdAt || user.created || user.signup_date;
        console.log('🔍 Created at field:', createdAtField);
        
        if (!createdAtField) {
          console.log('⚠️ No created_at field found in user object');
          // For testing, show button anyway
          setShowCampaignButton(true);
          return;
        }
        
        const createdAt = new Date(createdAtField);
        const today = new Date();
        
        console.log('🔍 Created date:', createdAt);
        console.log('🔍 Today:', today);
        
        const isToday = 
          createdAt.getDate() === today.getDate() &&
          createdAt.getMonth() === today.getMonth() &&
          createdAt.getFullYear() === today.getFullYear();

        console.log('🔍 Is today?', isToday);

        if (isToday) {
          console.log('✅ Showing campaign button!');
          setShowCampaignButton(true);
        } else {
          console.log('❌ Account not created today');
          setShowCampaignButton(false);
        }
      } catch (error) {
        console.error('❌ Error checking campaign eligibility:', error);
      }
    };

    checkEligibility();
  }, [isAuthenticated, user]);

  const fetchActiveBanners = async () => {
    try {
      setLoading(true);
      const response = await heroBannersApi.getActive();
      if (response.success && response.data && response.data.length > 0) {
        setBanners(response.data);
        setError(null);
      } else {
        setBanners([]);
      }
    } catch (err) {
      console.error('Error fetching hero banners:', err);
      setError('Failed to load banners');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-rotate banners every 5 seconds (but pause for videos)
  useEffect(() => {
    if (banners.length <= 1) return;
    if (isVideoPlaying) return; // Don't auto-rotate while video is playing

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, isVideoPlaying]);

  const handlePrevious = () => {
    // Stop video if playing
    if (videoRef.current && isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    // Stop video if playing
    if (videoRef.current && isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  const handleDotClick = (index) => {
    // Stop video if playing
    if (videoRef.current && isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
    setCurrentIndex(index);
  };

  const handleBannerClick = () => {
    const currentBanner = banners[currentIndex];
    if (currentBanner?.link_url) {
      window.location.href = currentBanner.link_url;
    }
  };

  const handleShowInterest = (e) => {
    e.stopPropagation();
    navigate('/show-interest');
  };

  // Don't render if loading, error, or no banners
  if (loading || error || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  // Handle video end - advance to next slide
  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
    if (banners.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }
  };

  // Handle video start
  const handleVideoStart = () => {
    setIsVideoPlaying(true);
  };

  return (
    <div className="hero-banner-container">
      <div 
        className={`hero-banner ${currentBanner.link_url ? 'clickable' : ''}`}
        onClick={handleBannerClick}
      >
        {currentBanner.media_type === 'video' ? (
          <video
            ref={videoRef}
            className="hero-banner-media"
            src={currentBanner.media_url}
            autoPlay
            muted
            playsInline
            onPlay={handleVideoStart}
            onEnded={handleVideoEnd}
            onPause={() => setIsVideoPlaying(false)}
          />
        ) : (
          <img
            className="hero-banner-media"
            src={currentBanner.media_url}
            alt={currentBanner.title || 'Hero Banner'}
            loading="eager"
          />
        )}

        {/* Gradient overlay for better text visibility */}
        <div className="hero-banner-overlay"></div>

        {/* Banner title if available */}
        {currentBanner.title && (
          <div className="hero-banner-content">
            <h2 className="hero-banner-title">{currentBanner.title}</h2>
          </div>
        )}

        {/* Campaign Button for Eligible Users */}
        {showCampaignButton && (
          <div className="campaign-button-container">
            <button 
              className="show-interest-banner-btn"
              onClick={handleShowInterest}
            >
              <span className="btn-icon">⭐</span>
              <span className="btn-text">Show Interest</span>
              <span className="btn-subtext">Win ₹1,299 Free Pass</span>
            </button>
          </div>
        )}

        {/* Navigation arrows for multiple banners */}
        {banners.length > 1 && (
          <>
            <button 
              className="hero-banner-arrow hero-banner-arrow-left"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              aria-label="Previous banner"
            >
              ‹
            </button>
            <button 
              className="hero-banner-arrow hero-banner-arrow-right"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next banner"
            >
              ›
            </button>

            {/* Dots indicator */}
            <div className="hero-banner-dots">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`hero-banner-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDotClick(index);
                  }}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HeroBanner;
