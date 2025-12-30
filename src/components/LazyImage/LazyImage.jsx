import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { getMobileLazyConfig, shouldOptimizeForMobile, getNetworkOptimizations } from '../../utils/mobileOptimizations';
import './LazyImage.css';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad = () => {},
  onError = () => {},
  priority = false, // For critical above-fold images
  aspectRatio, // Optional aspect ratio (e.g., '16/9', '4/3', '1/1')
  blurPreview = true, // Show blur-up effect on load
  showLoadingProgress = false, // Show loading percentage
  retryOnError = true, // Retry loading on error
  maxRetries = 2, // Max retry attempts
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const imgRef = useRef();
  const containerRef = useRef();
  
  // Get mobile-optimized lazy loading configuration
  const isMobile = shouldOptimizeForMobile();
  const networkOpts = useMemo(() => getNetworkOptimizations(), []);
  const lazyConfig = useMemo(() => getMobileLazyConfig(), []);

  // Use IntersectionObserver for better performance on slow connections
  useEffect(() => {
    // For priority images or mobile, load more aggressively
    if (priority || isMobile) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.01, // Load almost immediately when entering viewport
        rootMargin: isMobile ? '200px' : '150px' // Load earlier - 200px before visible on mobile
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isMobile]);

  const handleLoad = useCallback(() => {
    setIsTransitioning(true);
    // Smooth transition delay for blur-up effect
    setTimeout(() => {
      setIsLoaded(true);
      setIsTransitioning(false);
      onLoad && onLoad();
    }, 50);
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (retryOnError && retryCount < maxRetries) {
      // Retry with exponential backoff
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setHasError(false);
      }, Math.pow(2, retryCount) * 1000);
    } else {
      setHasError(true);
      onError && onError();
    }
  }, [retryOnError, retryCount, maxRetries, onError]);

  // Optimize image URL for mobile/slow connections
  const optimizedSrc = useMemo(() => {
    if (!src) return '';
    if (src.startsWith('data:') || src.startsWith('blob:')) return src;
    
    // For slow connections, use lower quality
    if (networkOpts.lowerQuality && src.includes('r2.dev')) {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}w=400&q=60`;
    }
    
    return src;
  }, [src, networkOpts.lowerQuality, retryCount]); // Add retryCount to force re-fetch on retry

  // Compute container styles
  const containerStyle = useMemo(() => {
    const styles = {};
    if (aspectRatio) {
      styles.aspectRatio = aspectRatio;
    }
    return styles;
  }, [aspectRatio]);

  return (
    <div 
      ref={containerRef} 
      className={`lazy-image-container ${className} ${isLoaded ? 'is-loaded' : ''} ${isTransitioning ? 'is-transitioning' : ''}`}
      style={containerStyle}
      {...props}
    >
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'} ${blurPreview ? 'blur-up' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchpriority={priority ? "high" : "low"}
        />
      )}
      
      {(!isInView || !isLoaded) && !hasError && (
        <div className={`lazy-image-placeholder ${isTransitioning ? 'fade-out' : ''}`}>
          {placeholder || (
            <div className="lazy-image-skeleton">
              <div className="lazy-image-skeleton-shimmer"></div>
              <div className="lazy-image-skeleton-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {showLoadingProgress && loadProgress > 0 && (
                <div className="lazy-image-progress">
                  <div className="lazy-image-progress-bar" style={{ width: `${loadProgress}%` }} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {hasError && (
        <div className="lazy-image-error">
          <div className="lazy-image-error-content">
            <div className="lazy-image-error-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="lazy-image-error-text">Image unavailable</span>
            {retryOnError && retryCount < maxRetries && (
              <button 
                className="lazy-image-retry-btn"
                onClick={() => {
                  setRetryCount(prev => prev + 1);
                  setHasError(false);
                }}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
