import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Home, Music2Icon } from 'lucide-react';
import BinuralBeats from "../../assets/images/binural beats.jpg";

gsap.registerPlugin(ScrollTrigger);

// Set global performance optimizations
gsap.ticker.lagSmoothing(1000, 16);

const AnimatedCTA = () => {
  const bannerRef = useRef(null);
  const contentRef = useRef(null);
  const imageRef = useRef(null);
  const ctaButtonRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/pricing');
  };

  useGSAP(() => {
    const banner = bannerRef.current;
    const content = contentRef.current;
    const image = imageRef.current;
    const ctaButton = ctaButtonRef.current;
    const container = containerRef.current;

    if (!banner || !content || !image || !ctaButton || !container) return;

    // Set initial states
    gsap.set([content.children], {
      y: 60,
      opacity: 0,
    });

    gsap.set(image, {
      scale: 1.1,
      opacity: 0,
      x: 50,
    });

    gsap.set(ctaButton, {
      y: 40,
      opacity: 0,
    });

    // Set initial scale for container
    gsap.set(container, {
      scale: 0.7,
    });

    // Container scale animation on scroll
    gsap.to(container, {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: banner,
        start: 'top 100%',
        end: 'top 50%',
        scrub: 1,
      },
    });

    // Create main timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: banner,
        start: 'top 85%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
        fastScrollEnd: true,
      },
    });

    // Animate content first
    tl.to(
      content.children,
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.3,
        ease: 'power3.out',
      }
    );

    // Animate CTA button
    tl.to(
      ctaButton,
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'back.out(1.7)',
      },
      '-=0.8'
    );

    // Animate image
    tl.to(
      image,
      {
        scale: 1,
        opacity: 1,
        x: 0,
        duration: 1.4,
        ease: 'power3.out',
      },
      '-=1.2'
    );

    // Subtle parallax on image
    gsap.to(image, {
      yPercent: -5,
      ease: 'none',
      scrollTrigger: {
        trigger: banner,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });

    // Image hover animation
    if (image) {
      const imageElement = image.querySelector('img');
      
      const handleImageMouseEnter = () => {
        gsap.to(imageElement, {
          scale: 1.1,
          duration: 0.6,
          ease: 'power2.out',
        });
      };

      const handleImageMouseLeave = () => {
        gsap.to(imageElement, {
          scale: 1,
          duration: 0.6,
          ease: 'power2.out',
        });
      };

      image.addEventListener('mouseenter', handleImageMouseEnter);
      image.addEventListener('mouseleave', handleImageMouseLeave);

      // Cleanup event listeners
      return () => {
        image.removeEventListener('mouseenter', handleImageMouseEnter);
        image.removeEventListener('mouseleave', handleImageMouseLeave);
      };
    }

    // CTA Button hover animation
    if (ctaButton) {
      const buttonIcon = ctaButton.querySelector('.cta-icon');
      
      const handleButtonMouseEnter = () => {
        gsap.to(ctaButton, {
          scale: 1.05,
          duration: 0.3,
          ease: 'power2.out',
        });
        
        if (buttonIcon) {
          gsap.to(buttonIcon, {
            x: 4,
            duration: 0.3,
            ease: 'power2.out',
          });
        }
      };

      const handleButtonMouseLeave = () => {
        gsap.to(ctaButton, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        });
        
        if (buttonIcon) {
          gsap.to(buttonIcon, {
            x: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
        }
      };

      ctaButton.addEventListener('mouseenter', handleButtonMouseEnter);
      ctaButton.addEventListener('mouseleave', handleButtonMouseLeave);

      // Cleanup event listeners
      return () => {
        ctaButton.removeEventListener('mouseenter', handleButtonMouseEnter);
        ctaButton.removeEventListener('mouseleave', handleButtonMouseLeave);
      };
    }

  }, { scope: bannerRef });

  return (
    <section
      ref={bannerRef}
      className="relative bg-black text-white py-16 lg:py-24 px-16 overflow-hidden"
      style={{ willChange: 'transform' }}
    >
      {/* Background decorative elements */}
      {/* <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/5 w-64 h-64 bg-blue-400 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gray-400 rounded-full blur-xl"></div>
      </div> */}

      {/* Grid pattern overlay */}
      {/* <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div> */}

      <div className="relative z-10 container mx-auto px-6">
        <div 
          ref={containerRef}
          className="bg-secondary/20 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/10 shadow-2xl"
          style={{ 
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div 
              ref={contentRef} 
              className="space-y-8"
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/20">
                <Music2Icon className="w-4 h-4" />
                Premium Therapy Sounds
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl lg:text-5xl font-light leading-tight">
                Unlimited Music{' '}
                <span className="font-medium bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  at Your{' '}
                </span>
                Fingertips{' '}
              </h1>

              {/* CTA Button */}
              <button
                ref={ctaButtonRef}
                onClick={handleNavigate}
                className="group bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 border border-white/20 hover:border-white/40 hover:shadow-lg hover:shadow-white/25"
                style={{ 
                  willChange: 'transform, opacity',
                  transform: 'translateZ(0)'
                }}
              >
                Join Now
                <ArrowRight className="cta-icon inline-block w-5 h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Image */}
            <div className="relative">
              <div
                ref={imageRef}
                className="relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                style={{ 
                  willChange: 'transform, opacity',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                <img
                  src={BinuralBeats}
                  alt="Luxurious modern house with stunning architecture at night"
                  className="w-full h-[300px] lg:h-[400px] object-cover transition-transform duration-600"
                  style={{ 
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>

              {/* Floating accent elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-400/20 rounded-full blur-lg"></div>
              
              {/* Geometric accent */}
              <div className="absolute top-4 right-4 w-8 h-8 border-2 border-white/30 rotate-45"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom subtle glow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-24 bg-gradient-to-t from-white/5 to-transparent blur-xl"></div>
      
      {/* Side accent lines */}
      <div className="absolute left-0 top-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent transform -translate-y-1/2"></div>
      <div className="absolute right-0 top-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent transform -translate-y-1/2"></div>
    </section>
  );
};

export default AnimatedCTA;
