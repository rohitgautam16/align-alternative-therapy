import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TwoImageReveal = () => {
  const containerRef = useRef(null);
  const leftImgRef = useRef(null);
  const rightImgRef = useRef(null);

  useEffect(() => {
    // Ensure refs are available before proceeding
    if (!leftImgRef.current || !rightImgRef.current || !containerRef.current) {
      return;
    }

    // Force hardware acceleration and smooth rendering
    gsap.set([leftImgRef.current, rightImgRef.current], {
      force3D: true,
      backfaceVisibility: 'hidden',
      perspective: 1000,
    });

    // Ensure both images are hidden initially with proper clip-paths
    // Left image: collapsed at top (height = 0 at top)
    gsap.set(leftImgRef.current, { 
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
      willChange: 'clip-path',
      transformOrigin: 'center top'
    });
    
    // Right image: collapsed at bottom (height = 0 at bottom) 
    gsap.set(rightImgRef.current, { 
      clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
      willChange: 'clip-path',
      transformOrigin: 'center bottom'
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'top 20%',
        toggleActions: 'play none none reverse',
        scrub: false,
        once: false,
        anticipatePin: 1,
      },
      defaults: {
        ease: 'power2.inOut',
        duration: 2.2
      }
    });

    // Add initial delay for smoother entry
    tl.set({}, {}, 0.2)
    
    // Left image: reveal from top to bottom with smooth easing
    .to(leftImgRef.current, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 2.2,
      ease: 'power2.inOut'
    })
    
    // Right image: reveal from bottom to top with longer delay for staggered effect
    .to(rightImgRef.current, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 2.2,
      ease: 'power2.inOut'
    }, '<0.6');

    return () => {
      // Clean up with proper disposal and null checks
      ScrollTrigger.getAll().forEach(st => st.kill());
      tl.kill();
      
      // Reset will-change for performance with null checks
      if (leftImgRef.current) {
        gsap.set(leftImgRef.current, { willChange: 'auto' });
      }
      if (rightImgRef.current) {
        gsap.set(rightImgRef.current, { willChange: 'auto' });
      }
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-black flex items-center justify-evenly px-[3rem]">
      <div
        ref={containerRef}
        className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-32"
      >
        <div className="relative overflow-hidden h-[500px] rounded-lg">
          <img
            ref={leftImgRef}
            src="https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg"
            alt="Left Reveal"
            className="object-cover w-full h-full rounded-lg"
          />
        </div>

        <div className="relative overflow-hidden h-[500px] rounded-lg">
          <img
            ref={rightImgRef}
            src="https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg"
            alt="Right Reveal"
            className="object-cover w-full h-full rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default TwoImageReveal;