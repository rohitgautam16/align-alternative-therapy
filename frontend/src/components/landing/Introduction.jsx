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

        // Paragraph text reveal animation with blur - starts at same time as heading
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

        // Continuous scrolling text animation - revolve the entire container
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
        if (window.innerWidth < 640) return 35; // sm
        if (window.innerWidth < 768) return 40; // md
        if (window.innerWidth < 1024) return 45; // lg
        return 50; // xl and above
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
    <div ref={sectionRef} className="flex flex-col items-center h-full justify-between pt-16 sm:pt-20 md:pt-24 lg:pt-28 py-16 sm:py-20 md:py-25 bg-primary">
      <div className="flex items-center justify-center w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Two column layout - responsive */}
        <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 md:gap-16 lg:gap-20 max-w-5xl w-full">
          {/* Left column - responsive width */}
          <div className="w-full lg:w-2/5 space-y-6 sm:space-y-8 text-center lg:text-left">
            <h3 
              ref={headingRef}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight overflow-hidden"
            >
              <div className="heading-line block">ABOUT ALIGN</div>
              <div className="heading-line block">ALTERNATIVE THERAPY</div>
            </h3>
            
            {/* Egg-shaped outlined button with arrow - responsive */}
            <div className="flex justify-center lg:justify-start">
              <button className="group bg-transparent border border-white hover:bg-white hover:border-white transition-all duration-300 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-sm sm:text-base" 
                      style={{
                        borderRadius: '50% / 50%'
                      }}>
                <span className="text-white group-hover:text-black font-medium tracking-wide">
                  LEARN MORE
                </span>
                <svg 
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-black group-hover:translate-x-1 transition-all duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Right column - responsive width */}
          <div className="w-full lg:w-3/5 space-y-8 sm:space-y-10 md:space-y-12">
            <p 
              ref={paragraphRef}
              className="text-lg sm:text-xl md:text-2xl font-light text-white leading-relaxed text-center lg:text-left"
            >
              {splitTextIntoWords("Our approach blends different audio therapies like affirmations, binaural beats and solfeggio frequencies. Each audio experience is thoughtfully curated to provide you with a significant advantage, aiding in aligning your mind, body and spirit for optimal harmony and growth")}
            </p>
            
            {/* Circular scrolling text - responsive positioning */}
            <div className="flex justify-end lg:justify-end -z-10">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32">
                <div 
                  ref={scrollingTextRef}
                  className="absolute inset-0 flex items-center justify-center w-full h-full"
                >
                  {createCircularText("EXPLORE THE INNER PEACE • ")}
                </div>
                {/* Center dot - stays stationary - responsive size */}
                <div className="absolute top-1/2 left-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      <h2 
        ref={bottomHeadingRef}
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.5rem] tracking-wide text-white text-center uppercase mt-10 sm:mt-14 md:mt-22 lg:mt-30 mx-auto leading-tight px-4 sm:px-6 md:px-8"
      >
        <span className="left-part inline-block">We tap into the transformative power</span>
        <br />
        <span className="right-part inline-block">of sound to enrich your well-being</span>
      </h2>
    </div>
  );
};

export default BottomIconsSection;
