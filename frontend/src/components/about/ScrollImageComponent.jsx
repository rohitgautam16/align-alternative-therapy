import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const ScrollImageComponent = () => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Create timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        pin: false,
      }
    });

    // Add animations to timeline
    tl.fromTo(imageRef.current, 
      {
        scale: 1.1,
        y: -30
      },
      {
        scale: 1.3,
        y: 30,
        duration: 1,
        ease: "none"
      }
    );

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden"
    >
      <img
        ref={imageRef}
        src="https://cdn.pixabay.com/photo/2024/03/26/11/59/sitting-8656674_1280.jpg"
        alt="Mountain landscape"
        className="w-full h-full object-cover"
        style={{ transformOrigin: 'center center' }}
      />
      
      {/* Overlay content */}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-5xl font-bold mb-4">Seven Chakras</h2>
          <p className="text-xl opacity-90">Experience the magic Healing your soul</p>
        </div>
      </div>
    </div>
  );
};

export default ScrollImageComponent;