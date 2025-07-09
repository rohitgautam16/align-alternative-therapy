import React, { useEffect, useRef } from 'react';

const AboutImgText = () => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const bodyRef = useRef(null);
  const imageRef = useRef(null);
  
  // Second section refs
  const sectionRef2 = useRef(null);
  const headingRef2 = useRef(null);
  const bodyRef2 = useRef(null);
  const imageRef2 = useRef(null);

  useEffect(() => {
    // Check if GSAP is available
    if (!window.gsap || !window.ScrollTrigger) {
      // Fallback to simple animations if GSAP is not available
      const elements = [headingRef.current, bodyRef.current, imageRef.current, headingRef2.current, bodyRef2.current, imageRef2.current];
      elements.forEach((el, index) => {
        if (el) {
          setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, index * 200);
        }
      });
      return;
    }

    // First section animation
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

    // Body text animation
    tl.fromTo(
      bodyRef.current,
      { 
        yPercent: 50,
        opacity: 0
      },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.5,
        ease: "power4.out"
      },
      "-=1"
    );

    // Image animation
    tl.to(imageRef.current, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 2.2,
      ease: 'power2.inOut'
    }, "-=1.5");

    // Second section animation
    const tl2 = window.gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef2.current,
        start: "top 100%",
        end: "bottom 20%",
        scrub: 1,
        toggleActions: "play none none reverse"
      }
    });

    // Second section heading animation
    const headingLines2 = headingRef2.current.querySelectorAll('.heading-line');
    tl2.fromTo(
      headingLines2,
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

    // Second section body text animation
    tl2.fromTo(
      bodyRef2.current,
      { 
        yPercent: 50,
        opacity: 0
      },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.5,
        ease: "power4.out"
      },
      "-=1"
    );

    // Second section image animation
    tl2.to(imageRef2.current, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 2.2,
      ease: 'power2.inOut'
    }, "-=1.5");

    return () => {
      if (window.ScrollTrigger) {
        window.ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      }
    };
  }, []);

  return (
    <>
      {/* First Section - Text Left, Image Right */}
      <div 
        ref={sectionRef}
        className="w-full bg-black relative py-15 overflow-hidden"
      >
        {/* Main content container */}
        <div className="h-full flex items-center justify-center px-8 lg:px-16">
          <div className="w-full ">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              
              {/* Left Column - Text Content */}
              <div className="space-y-6 lg:space-y-8 z-20">
                {/* Main Title */}
                <div 
                  className="text-md font-medium text-gray-400 tracking-widest overflow-hidden"
                >
                  <div className="inline-block">(01)</div>
                </div>
                <h1 
                  ref={headingRef}
                  className="text-4xl md:text-4xl lg:text-5xl xl:text-5xl text-white leading-tight"
                  style={{
                    letterSpacing: '-0.02em'
                  }}
                >
                  Our Approach to Sound Healing
                </h1>

                {/* Body Text */}
                <div 
                  ref={bodyRef}
                  className="text-gray-300 text-base lg:text-lg xl:text-xl leading-relaxed"
                >
                  <p>
                    We explore a variety of modalities, including Rife frequencies, binaural beats, entrainment, vibrational fields, and morphic resonance, to curate a diverse library of soundscapes tailored to address common challenges such as aesthetics, sleep issues, weight management, and digestion. Whether you seek to enhance physical well-being, improve mental clarity, or foster spiritual connection, our collection of sound therapies offers a holistic approach to addressing these concerns.
                  </p>
                </div>

                {/* Decorative accent */}
                <div className="w-32 h-1 bg-gradient-to-r from-white to-transparent rounded-full"></div>
              </div>

              {/* Right Column - Image */}
              <div className="flex justify-center items-center lg:justify-end">
                <div 
                  ref={imageRef}
                  className="relative top-20 z-10 w-80 h-80 md:w-96 md:h-96 lg:w-[450px] lg:h-[450px] xl:w-[500px] xl:h-[500px]"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1601737240795-189a2c66807e?q=80&w=752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Sound healing meditation"
                    className="w-full h-full object-cover bg-black rounded-lg shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      {/* Second Section - Image Left, Text Right */}
      <div 
        ref={sectionRef2}
        className="w-full bg-black relative py-15 overflow-hidden"
      >
        {/* Main content container */}
        <div className="h-full flex items-center justify-center px-8 lg:px-16">
          <div className="w-full ">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              
              {/* Left Column - Image */}
              <div className="flex justify-center items-center lg:justify-start">
                <div 
                  ref={imageRef2}
                  className="relative top-20 z-10 w-80 h-80 md:w-96 md:h-96 lg:w-[450px] lg:h-[450px] xl:w-[500px] xl:h-[500px]"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1601737240795-189a2c66807e?q=80&w=752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Sound healing meditation"
                    className="w-full h-full object-cover bg-black rounded-lg shadow-2xl"
                  />
                </div>
              </div>

              {/* Right Column - Text Content */}
              <div className="space-y-6 lg:space-y-8 z-20">
                {/* Main Title */}
                <div 
                  className="text-md font-medium text-gray-400 tracking-widest overflow-hidden"
                >
                  <div className="inline-block">(02)</div>
                </div>
                <h1 
                  ref={headingRef2}
                  className="text-4xl md:text-4xl lg:text-5xl xl:text-5xl text-white leading-tight"
                  style={{
                    letterSpacing: '-0.02em'
                  }}
                >
                  Healing Through Sound
                </h1>

                {/* Body Text */}
                <div 
                  ref={bodyRef2}
                  className="text-gray-300 text-base lg:text-lg xl:text-xl leading-relaxed"
                >
                  <p>
                    We believe in the innate wisdom of the body and its capacity for self-healing. Through our offerings, we aim to empower individuals to tap into their inner resources and cultivate balance, vitality, and harmony in their lives. Our goal is to provide effective, non-invasive solutions that support your journey toward optimal health and vitality. Through the profound power of sound, we encourage exploration of new paths toward self-discovery, healing, and growth.
                  </p>
                </div>

                {/* Decorative accent */}
                <div className="w-32 h-1 bg-gradient-to-r from-white to-transparent rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutImgText;