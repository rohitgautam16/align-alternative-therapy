import React, { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from 'react-router-dom';

const Footer = () => {
  const footerRef = useRef(null);
  const titleRef = useRef(null);
  const descRefs = useRef([]);
  const menuRefs = useRef([]);
  const subscribeRefs = useRef([]);
  const copyrightRef = useRef(null);
  const backgroundTextRef = useRef(null);

  const companyLinks = [
    { label: 'About', path: '/about' },
    { label: 'Blogs', path: '/blog' },
    { label: 'Contact', path: '/contact-us' },
  ];

  const socialLinks = [
    // { label: 'Twitter', url: 'https://www.instagram.com/alignalternativetherapy?igsh=a2VjN2RyZGtlcGMx' },
    { label: 'Instagram', url: 'https://www.instagram.com/alignalternativetherapy?igsh=a2VjN2RyZGtlcGMx' },
    // { label: 'Facebook', url: 'https://www.instagram.com/alignalternativetherapy?igsh=a2VjN2RyZGtlcGMx' },
  ];

  useEffect(() => {
    // Custom GSAP-style fromTo animation
    const fromTo = (elements, fromProps, toProps) => {
      const elementArray = Array.isArray(elements) ? elements : [elements];
      
      elementArray.forEach((element, index) => {
        if (!element) return;
        
        // Set initial state (from)
        Object.entries(fromProps).forEach(([key, value]) => {
          if (key === 'yPercent') {
            element.style.transform = `translateY(${value}%)`;
          } else if (key === 'xPercent') {
            element.style.transform = `translateX(${value}%)`;
          } else {
            element.style[key] = value;
          }
        });

        // Animate to final state (to)
        const delay = (toProps.stagger || 0) * index * 1000;
        const duration = (toProps.duration || 1) * 1000;
        
        setTimeout(() => {
          element.style.transition = `all ${duration}ms ${toProps.ease === 'power4.out' ? 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'ease-out'}`;
          
          Object.entries(toProps).forEach(([key, value]) => {
            if (key === 'yPercent') {
              element.style.transform = `translateY(${value}%)`;
            } else if (key === 'xPercent') {
              element.style.transform = `translateX(${value}%)`;
            } else if (!['duration', 'ease', 'stagger'].includes(key)) {
              element.style[key] = value;
            }
          });
        }, delay);
      });
    };

    // Intersection Observer for trigger
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateFooter(fromTo);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  const animateFooter = (fromTo) => {
    // Background text
    fromTo(backgroundTextRef.current, 
      { yPercent: 50, opacity: '0' },
      { yPercent: 0, opacity: '0.08', duration: 2.5, ease: 'power4.out' }
    );

    // Title animation
    fromTo(titleRef.current,
      { yPercent: 100, opacity: '0' },
      { yPercent: 0, opacity: '1', duration: 2, ease: 'power4.out' }
    );

    // Description lines with stagger
    fromTo(descRefs.current.filter(ref => ref),
      { yPercent: 100, opacity: '0' },
      { yPercent: 0, opacity: '1', duration: 2, ease: 'power4.out', stagger: 0.2 }
    );

    // Menu sections with stagger
    fromTo(menuRefs.current.filter(ref => ref),
      { yPercent: 100, opacity: '0' },
      { yPercent: 0, opacity: '1', duration: 2, ease: 'power4.out', stagger: 0.3 }
    );

    // Newsletter section elements
    fromTo(subscribeRefs.current.filter(ref => ref),
      { yPercent: 100, opacity: '0' },
      { yPercent: 0, opacity: '1', duration: 2, ease: 'power4.out', stagger: 0.15 }
    );

    // Copyright
    fromTo(copyrightRef.current,
      { yPercent: 100, opacity: '0' },
      { yPercent: 0, opacity: '1', duration: 2, ease: 'power4.out' }
    );
  };

  const handleSubscribe = () => {
    console.log('Newsletter subscription');
  };

  return (
    <footer
      ref={footerRef}
      className="bg-black text-white relative overflow-hidden"
    >
      {/* Giant "ALIGN" background */}
      <div 
        ref={backgroundTextRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        style={{ opacity: 0, transform: 'translateY(50%)' }}
      >
        <h1 className="text-[min(25vw,300px)] font-black uppercase text-white leading-none tracking-wider">
          ALIGN
        </h1>
      </div>

      <div className="relative z-10  mx-auto px-8 py-20">
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-16">
          
          {/* LEFT: Brand & Description */}
          <div className="space-y-8">
            <div 
              ref={titleRef}
              className="overflow-hidden"
              style={{ opacity: 0, transform: 'translateY(100%)' }}
            >
              <h2 className="text-6xl lg:text-7xl font-black leading-none mb-4 text-white">
                ALIGN
              </h2>
            </div>

            <div className="space-y-6">
              <div 
                ref={el => descRefs.current[0] = el}
                className="overflow-hidden"
                style={{ opacity: 0, transform: 'translateY(100%)' }}
              >
                <p className="text-lg leading-relaxed text-gray-300">
                  At Align Alternative Therapy, we are committed to democratizing the transformative benefits of sound healing.
                </p>
              </div>
              
              <div 
                ref={el => descRefs.current[1] = el}
                className="overflow-hidden"
                style={{ opacity: 0, transform: 'translateY(100%)' }}
              >
                <p className="text-sm italic text-gray-400 pl-4 border-l-2 border-white/20">
                  Our mission is simple yet powerful: to ensure that the therapeutic potential of sound is accessible to all.
                </p>
              </div>
            </div>
          </div>

          {/* CENTER: Navigation Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
        {/* Company */}
        <div ref={el => menuRefs.current[0] = el} className="overflow-hidden" style={{ opacity: 0, transform: 'translateY(100%)' }}>
          <h3 className="text-xl font-bold mb-6 text-white">Company</h3>
          <ul className="space-y-4">
            {companyLinks.map(({ label, path }, i) => (
              <li key={i}>
                {/* Using Link */}
                <Link
                  to={path}
                  className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 inline-flex items-center group"
                >
                  <span className="group-hover:mr-2 transition-all duration-300">{label}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </Link>

                {/* Or, if you’d rather use useNavigate:
                <button
                  onClick={() => navigate(path)}
                  className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 inline-flex items-center group"
                >
                  <span className="group-hover:mr-2 transition-all duration-300">{label}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </button>
                */}
              </li>
            ))}
          </ul>
        </div>

        {/* Follow us */}
        <div ref={el => menuRefs.current[1] = el} className="overflow-hidden" style={{ opacity: 0, transform: 'translateY(100%)' }}>
          <h3 className="text-xl font-bold mb-6 text-white">Follow us</h3>
          <ul className="space-y-4">
            {socialLinks.map(({ label, url }, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 inline-flex items-center group"
                >
                  <span className="group-hover:mr-2 transition-all duration-300">{label}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

          {/* RIGHT: Newsletter */}
          <div className="space-y-6">
            <div 
              ref={el => subscribeRefs.current[0] = el}
              className="overflow-hidden"
              style={{ opacity: 0, transform: 'translateY(100%)' }}
            >
              <h3 className="text-xl font-bold text-white">Join our newsletter</h3>
            </div>

            <div 
              ref={el => subscribeRefs.current[1] = el}
              className="overflow-hidden"
              style={{ opacity: 0, transform: 'translateY(100%)' }}
            >
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 px-6 py-4 rounded-none focus:outline-none focus:border-white transition-all duration-300"
                />
                <button
                  onClick={handleSubscribe}
                  className="w-full bg-white text-black px-6 py-4 font-semibold transition-all duration-300 hover:bg-secondary cursor-pointer flex items-center justify-center space-x-3"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div 
              ref={el => subscribeRefs.current[2] = el}
              className="overflow-hidden"
              style={{ opacity: 0, transform: 'translateY(100%)' }}
            >
              <p className="text-xs text-gray-400 leading-relaxed">
                By subscribing you agree to our privacy policy and provide consent to receive updates from our company.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom border and copyright */}
        <div 
          ref={copyrightRef}
          className="border-t border-white/20 pt-8 overflow-hidden"
          style={{ opacity: 0, transform: 'translateY(100%)' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>All Rights Reserved © 2024 Align Alternative Therapy | Made With ♡ by Redhoney</p>
            <a 
              href="#" 
              className="hover:text-white transition-colors duration-300 mt-4 md:mt-0 hover:underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;