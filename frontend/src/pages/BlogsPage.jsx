// src/pages/BlogsPage.jsx
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import stubBlogs from '../stubs/blogs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../components/common/Header';

gsap.registerPlugin(ScrollTrigger);

export default function BlogsPage() {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const animationObjectRef = useRef(null);
  const containerRef = useRef(null);
  const leftSectionRef = useRef(null);
  const rightSectionRef = useRef(null);

  useEffect(() => {
    // === Animations (independent of layout) ===
    const tl = gsap.timeline();

    const headingLines = titleRef.current.querySelectorAll('.heading-line');
    tl.fromTo(
      headingLines,
      { yPercent: 100, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 2, ease: 'power4.out', stagger: 0.3 }
    );

    tl.fromTo(
      subtitleRef.current,
      { yPercent: 100, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.5, ease: 'power4.out' },
      '-=1'
    );

    gsap.set(animationObjectRef.current, { scale: 0, rotation: -180, opacity: 0 });
    tl.to(animationObjectRef.current, {
      scale: 1, rotation: 0, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.5)'
    }, '-=0.5');

    gsap.to(animationObjectRef.current, {
      y: -10, rotation: 5, duration: 2, ease: 'power2.inOut', yoyo: true, repeat: -1
    });

    // === Responsive pin only on desktop ===
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      // Pin left while right scrolls on desktop
      const st = ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: () => '+=' + (rightSectionRef.current.scrollHeight - window.innerHeight),
        pin: leftSectionRef.current,
        pinSpacing: false,
        anticipatePin: 1,
      });

      // Clean up this breakpoint
      return () => st.kill();
    });

    mm.add('(max-width: 1023px)', () => {
      // Ensure any inline styles from pinning are cleared on mobile
      gsap.set(leftSectionRef.current, { clearProps: 'all' });
    });

    // Global cleanup
    return () => {
      mm.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div>
      <Header />
      <div ref={containerRef} className="min-h-screen bg-black py-25 sm-py-25">
        {/* Stack on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:flex-row">
          {/* Left Section (Pinned on desktop, normal on mobile) */}
          <div
            ref={leftSectionRef}
            className="w-full lg:w-2/5 bg-black flex items-center justify-center px-6 sm:px-10 lg:px-12 py-10 lg:py-10 h-auto lg:h-screen"
          >
            <div className="space-y-8 flex flex-col justify-center">
              <div ref={titleRef} className="space-y-4 overflow-hidden text-center lg:text-left">
                {/* DIVE INTO */}
                <div className="heading-line flex items-center justify-center lg:justify-start gap-6">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-none">DIVE</h1>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-none">INTO</h1>
                </div>

                {/* Book + OUR */}
                <div className="heading-line flex items-center justify-center lg:justify-start gap-6">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-none">OUR</h1>
                </div>

                {/* ARTICLES */}
                <div className="heading-line flex items-center justify-center lg:justify-start">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-none">
                    ARTICLES
                  </h1>
                </div>
              </div>

              {/* Subtitle */}
              <div className="text-center lg:text-left overflow-hidden">
                <p
                  ref={subtitleRef}
                  className="text-base sm:text-lg text-white/70 font-medium leading-relaxed max-w-md mx-auto lg:mx-0"
                >
                  Discover information on therapy, healing sounds, and holistic well-being.
                </p>
              </div>
            </div>
          </div>

          {/* Right Section (Scrollable list) */}
          <div ref={rightSectionRef} className="w-full lg:w-3/5 bg-black md:py-10 lg-py-15">
            <div className="px-6 sm:px-10 lg:px-12 py-10 space-y-12 sm:space-y-16 lg:space-y-20">
              {stubBlogs.map(blog => (
                <Link
                  key={blog.slug}
                  to={`/blog/${blog.slug}`}
                  className="block bg-black rounded-lg overflow-hidden transition-shadow hover:shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row border-b border-b-white/50">
                    {/* Image */}
                    <div className="w-full sm:w-64 h-48 sm:h-72 flex-shrink-0">
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 sm:p-8 pt-4 sm:pt-0 flex flex-col justify-between">
                      <div>
                        <div className="text-xs sm:text-sm text-gray-300 uppercase tracking-wide mb-2">
                          MAY, 2025
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                          {blog.title}
                        </h2>
                        <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-5 sm:mb-6">
                          {blog.excerpt}
                        </p>
                      </div>

                      <div>
                        <button className="bg-white text-black px-5 py-2 sm:px-6 sm:py-2 hover:bg-secondary rounded-full text-sm font-medium transition-colors">
                          Discover →
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
