// src/components/custom-ui/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 * - call with <ScrollToTop delay={0} /> (delay in ms)
 * - default tries immediate; if animations/layout push scroll later, increase delay (e.g. 100-200)
 */
export default function ScrollToTop({ delay = 0 }) {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser auto-restoration once (safer for SPA routing)
    if ('scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual';
      } catch (e) {
        // some browsers might throw in some contexts
      }
    }
  }, []);

  useEffect(() => {
    // function that aggressively resets scroll
    const doScrollTop = () => {
      // recommended APIs
      if (typeof window.scrollTo === 'function') {
        window.scrollTo(0, 0);
      }
      // backup targets
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };

    if (!delay) {
      // try immediate plus RAF double-step to beat layout/animations
      doScrollTop();
      requestAnimationFrame(() => {
        doScrollTop();
        requestAnimationFrame(doScrollTop);
      });
      // safety fallback
      const t = setTimeout(doScrollTop, 50);
      return () => clearTimeout(t);
    } else {
      // If a delay is requested (ms), wait then do the aggressive scroll
      const timer = setTimeout(() => {
        doScrollTop();
        requestAnimationFrame(() => {
          doScrollTop();
          requestAnimationFrame(doScrollTop);
        });
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [pathname, delay]);

  return null;
}
