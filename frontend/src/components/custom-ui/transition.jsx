import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const TransitionWrapper = (OgComponent) => {
  return (props) => {
    const location = useLocation();
    const [showOverlay, setShowOverlay] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const previousContent = useRef(null);
    const currentContent = useRef(null);

    useEffect(() => {
      // Capture current content before transition
      if (currentContent.current && !isTransitioning) {
        previousContent.current = currentContent.current.cloneNode(true);
      }

      // Start transition
      setIsTransitioning(true);
      setShowOverlay(true);
      
      // End transition
      const timer = setTimeout(() => {
        setShowOverlay(false);
        setIsTransitioning(false);
        previousContent.current = null;
      }, 2000);
      
      return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
      <>
        {/* Previous content frozen during transition */}
        {isTransitioning && previousContent.current && (
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              zIndex: 1,
              overflow: 'hidden'
            }}
            dangerouslySetInnerHTML={{ __html: previousContent.current.innerHTML }}
          />
        )}

        {/* Current component */}
        <div 
          ref={currentContent}
          style={{ 
            position: 'relative',
            zIndex: isTransitioning ? 0 : 1,
            visibility: isTransitioning ? 'hidden' : 'visible'
          }}
        >
          <OgComponent {...props} />
        </div>

        {/* Overlay */}
        {showOverlay && (
          <div 
            className="fixed inset-0 bg-black animate-overlay"
            style={{ zIndex: 9999 }}
          />
        )}

        <style jsx global>{`
          @keyframes overlaySlide {
            0% { transform: translateY(-100%); }
            30% { transform: translateY(0); }
            70% { transform: translateY(0); }
            100% { transform: translateY(100%); }
          }
          .animate-overlay {
            animation: overlaySlide 2s ease-in-out forwards;
          }
        `}</style>
      </>
    );
  };
};

export default TransitionWrapper;
