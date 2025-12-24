// src/components/AlbumTable.jsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import MemoryImg from "../../assets/images/Memory.png";
import PeakStateImg from "../../assets/images/Peak State.jpg";
import OptimismImg from "../../assets/images/optimism.jpg";
import IntuitionImg from "../../assets/images/Intuition.jpg";

const AlbumTable = () => {
  const navigate = useNavigate();
  const [hoveredRow, setHoveredRow]       = useState(null);
  const [currentImage, setCurrentImage]   = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cursorPosition, setCursorPosition]   = useState({ x: 0, y: 0 });

  const animationFrameRef     = useRef(null);
  const transitionTimeoutRef  = useRef(null);
  const sectionRef            = useRef(null);
  const headingRef            = useRef(null);
  const tableRef              = useRef(null);
  const rowsRef               = useRef([]);

  const albumData = [
    { Name: "Memory",     Genre: "Soulful", Category: "Mind", image: MemoryImg },
    { Name: "Peak State Gamma", Genre: "Soulful", Category: "Mind", image: PeakStateImg },
    { Name: "Optimism",   Genre: "Soulful", Category: "Mind", image: OptimismImg },
    { Name: "Intuition",  Genre: "Soulful", Category: "Mind", image: IntuitionImg },
  ];

  // 1) Throttle mousemove with RAF
  const handleMouseMove = useCallback((e) => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    });
  }, []);

  // 2) Row enter / exit with smooth scale transitions
  const handleRowEnter = useCallback((idx) => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

    if (currentImage !== null && currentImage !== idx) {
      setIsTransitioning(true);
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrentImage(idx);
        setHoveredRow(idx);
        // then scale up
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
    } else {
      setCurrentImage(idx);
      setHoveredRow(idx);
      setIsTransitioning(false);
    }
  }, [currentImage]);

  const handleRowLeave = useCallback(() => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

    setHoveredRow(null);
    setIsTransitioning(true);
    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentImage(null);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // 3) GSAP scroll reveal
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start:   "top 100%",
        end:     "bottom 20%",
        scrub:   1,
        toggleActions: "play none none reverse",
      }
    });

    tl.fromTo(
      headingRef.current.querySelectorAll(".heading-line"),
      { yPercent: 100, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 2, ease: "power4.out", stagger: 0.3 }
    )
    .fromTo(
      tableRef.current,
      { scale: 0.8, opacity: 0, y: 100 },
      { scale: 1, y: 0, opacity: 1, duration: 0.4, ease: "power4.out" },
      "-=1.7"
    )
    .fromTo(
      rowsRef.current,
      { x: -200, opacity: 0, scale: 0.9 },
      {
        x: 0, opacity: 1, scale: 1, duration: 0.6,
        stagger: { amount: 0.3, from: "start", ease: "power2.out" },
        ease: "power4.out"
      },
      "-=1.7"
    );

    return () => ScrollTrigger.getAll().forEach(st => {
      if (st.trigger === sectionRef.current) st.kill();
    });
  }, []);

  // 4) cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  // 5) Build slug from name
  const makeSlug = (name) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

  return (
    <div
      ref={sectionRef}
      className="bg-black text-white p-10 flex flex-col items-center w-screen"
      onMouseMove={handleMouseMove}
    >
      <div ref={headingRef} className="overflow-hidden mb-8">
        <h1 className="heading-line text-4xl font-bold">PLAYLISTS</h1>
      </div>

      <div ref={tableRef} className="relative w-full">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="text-white">
              <th className="p-6 border-b border-gray-600 text-center">Name</th>
              <th className="p-6 border-b border-gray-600 text-center">Genre</th>
              <th className="p-6 border-b border-gray-600 text-center">Category</th>
              <th className="p-6 border-b border-gray-600 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {albumData.map((row, idx) => (
              <tr
                key={idx}
                ref={el => rowsRef.current[idx] = el}
                onMouseEnter={() => handleRowEnter(idx)}
                onMouseLeave={handleRowLeave}
                className={`transition-colors duration-300 ease-out ${
                  hoveredRow === idx ? "bg-secondary" : "bg-black"
                }`}
              >
                <td className="p-6 border-b border-gray-600 text-center">{row.Name}</td>
                <td className="p-6 border-b border-gray-600 text-center">{row.Genre}</td>
                <td className="p-6 border-b border-gray-600 text-center">{row.Category}</td>
                <td className="p-6 border-b border-gray-600 text-center">
                  <button
                    onClick={() => navigate(`/dashboard/playlist/${makeSlug(row.Name)}`)}
                    className="text-xl text-white border px-4 py-2 rounded-full transition-transform duration-200 ease-out hover:scale-105"
                  >
                    ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Hover image */}
        <div
          className="fixed pointer-events-none z-50 origin-center"
          style={{
            top: cursorPosition.y - 120,
            left: cursorPosition.x,
            transform: `scale(${currentImage !== null && !isTransitioning ? 1 : 0})`,
            opacity:   currentImage !== null && !isTransitioning ? 1 : 0,
            transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
            willChange: "transform, opacity",
          }}
        >
          {currentImage !== null && (
            <img
              src={albumData[currentImage].image}
              alt={albumData[currentImage].Name}
              className="w-60 h-36 object-cover rounded-md border border-gray-500 shadow-lg"
              style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumTable;
