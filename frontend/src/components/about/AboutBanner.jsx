// src/components/about/AboutBanner.jsx
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import portrait from '../../assets/images/focus.jpg';

export default function AboutBanner() {
  const sectionRef = useRef(null);
  const imgRef     = useRef(null);
  const headingRef = useRef(null);
  const bodyRef    = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Portrait reveal: clip-path from zero height up
      gsap.fromTo(
        imgRef.current,
        { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' },
        {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          duration: 2.2,
          ease: 'power2.inOut'
        }
      );

      // Gather lines for staggered text reveal
      const headingSpans = headingRef.current.querySelectorAll('span');
      const bodyItems    = bodyRef.current.querySelectorAll('p, li');

      gsap.fromTo(
        [...headingSpans, ...bodyItems],
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 2,
          ease: 'power4.out',
          stagger: 0.3,
          delay: 0.5
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Wrap each word in a span for stagger
  const splitToSpanWords = (text) =>
    text.split(' ').map((w, i) => (
      <span key={i} className="inline-block mr-2 leading-none">
        {w}
      </span>
    ));

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[150vh] overflow-hidden bg-black"
    >
      {/* Heading - top-left */}
      <h1
        ref={headingRef}
        className="absolute top-32 left-8 text-[8rem] uppercase text-white leading-none z-20"
      >
        {splitToSpanWords('About')}
      </h1>

      {/* Body copy + links - top-right */}
      <div
        ref={bodyRef}
        className="absolute top-64 right-20 w-2/5 space-y-4 text-left tracking-wider leading-relaxed text-white text-xl z-20"
      >
        <p>
          At Align Alternative Therapy, we're driven by a profound commitment to democratizing the 
          transformative benefits of sound healing. We believe that the profound therapeutic potential 
          inherent in sound shouldn't be an exclusive privilege, but a universally accessible resource. 
          Our mission isn't just simple; it's a powerful declaration of our dedication to ensuring that 
          everyone, regardless of their background or circumstances, can experience the profound healing 
          and restorative power that sound offers. We envision a world where the harmonizing vibrations 
          of sound are within reach for all, fostering well-being and inner peace across every community.
        </p>
        {/* <ul className=" space-y-2">
          <li>
            <a
              href="mailto:you@example.com"
              className="hover:text-gray-300"
            >
              Email
            </a>
          </li>
          <li>
            <a
              href="https://twitter.com/yourhandle"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300"
            >
              Twitter
            </a>
          </li>
          <li>
            <a
              href="https://linkedin.com/in/yourprofile"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300"
            >
              LinkedIn
            </a>
          </li>
        </ul> */}
      </div>

      {/* Portrait - bottom-left, behind text */}
      <div className="absolute bottom-0 left-0 w-1/2 h-3/5 overflow-hidden z-10">
        <img
          ref={imgRef}
          src={portrait}
          alt="Portrait"
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
    </section>
  );
}
