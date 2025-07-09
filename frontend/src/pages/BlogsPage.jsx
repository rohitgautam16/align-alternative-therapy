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
    // Set up pinning for the left section
    const ctx = gsap.context(() => {
      // Pin the left section while the right section scrolls
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: () => "+=" + (rightSectionRef.current.scrollHeight - window.innerHeight),
        pin: leftSectionRef.current,
        pinSpacing: false,
        anticipatePin: 1,
      });
    }, containerRef);

    // GSAP text reveal animation with heading lines
    const tl = gsap.timeline();
    
    // Animate heading lines from below
    const headingLines = titleRef.current.querySelectorAll('.heading-line');
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

    // Animate subtitle
    tl.fromTo(
      subtitleRef.current,
      {
        yPercent: 100,
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

    // Animate the floating book
    gsap.set(animationObjectRef.current, {
      scale: 0,
      rotation: -180,
      opacity: 0
    });

    tl.to(animationObjectRef.current, {
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: 1,
      ease: "elastic.out(1, 0.5)"
    }, "-=0.5");

    // Continuous floating animation for the book
    gsap.to(animationObjectRef.current, {
      y: -10,
      rotation: 5,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

    // Cleanup function
    return () => {
      ctx.revert();
    };

  }, []);

  return (
    <div>
     <Header />
      <div ref={containerRef} className="min-h-screen bg-black">
      <div className="flex">
        {/* Left Section - Pinned with GSAP */}
        <div ref={leftSectionRef} className="w-2/5 bg-black flex items-center justify-center p-12 h-screen">
          <div className="space-y-8 flex flex-col justify-center">
            <div ref={titleRef} className="space-y-4 overflow-hidden">
              {/* DIVE INTO on first line */}
              <div className="heading-line flex items-center gap-6">
                <h1 className="text-5xl lg:text-6xl font-light text-white leading-none">
                  DIVE
                </h1>
                <h1 className="text-5xl lg:text-6xl font-light text-white leading-none">
                  INTO
                </h1>
              </div>
              
              {/* Book and OUR on second line */}
              <div className="heading-line flex items-center gap-6">
                <div 
                  ref={animationObjectRef}
                  className="w-16 h-12 relative cursor-pointer transition-all duration-300 hover:scale-110 group"
                >
                  {/* Book Pages */}
                  <div className="absolute inset-0 bg-white rounded-r-md shadow-lg transform rotate-1 group-hover:rotate-2 transition-transform duration-300"></div>
                  <div className="absolute inset-0 bg-gray-100 rounded-r-md shadow-lg transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300"></div>
                  
                  {/* Book Cover */}
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 rounded-r-md shadow-xl flex items-center justify-center group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-300">
                    <div className="w-1 h-8 bg-white/30 rounded-full"></div>
                    <div className="w-6 h-1 bg-white/40 rounded-full absolute top-3"></div>
                    <div className="w-4 h-1 bg-white/30 rounded-full absolute bottom-3"></div>
                  </div>
                  
                  {/* Book Spine */}
                  <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-blue-800 to-purple-900 rounded-l-sm group-hover:from-blue-700 group-hover:to-purple-800 transition-all duration-300"></div>
                </div>
                <h1 className="text-5xl lg:text-6xl font-light text-white leading-none">
                  OUR
                </h1>
              </div>

              {/* ARTICLES on third line */}
              <div className="heading-line flex items-center justify-center">
                <h1 className="text-5xl lg:text-6xl font-light text-white leading-none">
                  ARTICLES
                </h1>
              </div>
            </div>

            {/* Subtitle */}
            <div className="text-center overflow-hidden">
              <p 
                ref={subtitleRef}
                className="text-lg text-white/70 font-medium leading-relaxed max-w-md mx-auto"
              >
                Discover articles on ASMR therapy, healing sounds, and holistic well-being.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Scrollable */}
        <div ref={rightSectionRef} className="w-3/5 bg-black">
          <div className="p-12 space-y-20">
            {stubBlogs.map(blog => (
              <Link
                key={blog.slug}
                to={`/blog/${blog.slug}`}
                className="block bg-black hover:shadow-lg transition-shadow rounded-lg overflow-hidden"
              >
                <div className="flex border-b border-b-white/50">
                  {/* Image Section */}
                  <div className="w-64 h-72 flex-shrink-0">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 p-8 pt-0 flex flex-col justify-between min-h-48">
                    <div>
                      <div className="text-sm text-gray-300 uppercase tracking-wide mb-2">
                        MAY, 2025
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-4 leading-tight">
                        {blog.title}
                      </h2>
                      <p className="text-white text-base leading-relaxed mb-6">
                        {blog.excerpt}
                      </p>
                    </div>
                    
                    <div>
                      <button className="bg-white text-black px-6 py-2 hover:bg-secondary rounded-full text-sm font-medium transition-colors">
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