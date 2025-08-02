import React, { useState, useEffect } from 'react';
import { X, Facebook, Instagram, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FullScreenMenu = ({ isMenuOpen, setIsMenuOpen }) => {
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(null);

  // Animation states
  const [showOverlay, setShowOverlay] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      // Start overlay animation immediately
      setShowOverlay(true);
      
      // Show menu during the middle of overlay animation (when screen is fully covered)
      // This happens at 30% of the animation (around 0.6s when overlay is stationary and covering screen)
      const menuTimer = setTimeout(() => {
        setShowMenu(true);
      }, 600); // Menu appears when overlay is fully covering the screen
      
      // Remove overlay after animation completes
      const overlayTimer = setTimeout(() => {
        setShowOverlay(false);
      }, 2000);
      
      return () => {
        clearTimeout(menuTimer);
        clearTimeout(overlayTimer);
      };
    } else {
      // Hide everything immediately
      setShowOverlay(false);
      setShowMenu(false);
    }
  }, [isMenuOpen]);

  // Define menu items with paths
  const menuItems = [
    { title: 'Home', path: '/', image: 'https://cdn.align-alternativetherapy.com/static-pages-media/anh-tuan-thomas-w5m0E6SogmM-unsplash.jpg' },
    { title: 'About Us', path: '/about', image: 'https://cdn.align-alternativetherapy.com/static-pages-media/pexels-egoagency-7745134.jpg' },
    { title: 'Blogs', path: '/blog', image: 'https://cdn.align-alternativetherapy.com/static-pages-media/pexels-pavel-danilyuk-7802305.jpg' },
    { title: 'Contact', path: '/contact-us', image: 'https://cdn.align-alternativetherapy.com/static-pages-media/photo-1423666639041-f56000c27a9a.jpeg' }
  ];

  const handleMenuItemHover = (index) => {
    if (index !== currentImage) {
      setNextImageIndex(index);
      setTimeout(() => {
        setCurrentImage(index);
        setNextImageIndex(null);
      }, 800);
    }
  };

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Main menu - renders only when overlay is covering screen */}
      {showMenu && (
        <div className="fixed inset-0 z-140 h-screen flex">
          {/* Left Section - Image (40%) */}
          <div className="w-2/5 relative overflow-hidden">
            <img
              src={menuItems[currentImage].image}
              alt="Background"
              className="w-full h-full object-cover"
            />
            {nextImageIndex !== null && (
              <div
                className="absolute inset-0 w-full h-full animate-clipPath"
                style={{ background: `url(${menuItems[nextImageIndex].image}) center/cover` }}
              />
            )}
            <div className="absolute inset-0 bg-black/40 z-20" />
            <div className="absolute bottom-8 left-8 z-20">
              <div className="text-5xl font-bold text-white tracking-wider">ALIGN</div>
              <div className="text-white/80 text-lg mt-2">Mind • Body • Soul</div>
            </div>
          </div>

          {/* Right Section - Menu (60%) */}
          <div className="w-3/5 bg-black h-full flex flex-col justify-between relative">
            {/* Close Button */}
            <div className="absolute top-8 right-8 z-30">
              <button
                onClick={handleClose}
                className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:rotate-90"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Vertical Menu Items - Centered */}
            <nav className="flex-1 flex flex-col justify-center items-end px-12 py-12 overflow-hidden">
              <div className="space-y-6">
                {menuItems.map((item, index) => (
                  <a
                    key={item.title}
                    href={item.path}
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setIsMenuOpen(false);
                      navigate(item.path);
                    }}
                    className="group relative block text-white hover:text-red-400 transition-all duration-300"
                    onMouseEnter={() => handleMenuItemHover(index)}
                  >
                    <div className="flex items-center justify-between gap-2.5 py-4">
                      <span className="text-6xl font-light tracking-wide group-hover:translate-x-6 transition-transform duration-300">{item.title}</span>
                      <span className="text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-8 group-hover:translate-x-0">→</span>
                    </div>
                  </a>
                ))}
              </div>
            </nav>

            {/* Contact Information & Social Icons */}
            <div className="px-12 py-2 border-t border-white/20">
              <div className="flex justify-between items-end">
                <div className="text-white/70 space-y-1">
                  <p className="text-base font-light">t. +1 (647) 897-8834</p>
                  <p className="text-base font-light">e. contact@align-alternativetherapy.com</p>
                  <p className="text-xs text-white/50 mt-3">Vancouver, BC, Canada</p>
                </div>
                <div className="flex gap-4">
                  {[Instagram].map((Icon, i) => (
                    <a
                      key={i}
                      href="https://www.instagram.com/alignalternativetherapy?igsh=a2VjN2RyZGtlcGMx"
                      target='blank'
                      className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1"
                    >
                      <Icon size={18} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sliding overlay animation - highest z-index */}
      {showOverlay && (
        <div className="fixed inset-0 z-150 bg-black animate-overlay" />
      )}

      {/* Global styles for animations */}
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
        @keyframes clipPath {
          from { clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); }
          to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
        }
        .animate-clipPath { animation: clipPath 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </>
  );
};

export default FullScreenMenu;
