import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../contexts/UserAuthContext';
import { toast } from '../../utils/notifications.js';
import './ShowInterest.css';

const ShowInterest = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUserAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to participate');
      navigate('/user/login');
      return;
    }

    // Check if user already participated (from localStorage)
    const hasParticipated = localStorage.getItem(`campaign_participated_${user?.id}`);
    if (hasParticipated) {
      toast.info('You have already participated in this campaign');
      navigate('/home');
      return;
    }

    // Check if account was created today
    // Try different possible field names for created date
    const createdAtField = user?.created_at || user?.createdAt || user?.created || user?.signup_date;
    
    console.log('🔍 ShowInterest - User object:', user);
    console.log('🔍 ShowInterest - Created at field:', createdAtField);
    
    if (!createdAtField) {
      console.log('⚠️ ShowInterest - No created_at field found, allowing campaign anyway');
      // If no created_at field, allow the campaign (for testing/compatibility)
      return;
    }
    
    const createdAt = new Date(createdAtField);
    const today = new Date();
    
    console.log('🔍 ShowInterest - Created date:', createdAt);
    console.log('🔍 ShowInterest - Today:', today);
    
    const isToday = 
      createdAt.getDate() === today.getDate() &&
      createdAt.getMonth() === today.getMonth() &&
      createdAt.getFullYear() === today.getFullYear();

    console.log('🔍 ShowInterest - Is today?', isToday);

    if (!isToday) {
      console.log('❌ ShowInterest - Account not created today, redirecting');
      toast.info('This campaign is only available for new users');
      navigate('/home');
    }
  }, [isAuthenticated, navigate, user]);

  const handleShowInterest = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Store participation in localStorage
      localStorage.setItem(`campaign_participated_${user.id}`, 'true');
      localStorage.setItem(`campaign_participation_date_${user.id}`, new Date().toISOString());

      // Start the animation
      setShowAnimation(true);

      // After animation completes, show success message
      setTimeout(() => {
        setShowAnimation(false);
        setShowSuccess(true);

        // Redirect to home after showing message
        setTimeout(() => {
          navigate('/home');
        }, 4000);
      }, 3000);
    } catch (error) {
      console.error('Error showing interest:', error);
      toast.error('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="show-interest-container">
      {!showSuccess && !showAnimation && (
        <div className="show-interest-content">
          <div className="interest-header">
            <h1 className="interest-title">Special Launch Offer!</h1>
            <div className="prize-badge">
              <span className="prize-label">Win</span>
              <span className="prize-amount">₹1,299</span>
              <span className="prize-desc">Free Pass</span>
            </div>
          </div>

          <div className="interest-details">
            <h2>Exclusive Benefits</h2>
            <ul className="benefits-list">
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Access to exclusive art workshops</span>
              </li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Meet renowned artists</span>
              </li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Priority booking for events</span>
              </li>
              <li>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Special discounts on art pieces</span>
              </li>
            </ul>

            <div className="announcement-date">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Winner will be announced on <strong>01-11-2025</strong></span>
            </div>
          </div>

          <button 
            className="show-interest-btn"
            onClick={handleShowInterest}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Show Interest'}
          </button>
        </div>
      )}

      {showAnimation && (
        <div className="animation-container">
          <div className="golden-ticket">
            <div className="ticket-shine"></div>
            <div className="ticket-content">
              <span className="ticket-icon">🎫</span>
              <span className="ticket-text">Golden Ticket</span>
            </div>
          </div>
          <div className="treasure-box">
            <div className="box-lid"></div>
            <div className="box-body"></div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="success-message">
          <div className="success-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2>Thank You for Participating!</h2>
          <p>You've successfully entered the Show Interest Campaign</p>
          <div className="winner-announcement">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Winner will be announced on <strong>01-11-2025</strong></span>
          </div>
          <p className="redirect-message">Redirecting to home...</p>
        </div>
      )}
    </div>
  );
};

export default ShowInterest;
