import React, { useState, useEffect } from 'react';
import { X, Facebook, Instagram, Linkedin } from 'lucide-react';

const FullScreenMenu = ({ isMenuOpen, setIsMenuOpen }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(null);

  // Overlay & menu visibility states
  const [showOverlay, setShowOverlay] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Run the overlay animation when isMenuOpen toggles
  useEffect(() => {
    if (isMenuOpen) {
      // Start overlay
      setShowOverlay(true);
      setMenuVisible(false);
      // After 2s animation, hide overlay and show menu
      const timer = setTimeout(() => {
        setShowOverlay(false);
        setMenuVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Immediately hide both
      setShowOverlay(false);
      setMenuVisible(false);
    }
  }, [isMenuOpen]);

  const menuItems = [
    { title: 'Home', image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&h=800&fit=crop' },
    { title: 'About Us', image: 'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=600&h=800&fit=crop' },
    { title: 'Blogs', image: 'https://plus.unsplash.com/premium_photo-1750681051145-45991d0693ee?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=600&h=800&fit=crop' },
    { title: 'Contact', image: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=600&h=800&fit=crop' }
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

  return (
    <>
      {/* Sliding overlay animation */}
      {showOverlay && (
        <div className="fixed inset-0 z-150 bg-black animate-overlay" />
      )}

      {/* Main menu, shown after overlay */}
      {menuVisible && (
        <div className="fixed inset-0 z-140 h-screen flex transition-transform duration-500 ease-in-out translate-x-0">
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
                onClick={() => setIsMenuOpen(false)}
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
                    href="#"
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
                  {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
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
