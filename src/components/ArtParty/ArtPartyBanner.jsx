import React from 'react';
import './ArtPartyBanner.css';

// Continuous sliding banner for landscape images
// Props:
// - images: string[] of image URLs (recommended landscape)
// - height: optional CSS size to override default aspect-ratio height
// - speedSec: number of seconds for one full loop
// - gap: CSS size for gap between slides (e.g., '16px')
const ArtPartyBanner = ({
  images = ['/images/og-image.jpg', '/images/twitter-card.jpg'],
  height,
  speedSec = 40,
  gap = '16px',
}) => {
  // Ensure we have at least one image; duplicate to create seamless loop
  const slides = images.length > 0 ? images : ['/images/og-image.jpg'];
  const loopSlides = [...slides, ...slides];

  return (
    <div
      className="ap-banner-marquee"
      style={{
        ...(height ? { ['--ap-height']: height } : {}),
        ['--ap-gap']: gap,
        ['--ap-duration']: `${speedSec}s`,
      }}
      aria-label="Art party banner carousel"
    >
      <div className="ap-marquee-track">
        {loopSlides.map((src, idx) => (
          <div className="ap-slide" key={`${src}-${idx}`}>
            <img className="ap-slide-img" src={src} alt="Art party banner" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtPartyBanner;
