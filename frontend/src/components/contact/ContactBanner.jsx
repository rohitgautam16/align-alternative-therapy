import React, { useEffect, useRef } from 'react';

const ContactBanner = () => {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const eyeRef = useRef(null);
  const emailRef = useRef(null);
  const textRef = useRef(null);
  const faqRef = useRef(null);
  const socialRef = useRef(null);

  useEffect(() => {
    // Load GSAP script dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
    script.onload = () => {
      // Create GSAP timeline for coordinated animations
      const tl = window.gsap.timeline({ delay: 0.5 });

      // Split text into individual characters/words for stagger effect
      const splitText = (element) => {
        const text = element.textContent;
        element.innerHTML = text.split('').map(char => 
          char === ' ' ? '<span class="char"> </span>' : `<span class="char">${char}</span>`
        ).join('');
        return element.querySelectorAll('.char');
      };

      // Split title text
      const getChars = splitText(titleRef.current.querySelector('.get-text'));
      const inChars = splitText(titleRef.current.querySelector('.in-text'));
      const touchChars = splitText(titleRef.current.querySelector('.touch-text'));

      // Initial states
      window.gsap.set([getChars, inChars, touchChars], { 
        opacity: 0, 
        y: 100, 
        rotationX: -90 
      });
      
      window.gsap.set([eyeRef.current, emailRef.current, textRef.current, faqRef.current, socialRef.current], { 
        opacity: 0, 
        y: 50 
      });

      // Animate title with stagger
      tl.to(getChars, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: "back.out(1.7)"
      })
      .to(inChars, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: "back.out(1.7)"
      }, "-=0.4")
      .to(touchChars, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: "back.out(1.7)"
      }, "-=0.4")
      .to(eyeRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.2")
      .to(emailRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.3")
      .to([textRef.current, faqRef.current, socialRef.current], {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      }, "-=0.2");

      // Eye hover animation
      const handleEyeHover = () => {
        window.gsap.to(eyeRef.current, {
          scale: 1.1,
          rotation: 5,
          duration: 0.3,
          ease: "power2.out"
        });
      };

      const handleEyeLeave = () => {
        window.gsap.to(eyeRef.current, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      };

      eyeRef.current.addEventListener('mouseenter', handleEyeHover);
      eyeRef.current.addEventListener('mouseleave', handleEyeLeave);
    };

    // Add script to head
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="h-fit bg-black relative items-center py-20 overflow-hidden">
      <div ref={containerRef} className="container mx-auto px-8 py-16 relative z-10 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start px-8 mx-auto h-full">
          
          {/* Left Section - Main Title */}
          <div className="space-y-8 flex flex-col justify-center">
            <div ref={titleRef} className="space-y-4">
              {/* GET IN on first line */}
              <div className="flex items-center gap-6">
                <h1 className="text-5xl lg:text-6xl font-light text-white leading-none get-text">
                  GET
                </h1>
                <h1 className="text-5xl lg:text-6xl font-light text-white leading-none in-text">
                  IN
                </h1>
              </div>
              
              {/* Eye and TOUCH on second line */}
              <div className="flex items-center gap-6">
                <div 
                  ref={eyeRef}
                  className="w-16 h-16 lg:w-20 lg:h-20 border-2 border-white rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-white hover:text-black group"
                >
                  <div className="w-3 h-3 bg-white rounded-full group-hover:bg-black transition-colors duration-300"></div>
                </div>
                <h1 className="text-5xl lg:text-6xl font-light text-white leading-none touch-text">
                  TOUCH
                </h1>
              </div>
            </div>
            
            <div ref={emailRef} className="pt-8">
              <a 
                href="mailto:hello@aquerone.com"
                className="text-xl lg:text-2xl text-gray-300 hover:text-white transition-colors duration-300 border-b-2 border-gray-600 hover:border-white pb-1"
              >
                contact@align-alternativetherapy.com
              </a>
            </div>
          </div>

          {/* Right Section - Content */}
          <div className="space-y-12 flex flex-col justify-center">
            <div ref={textRef}>
              <p className="text-lg lg:text-xl text-gray-300 leading-relaxed">
                Reach out to us at Align Alternative Therapy to begin your journey toward deeper balance, 
                healing, and harmony. Whether you’re curious about our sound‑based therapies or ready to 
                dive into a personalized program, our friendly and experienced team is here to support you
                every step of the way
              </p>
            </div>

            {/* <div ref={faqRef} className="space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                FAQ
              </h3>
              <a 
                href="#" 
                className="block text-gray-300 hover:text-white transition-colors duration-300 underline decoration-gray-600 hover:decoration-white"
              >
                Your frequently asked questions here.
              </a>
            </div> */}

            {/* <div ref={socialRef} className="space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Social Links
              </h3>
              <div className="space-y-2">
                {['Instagram', 'Facebook', 'LinkedIn'].map((social, index) => (
                  <a
                    key={social}
                    href="#"
                    className="block text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-2"
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-black to-transparent opacity-30"></div>
      <div className="absolute top-1/4 left-0 w-32 h-32 bg-gray-600 rounded-full opacity-10 blur-xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gray-700 rounded-full opacity-05 blur-2xl"></div>

      <style jsx>{`
        .char {
          display: inline-block;
        }
        
        @media (max-width: 768px) {
          .get-text, .in-text, .touch-text {
            font-size: 4rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ContactBanner;