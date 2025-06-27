import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const TransitionWrapper = (OgComponent) => {
  return (props) => {
    const location = useLocation();
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
      // Trigger overlay on each navigation
      setShowOverlay(true);
      const timer = setTimeout(() => setShowOverlay(false), 1000); // duration matches transition
      return () => clearTimeout(timer);
    }, [location.pathname]);

    const overlayVariants = {
  hidden: { y: '-100%' },       // start off-screen at top
  visible: {                     // slide down into view
    y: '0%',
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {                        // slide up out of view after delay
    y: '-100%',
    transition: { delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }
  },
};

    return (
      <>
        <OgComponent {...props} />

        {/* Overlay animation */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                backgroundColor: '#000000',
                zIndex: 9999,
              }}
            />
          )}
        </AnimatePresence>
      </>
    );
  };
};

export default TransitionWrapper;
