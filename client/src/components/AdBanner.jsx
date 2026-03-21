import React, { useEffect, useRef, useState } from 'react';

/**
 * AdBanner — lazy-loading Google AdSense unit.
 *
 * Uses IntersectionObserver so the ad only loads when it scrolls
 * into view. This prevents AdSense from slowing down the initial
 * page load or delaying the game from starting.
 *
 * Props:
 *   slot      — AdSense ad unit slot ID (get from AdSense dashboard)
 *   format    — 'auto' | 'fluid' | 'rectangle' | 'horizontal'
 *   style     — additional inline styles for the container
 *   className — additional Tailwind classes for the container
 *   label     — whether to show the "Advertisement" label (default true)
 */
export default function AdBanner({
  slot,
  format = 'auto',
  style = {},
  className = '',
  label = true,
  layoutKey = '',
}) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible]   = useState(false);
  const [adLoaded, setAdLoaded]     = useState(false);
  const [adFailed, setAdFailed]     = useState(false);
  const pushedRef = useRef(false);

  // Observe when container enters viewport
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // only need to trigger once
        }
      },
      { rootMargin: '200px', threshold: 0 } // start loading 200px before visible
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Push the ad unit once visible and adsbygoogle is ready
  useEffect(() => {
    if (!isVisible || pushedRef.current) return;
    if (typeof window === 'undefined') return;

    // Wait for adsbygoogle to be available
    const tryPush = () => {
      try {
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushedRef.current = true;
          setAdLoaded(true);
        } else {
          // AdSense script not yet loaded — retry after short delay
          setTimeout(tryPush, 300);
        }
      } catch (e) {
        console.warn('[AdBanner] AdSense push error:', e.message);
        setAdFailed(true);
      }
    };

    tryPush();
  }, [isVisible]);

  // Don't render if slot ID is a placeholder or invalid (prevents stray text in UI)
  const isValidSlot = slot && /^[0-9]+$/.test(slot);
  if (adFailed || !isValidSlot) return null;

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
      style={style}
      aria-label="Advertisement"
    >
      {/* Small "Advertisement" label — Google policy requires clear labelling */}
      {label && (
        <p className="text-center text-ink-600 text-[10px] uppercase tracking-widest mb-1 select-none">
          Advertisement
        </p>
      )}

      {/* Placeholder shown while ad is loading (prevents layout shift) */}
      {!adLoaded && isVisible && (
        <div className="w-full h-[90px] bg-ink-800 rounded-lg animate-pulse opacity-30" />
      )}

      {/* The actual AdSense ins tag — only rendered once visible */}
      {isVisible && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', ...style }}
          data-ad-client="ca-pub-6013677642304711"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
          {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        />
      )}
    </div>
  );
}
