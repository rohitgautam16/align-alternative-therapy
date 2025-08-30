import React, { useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContactCTABanner = () => {
  const navigate = useNavigate();
  
  // Use refs to track mouse position without causing re-renders
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef(null);
  const isMobileRef = useRef(false);
  
  // Refs for parallax elements
  const image1Ref = useRef(null);
  const image2Ref = useRef(null);
  const image3Ref = useRef(null);
  const image4Ref = useRef(null);

  // Check if device is mobile/tablet
  React.useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 1024;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Optimized mouse move handler with requestAnimationFrame
  const handleMouseMove = useCallback((e) => {
    // Disable parallax on mobile devices for better performance
    if (isMobileRef.current) return;
    
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Normalize mouse position to -1 to 1 range
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;
    
    // Update ref without triggering re-render
    mouseRef.current = { x, y };
    
    // Cancel previous animation frame if it exists
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Use requestAnimationFrame for smooth updates
    animationRef.current = requestAnimationFrame(() => {
      updateParallaxElements();
    });
  }, []);

  // Update transform values directly on DOM elements
  const updateParallaxElements = useCallback(() => {
    if (isMobileRef.current) return;
    
    const { x, y } = mouseRef.current;
    
    // Apply transforms with different intensities to create parallax effect
    if (image1Ref.current) {
      const moveX = x * 15;
      const moveY = y * 15;
      image1Ref.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    }
    
    if (image2Ref.current) {
      const moveX = x * 8;
      const moveY = y * 8;
      image2Ref.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    }
    
    if (image3Ref.current) {
      const moveX = x * 10;
      const moveY = y * 10;
      image3Ref.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    }
    
    if (image4Ref.current) {
      const moveX = x * 18;
      const moveY = y * 18;
      image4Ref.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    }
  }, []);

  // Setup event listeners only once
  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleMouseMove]);

  // Unsplash images for interior design
  const interior1 = 'https://cdn.align-alternativetherapy.com/static-pages-media/pexels-elly-fairytale-3822623.jpg';
  const interior2 = 'https://cdn.align-alternativetherapy.com/static-pages-media/aaron-blanco-tejedor-nQtbM_cG7Pk-unsplash.jpg';
  const interior3 = 'https://cdn.align-alternativetherapy.com/static-pages-media/pexels-fotios-photos-3972467.jpg';
  const interior4 = 'https://cdn.align-alternativetherapy.com/static-pages-media/pexels-fotios-photos-1036372.jpg';

  const handleClick = useCallback(() => {
    navigate("/contact-us");
  }, [navigate]);
  
  return (
    <section className="relative h-fit bg-black overflow-hidden py-8 sm:py-10 lg:py-20">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--luxury-surface))_1px,transparent_1px)] bg-[length:20px_20px] sm:bg-[length:32px_32px] opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        {/* Mobile Layout: Column with images at top, text below */}
        <div className="lg:hidden flex flex-col items-center py-6 space-y-10">
          {/* Images: stacked & overlapped */}
          <div className="relative w-full max-w-[520px] mx-auto pt-6 pb-8">
            <div className="relative h-[260px] sm:h-[300px]">
              {/* Left stack */}
              <div className="absolute left-6 top-1 w-32 h-44 sm:w-42 sm:h-50 rounded-2xl overflow-hidden shadow-xl shadow-black/30 rotate-[-3deg] z-10">
                <img src={interior1} alt="Modern luxury living room" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              <div className="absolute left-1 top-30 w-32 h-44 sm:w-42 sm:h-50 rounded-2xl overflow-hidden shadow-lg shadow-black/20 rotate-[-6deg] z-0">
                <img src={interior3} alt="Modern dining room" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Right stack */}
              <div className="absolute right-6 top-1 w-32 h-44 sm:w-42 sm:h-50 rounded-2xl overflow-hidden shadow-xl shadow-black/30 rotate-[4deg] z-20">
                <img src={interior2} alt="Luxury modern kitchen" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              <div className="absolute right-1 top-30 w-32 h-44 sm:w-42 sm:h-50 rounded-2xl overflow-hidden shadow-lg shadow-black/20 rotate-[1deg] z-10">
                <img src={interior4} alt="Luxurious modern bedroom" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>
          </div>

          {/* Text (tighter spacing) */}
          <div className="text-center space-y-4 max-w-sm mx-auto px-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-0.5 bg-luxury-accent" />
              <h3 className="text-white uppercase tracking-[0.18em] text-[10px] font-light">✦ Contact ✦</h3>
              <div className="w-5 h-0.5 bg-luxury-accent" />
            </div>

            <div className="space-y-1">
              <h1 className="text-[22px] sm:text-2xl font-thin text-white leading-snug">
                Take the First Step &<br />
                <span className="font-light italic text-white">Transform Your Vision</span><br />
                into Reality!
              </h1>
            </div>

            <div className="pt-2">
              <button
                className="group inline-flex items-center px-5 py-2.5 text-sm bg-white text-black font-light rounded-full transition-all duration-300 hover:shadow-lg active:scale-95"
                onClick={handleClick}
              >
                GET IN TOUCH
                <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>



        {/* Desktop Layout: Original side-by-side layout */}
        <div className="hidden lg:block">
          <div className="relative h-auto flex items-center justify-center py-20">
            
            {/* Left side images - overlapping */}
            <div className="absolute left-12 top-1/2 transform -translate-y-1/2">
              {/* Back image (lower z-index) */}
              <div 
                ref={image3Ref}
                className="relative overflow-hidden rounded-2xl group w-44 h-54 transition-transform duration-300 ease-out"
                style={{ 
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                <img 
                  src={interior3} 
                  alt="Modern dining room" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
                  style={{ 
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark/40 to-transparent"></div>
              </div>
              
              {/* Front image (higher z-index) */}
              <div 
                ref={image1Ref}
                className="absolute -top-40 right-16 z-10 overflow-hidden rounded-2xl group w-44 h-54 transition-transform duration-300 ease-out"
                style={{ 
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                <img 
                  src={interior1} 
                  alt="Modern luxury living room" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
                  style={{ 
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark/40 to-transparent"></div>
              </div>
            </div>

            {/* Right side images - overlapping */}
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              {/* Back image (lower z-index) */}
              <div 
                ref={image4Ref}
                className="relative overflow-hidden rounded-2xl group w-44 h-54 transition-transform duration-300 ease-out"
                style={{ 
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                <img 
                  src={interior4} 
                  alt="Luxurious modern bedroom" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
                  style={{ 
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark/40 to-transparent"></div>
              </div>
              
              {/* Front image (higher z-index) */}
              <div 
                ref={image2Ref}
                className="absolute -top-40 left-16 z-10 overflow-hidden rounded-2xl group w-44 h-54 transition-transform duration-300 ease-out"
                style={{ 
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                <img 
                  src={interior2} 
                  alt="Luxury modern kitchen" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125"
                  style={{ 
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark/40 to-transparent"></div>
              </div>
            </div>

            {/* Center content */}
            <div className="text-center space-y-8 max-w-2xl mx-auto z-10">
              {/* Contact label */}
              <div className="flex items-center justify-center gap-4">
                <div className="w-8 h-0.5 bg-luxury-accent"></div>
                <h3 className="text-white uppercase tracking-[0.2em] text-sm font-light">
                  ✦ Contact ✦
                </h3>
                <div className="w-8 h-0.5 bg-luxury-accent"></div>
              </div>

              {/* Main heading */}
              <div className="space-y-2">
                <h1 className="text-4xl xl:text-5xl font-thin text-white leading-normal">
                  Take the First Step &
                  <br />
                  <span className="font-light italic text-white">
                    Transform Your Vision
                  </span>
                  <br />
                  into Reality!
                </h1>
              </div>

              {/* CTA Button */}
              <div className="pt-3">
                <button 
                  className="group inline-flex items-center px-8 py-4 text-sm bg-white text-black font-light rounded-full transition-all duration-300 hover:shadow-lg cursor-pointer active:scale-95"
                  onClick={handleClick}
                  style={{ 
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  GET IN TOUCH
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-16 sm:top-20 right-8 sm:right-20 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-luxury-accent rounded-full animate-pulse opacity-60"></div>
      <div className="absolute bottom-32 sm:bottom-40 left-8 sm:left-20 w-1 h-1 bg-luxury-gold rounded-full animate-pulse opacity-40"></div>
      <div className="absolute top-1/2 right-4 sm:right-10 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-luxury-accent rounded-full animate-pulse opacity-50"></div>
    </section>
  );
};

export default ContactCTABanner;
