import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContactCTABanner = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const navigate = useNavigate();

  // Unsplash images for interior design
  const interior1 = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop&auto=format';
  const interior2 = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop&auto=format';
  const interior3 = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop&auto=format';
  const interior4 = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=400&fit=crop&auto=format';

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      
      // Normalize mouse position to -1 to 1 range
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;
      
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate transform values for different layers
  const getTransform = (intensity) => {
    const moveX = mousePosition.x * intensity;
    const moveY = mousePosition.y * intensity;
    return `translate3d(${moveX}px, ${moveY}px, 0)`;
  };

  const handleclick = () => {
    navigate("/contact-us");
  }
  
  return (
    <section className="relative h-fit bg-black overflow-hidden px-15 py-20">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--luxury-surface))_1px,transparent_1px)] bg-[length:32px_32px] opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="relative h-auto flex items-center justify-center">
          
          {/* Left side images - overlapping */}
          <div className="absolute left-4 lg:left-12 top-1/2">
            {/* Back image (lower z-index) */}
            <div 
              className="relative overflow-hidden rounded-2xl group w-28 lg:w-44 transition-transform duration-300 ease-out"
              style={{ transform: getTransform(8) }}
            >
              <img 
                src={interior3} 
                alt="Modern dining room" 
                className="w-full h-38 lg:h-54 object-cover transition-transform duration-500 group-hover:scale-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark/40 to-transparent"></div>
            </div>
            
            {/* Front image (higher z-index) */}
            <div 
              className="absolute -top-40 right-12 lg:right-16 z-10 overflow-hidden rounded-2xl group w-28 lg:w-44 transition-transform duration-300 ease-out"
              style={{ transform: getTransform(15) }}
            >
              <img 
                src={interior1} 
                alt="Modern luxury living room" 
                className="w-full h-38 lg:h-54 object-cover transition-transform duration-500 group-hover:scale-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark/40 to-transparent"></div>
            </div>
          </div>

          {/* Right side images - overlapping */}
          <div className="absolute right-4 lg:right-12 top-1/2">
            {/* Back image (lower z-index) */}
            <div 
              className="relative overflow-hidden rounded-2xl group w-28 lg:w-44 transition-transform duration-300 ease-out"
              style={{ transform: getTransform(10) }}
            >
              <img 
                src={interior4} 
                alt="Luxurious modern bedroom" 
                className="w-full h-38 lg:h-54 object-cover transition-transform duration-500 group-hover:scale-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-dark/40 to-transparent"></div>
            </div>
            
            {/* Front image (higher z-index) */}
            <div 
              className="absolute -top-40 left-12 lg:left-16 z-10 overflow-hidden rounded-2xl group w-28 lg:w-44 transition-transform duration-300 ease-out"
              style={{ transform: getTransform(18) }}
            >
              <img 
                src={interior2} 
                alt="Luxury modern kitchen" 
                className="w-full h-38 lg:h-54 object-cover transition-transform duration-500 group-hover:scale-125"
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
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-thin text-white leading-normal">
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
                className="group inline-flex items-center px-6 py-4 text-sm bg-white text-black font-light rounded-full transition-all duration-300 hover:shadow-lg cursor-pointer active:scale-95"
                onClick={handleclick}
              >
                GET IN TOUCH
                <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-2 h-2 bg-luxury-accent rounded-full animate-pulse opacity-60"></div>
      <div className="absolute bottom-40 left-20 w-1 h-1 bg-luxury-gold rounded-full animate-pulse opacity-40"></div>
      <div className="absolute top-1/2 right-10 w-1.5 h-1.5 bg-luxury-accent rounded-full animate-pulse opacity-50"></div>
    </section>
  );
};

export default ContactCTABanner;
