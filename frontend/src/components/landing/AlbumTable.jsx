import React, { useState, useCallback, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MemoryImg from "../../assets/images/Memory.png";
import PeakStateImg from "../../assets/images/Peak State.jpg";
import OptimismImg from "../../assets/images/optimism.jpg";
import IntuitionImg from "../../assets/images/Intuition.jpg";

const AlbumTable = () => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const tableRef = useRef(null);
  const rowsRef = useRef([]);

  const albumData = [
    { Name: "Memory", Genre: "Soulful", Category: "Mind", image: MemoryImg },
    { Name: "Peak State", Genre: "Soulful", Category: "Mind", image: PeakStateImg },
    { Name: "Optimism", Genre: "Soulful", Category: "Mind", image: OptimismImg },
    { Name: "Intuition", Genre: "Soulful", Category: "Mind", image: IntuitionImg },
  ];

  // Optimized mouse move handler with RAF throttling
  const handleMouseMove = useCallback((event) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      setCursorPosition({ x: event.clientX, y: event.clientY });
    });
  }, []);

  // Memoized row hover handlers with smooth transitions
  const handleRowEnter = useCallback((index) => {
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // If there's already an image showing and it's different
    if (currentImage !== null && currentImage !== index) {
      setIsTransitioning(true);
      
      // First scale down current image
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrentImage(index);
        setHoveredRow(index);
        
        // Then scale up new image
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 300); // Wait for scale down animation
    } else {
      // No current image or same image, show directly
      setCurrentImage(index);
      setHoveredRow(index);
      setIsTransitioning(false);
    }
  }, [currentImage]);

  const handleRowLeave = useCallback(() => {
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    setHoveredRow(null);
    setIsTransitioning(true);
    
    // Scale down and then hide
    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentImage(null);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // GSAP ScrollTrigger animations
  useEffect(() => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({
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

    // Table animation
    tl.fromTo(
      tableRef.current,
      {
        scale: 0.8,
        opacity: 0,
        y: 100
      },
      {
        scale: 1,
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power4.out"
      },
      "-=1.7"
    );

    // Row animations
    tl.fromTo(
      rowsRef.current,
      {
        x: -200,
        opacity: 0,
        scale: 0.9
      },
      {
        x: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: {
          amount: 0.3,
          from: "start",
          ease: "power2.out"
        },
        ease: "power4.out"
      },
      "-=1.7"
    );

    // Cleanup function
    return () => {
      // Kill all ScrollTrigger instances for this component
      let triggers = ScrollTrigger.getAll();
      triggers.forEach(trigger => {
        if (trigger.trigger === sectionRef.current) {
          trigger.kill();
        }
      });
    };
  }, []);

  // Cleanup animation frame and timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className="bg-black text-white p-10 min-h-max flex flex-col items-center w-screen"
      onMouseMove={handleMouseMove}
    >
      <div ref={headingRef} className="overflow-hidden mb-8">
        <h1 className="heading-line text-4xl font-bold">PLAYLISTS</h1>
      </div>
      
      <div ref={tableRef} className="relative w-full">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="text-white">
              <th className="p-6 border-b border-gray-600 text-center text-lg">Name</th>
              <th className="p-6 border-b border-gray-600 text-center text-lg">Genre</th>
              <th className="p-6 border-b border-gray-600 text-center text-lg">Category</th>
              <th className="p-6 border-b border-gray-600 text-center text-lg"></th>
            </tr>
          </thead>
          <tbody>
            {albumData.map((row, index) => (
              <tr
                key={index}
                ref={el => rowsRef.current[index] = el}
                onMouseEnter={() => handleRowEnter(index)}
                onMouseLeave={handleRowLeave}
                className={`transition-colors duration-300 ease-out ${
                  hoveredRow === index ? "bg-red-500" : "bg-black"
                }`}
              >
                <td className="p-6 border-b border-gray-600 text-center text-base">{row.Name}</td>
                <td className="p-6 border-b border-gray-600 text-center text-base">{row.Genre}</td>
                <td className="p-6 border-b border-gray-600 text-center text-base">{row.Category}</td>
                <td className="p-6 border-b border-gray-600 text-center">
                  <button className="text-md font-bold text-white border px-4 py-2 transition-transform duration-200 ease-out hover:scale-105"
                   style={{
                      borderRadius: '50% / 50%'
                    }}
                   >
                    ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Optimized Hover Image with sequential scale animations - positioned closer to mouse */}
        <div
          className="fixed pointer-events-none z-50 origin-center"
          style={{
            top: cursorPosition.y - 120, // Closer to mouse vertically
            left: cursorPosition.x + 0,  // Slightly offset to right of mouse
            transform: `translate3d(0, 0, 0) scale(${
              currentImage !== null && !isTransitioning ? 1 : 0
            })`,
            opacity: currentImage !== null && !isTransitioning ? 1 : 0,
            transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
            willChange: 'transform, opacity'
          }}
        >
          {currentImage !== null && (
            <img
              src={albumData[currentImage].image}
              alt={albumData[currentImage].Name}
              className="w-60 h-36 object-fill rounded-md border border-gray-500 shadow-lg" // Smaller size for closer positioning
              style={{ 
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumTable;