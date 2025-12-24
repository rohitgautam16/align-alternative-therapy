import React, { useEffect, useRef } from "react";

const BottomIconsSection = () => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const paragraphRef = useRef(null);
  const scrollingTextRef = useRef(null);
  const bottomHeadingRef = useRef(null);

  useEffect(() => {
    const gsapScript = document.createElement('script');
    gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
    
    const scrollTriggerScript = document.createElement('script');
    scrollTriggerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
    
    gsapScript.onload = () => {
      scrollTriggerScript.onload = () => {
        window.gsap.registerPlugin(window.ScrollTrigger);
        
        // Create timeline for main content
        const tl = window.gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 100%",
            end: "bottom 20%",
            scrub: 1,
            toggleActions: "play none none reverse"
          }
        });

        // Heading animation
        const headingLines = headingRef.current.querySelectorAll('.heading-line');
        tl.fromTo(
          headingLines,
          { 
            yPercent: 100,
            opacity: 0
          },
          {
            yPercent: 0,
            opacity: 1,
            duration: 2,
            ease: "power4.out",
            stagger: 0.3,
          }
        );

        // Paragraph text reveal animation
        const paragraphWords = paragraphRef.current.querySelectorAll('.word');
        tl.fromTo(
          paragraphWords,
          {
            opacity: 0,
            y: 20,
            rotationX: -90,
            filter: "blur(10px)"
          },
          {
            opacity: 1,
            y: 0,
            rotationX: 0,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.02
          },
          0
        );

        // Bottom heading animation - separate timeline
        const bottomHeadingTl = window.gsap.timeline({
          scrollTrigger: {
            trigger: bottomHeadingRef.current,
            start: "top 80%",
            end: "bottom 50%",
            scrub: 1,
            toggleActions: "play none none reverse"
          }
        });

        const leftPart = bottomHeadingRef.current.querySelector('.left-part');
        const rightPart = bottomHeadingRef.current.querySelector('.right-part');

        // Animate left part sliding in from left
        bottomHeadingTl.fromTo(
          leftPart,
          {
            x: -100,
            opacity: 1
          },
          {
            x: 0,
            opacity: 1,
            duration: 1.5,
            ease: "power3.out"
          }
        );

        bottomHeadingTl.fromTo(
          rightPart,
          {
            x: 100,
            opacity: 1
          },
          {
            x: 0,
            opacity: 1,
            duration: 1.5,
            ease: "power3.out"
          },
          0.2
        );

        // Continuous scrolling text animation
        window.gsap.to(scrollingTextRef.current, {
          rotation: 360,
          duration: 20,
          ease: "none",
          repeat: -1
        });
      };
      document.head.appendChild(scrollTriggerScript);
    };
    document.head.appendChild(gsapScript);

    return () => {
      if (document.head.contains(gsapScript)) {
        document.head.removeChild(gsapScript);
      }
      if (document.head.contains(scrollTriggerScript)) {
        document.head.removeChild(scrollTriggerScript);
      }
    };
  }, []);

  const splitTextIntoWords = (text) => {
    return text.split(' ').map((word, index) => (
      <span key={index} className="word inline-block" style={{ perspective: '1000px' }}>
        {word}&nbsp;
      </span>
    ));
  };

  const createCircularText = (text) => {
    const chars = text.split('');
    const angleStep = 360 / chars.length;
    
    // Responsive radius
    const getRadius = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) return 35;
        if (window.innerWidth < 768) return 40;
        if (window.innerWidth < 1024) return 45;
        return 50;
      }
      return 50;
    };
    
    const radius = getRadius();
    
    return chars.map((char, index) => {
      const angle = index * angleStep;
      const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
      const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
      
      return (
        <span
          key={index}
          className="absolute text-white text-xs sm:text-sm font-medium select-none"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
            transformOrigin: 'center',
            marginLeft: '-0.5ch',
            marginTop: '-0.5em',
            whiteSpace: 'nowrap'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  return (
    <div ref={sectionRef} className="flex flex-col items-center h-auto space-y-15 justify-around pt-16 sm:pt-20 md:pt-24 lg:pt-28 py-20 sm:py-20 md:py-30 lg:py-35 bg-primary">
      <div className="flex items-center justify-center w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 md:gap-16 lg:gap-20 max-w-5xl w-full">
          {/* Left column */}
          <div className="w-full lg:w-2/5 flex flex-col items-center lg:items-start space-y-6 sm:space-y-8">
            <h3 
              ref={headingRef}
              className="text-xl sm:text-2xl md:text-3xl md:text-left font-bold text-white leading-tight overflow-hidden"
            >
              <div className="heading-line block">ABOUT ALIGN</div>
              <div className="heading-line block">ALTERNATIVE THERAPY</div>
            </h3>
            
            {/* Circular scrolling text positioned where the button was */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
              <div 
                ref={scrollingTextRef}
                className="absolute w-full h-full flex items-center justify-center"
              >
                {createCircularText("EXPLORE THE INNER PEACE • ")}
              </div>
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="w-full lg:w-3/5 space-y-8 sm:space-y-10 md:space-y-12">
            <p 
              ref={paragraphRef}
              className="text-lg sm:text-xl md:text-2xl font-light text-white leading-relaxed text-center lg:text-left"
            >
              {splitTextIntoWords("Our approach blends different audio therapies like affirmations, binaural beats and solfeggio frequencies. Each audio experience is thoughtfully curated to provide you with a significant advantage, aiding in aligning your mind, body and spirit for optimal harmony and growth")}
            </p>
          </div>
        </div>
      </div>
      
      <h2 
        ref={bottomHeadingRef}
        className="text-stroke text-outline text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.5rem] tracking-wide text-center uppercase mt-10 sm:mt-14 md:mt-22 lg:mt-30 mx-auto leading-tight px-4 sm:px-6 md:px-8"
      >
        <span className="left-part inline-block">We tap into the transformative power</span>
        <br />
        <span className="right-part inline-block">of sound to enrich your well-being</span>
      </h2>
    </div>
  );
};

export default BottomIconsSection;
