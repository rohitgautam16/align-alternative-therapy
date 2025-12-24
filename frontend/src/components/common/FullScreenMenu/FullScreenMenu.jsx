// src/components/navigation/FullScreenMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Instagram } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FullScreenMenu = ({ isMenuOpen, setIsMenuOpen }) => {
  const navigate = useNavigate();

  // Menu items
  const menuItems = [
    { title: 'Home', path: '/', image: 'https://cdn.align-alternativetherapy.com/static-pages-media/anh-tuan-thomas-w5m0E6SogmM-unsplash.jpg' },
    { title: 'About Us', path: '/about', image: 'https://cdn.align-alternativetherapy.com/static-pages-media/pexels-egoagency-7745134.jpg' },
    { title: 'Blogs', path: '/blog', image: 'https://cdn.align-alternativetherapy.com/static-pages-media/pexels-pavel-danilyuk-7802305.jpg' },
    { title: 'Contact', path: '/contact-us', image: 'https://cdn.align-alternativetherapy.com/static-pages-media/photo-1423666639041-f56000c27a9a.jpeg' },
    { title: 'Pricing', path: '/pricing', image: 'https://cdn.align-alternativetherapy.com/static-pages-media/photo-1423666639041-f56000c27a9a.jpeg' }
  ];

  // Left preview image states
  const [currentImage, setCurrentImage] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(null);
  const [animKey, setAnimKey] = useState(0); // remount overlay to restart CSS animation

  // rAF throttle
  const hoverQueued = useRef(null);
  const rafId = useRef(0);

  // Overlay/Menu visibility
  const [showOverlay, setShowOverlay] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Desktop check (for preview behavior)
  const isDesktopRef = useRef(false);
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const update = () => { isDesktopRef.current = mql.matches; };
    update();
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);

  // Open/close animation scheduling
  useEffect(() => {
    if (isMenuOpen) {
      setShowOverlay(true);
      const menuTimer = setTimeout(() => setShowMenu(true), 600);
      const overlayTimer = setTimeout(() => setShowOverlay(false), 2000);
      return () => { clearTimeout(menuTimer); clearTimeout(overlayTimer); };
    } else {
      setShowOverlay(false);
      setShowMenu(false);
    }
  }, [isMenuOpen]);

  // Preload images
  useEffect(() => {
    menuItems.forEach(item => {
      const img = new Image();
      img.src = item.image;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hover → preview (desktop only)
  const handleMenuItemHover = (index) => {
    if (!isDesktopRef.current) return;
    if (index === currentImage) return;

    hoverQueued.current = index;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        const idx = hoverQueued.current;
        rafId.current = 0;
        hoverQueued.current = null;
        setNextImageIndex(idx);
        setAnimKey(k => k + 1);
      });
    }
  };

  // Commit preview after clip anim completes
  const handleRevealEnd = () => {
    if (nextImageIndex == null) return;
    setCurrentImage(nextImageIndex);
    setNextImageIndex(null);
  };

  const handleClose = () => setIsMenuOpen(false);

  return (
    <>
      {showMenu && (
        <div className="fixed inset-0 z-140 h-svh max-h-svh bg-black flex">
          {/* LEFT: Image column (hidden on mobile; visible on lg+) */}
          <div className="hidden md:block lg:block lg:w-2/5 relative overflow-hidden">
            <img
              src={menuItems[currentImage].image}
              alt="Background"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              style={{ transform: 'translateZ(0)' }}
            />

            {nextImageIndex !== null && (
              <div
                key={animKey}
                className="absolute inset-0 w-full h-full animate-clipPath"
                style={{
                  background: `url(${menuItems[nextImageIndex].image}) center/cover`,
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                }}
                onAnimationEnd={handleRevealEnd}
              />
            )}

            <div className="absolute inset-0 bg-black/40 z-20" />
            <div className="absolute bottom-8 left-8 z-20">
              <div className="text-5xl font-bold text-white tracking-wider">ALIGN</div>
              <div className="text-white/80 text-lg mt-2">Mind • Body • Soul</div>
            </div>
          </div>

          {/* RIGHT: Menu (full width on mobile, 60% on lg+) */}
          <div className="w-full lg:w-3/5 bg-black relative flex flex-col" style={{ minHeight: 0 }}>
            {/* Close */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-30">
              <button
                onClick={handleClose}
                className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:rotate-90"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable content (items only) */}
            <nav className="flex-1 overflow-y-auto px-6 sm:px-10 lg:px-12 py-6 lg:py-12" style={{ minHeight: 0 }}>
              <div className="w-full flex flex-col justify-end min-h-full">
                {menuItems.map((item, index) => (
                  <a
                    key={item.title}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsMenuOpen(false);
                      navigate(item.path);
                    }}
                    className="group relative block text-white transition-all duration-300"
                    onMouseEnter={() => handleMenuItemHover(index)}
                    onPointerEnter={() => handleMenuItemHover(index)}
                  >
                    <div className="flex items-center justify-end gap-4.5 py-4 sm:py-5 lg:py-4">
                      <span className="text-6xl sm:text-6xl lg:text-5xl xl:text-7xl font-light text-left tracking-wide transition-transform duration-300 group-hover:translate-x-2 sm:group-hover:translate-x-4">
                        {item.title}
                      </span>
                      <span className="text-lg sm:text-xl lg:text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                        →
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </nav>

            {/* Sticky footer */}
            <div className="px-6 sm:px-10 lg:px-12 py-4 border-t border-white/15 shrink-0">
              <div className="flex flex-row sm:items-end justify-between gap-3">
                <div className="text-white/70 space-y-1">
                  <p className="text-sm sm:text-base font-light">t. +1 (647) 897-8834</p>
                  <p className="text-sm sm:text-base font-light">e. contact@align-alternativetherapy.com</p>
                  <p className="text-[11px] sm:text-xs text-white/50 mt-2">Vancouver, BC, Canada</p>
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <a
                    href="https://www.instagram.com/alignalternativetherapy?igsh=a2VjN2RyZGtlcGMx"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-secondary transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5"
                    aria-label="Instagram"
                  >
                    <Instagram size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOverlay && <div className="fixed inset-0 z-150 bg-black animate-overlay" />}

      {/* Animations */}
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
          to   { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
        }
        .animate-clipPath {
          animation: clipPath 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: clip-path;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-clipPath { animation-duration: 0.01ms; animation-iteration-count: 1; }
          .animate-overlay { animation-duration: 0.01ms; animation-iteration-count: 1; }
        }
      `}</style>
    </>
  );
};

export default FullScreenMenu;
