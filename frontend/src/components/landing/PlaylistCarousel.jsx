import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";


// Your original image imports
import Image1 from "../../assets/images/billy-huynh-W8KTS-mhFUE-unsplash-1-scaled.jpg";
import Image2 from "../../assets/images/manuel-meza-jYxNsyxoKJ4-unsplash.webp";
import Image3 from "../../assets/images/quino-al-dw54s2O-lpk-unsplash-scaled.jpg";
import Image4 from "../../assets/images/Feel-Good-Energy.png";
import Image5 from "../../assets/images/bady-abbas-uZoR8U2hyiw-unsplash.jpg";
import Image6 from "../../assets/images/billy-huynh-W8KTS-mhFUE-unsplash-1-scaled.jpg";
import Image7 from "../../assets/images/runze-shi-1kIyfRdLMxI-unsplash-scaled.jpg";

const PlaylistCarousel = () => {
  const artists = [
    { img: Image1, name: "CATEGORY", description: "Fitness & Workout", slug: "fitness-workouts-weight-loss", },
    { img: Image2, name: "CATEGORY", description: "Animals & Pets" },
    { img: Image3, name: "CATEGORY", description: "Mind" },
    { img: Image4, name: "CATEGORY", description: "Ultimate Stress Relief" },
    { img: Image5, name: "CATEGORY", description: "Aesthetics" },
    { img: Image6, name: "CATEGORY", description: "Mind" },
    { img: Image7, name: "CATEGORY", description: "Energy & Regeneration" },
  ];

  const carouselRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });

  useEffect(() => {
    const updateContainerWidth = () => {
      if (carouselRef.current) {
        setContainerWidth(carouselRef.current.clientWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - carouselRef.current.offsetLeft,
      scrollLeft: carouselRef.current.scrollLeft,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 2;
    carouselRef.current.scrollLeft = dragStart.scrollLeft - walk;
    setScrollPosition(carouselRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].pageX - carouselRef.current.offsetLeft,
      scrollLeft: carouselRef.current.scrollLeft,
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 2;
    carouselRef.current.scrollLeft = dragStart.scrollLeft - walk;
    setScrollPosition(carouselRef.current.scrollLeft);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      const scrollAmount = containerWidth * 0.6;
      const newScrollPosition = Math.max(scrollPosition - scrollAmount, 0);
      carouselRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
      setScrollPosition(newScrollPosition);
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const scrollAmount = containerWidth * 0.6;
      const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
      const newScrollPosition = Math.min(scrollPosition + scrollAmount, maxScroll);
      carouselRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
      setScrollPosition(newScrollPosition);
    }
  };

  const getItemStyle = (index) => {
    if (hoveredIndex === null) {
      return {
        width: 'var(--item-width)',
        flexShrink: 0,
      };
    }

    if (index === hoveredIndex) {
      const expandWidth = containerWidth < 768 
        ? `${containerWidth * 0.5}px`
        : `${containerWidth * 0.4}px`;
      
      return {
        width: expandWidth,
        flexShrink: 0,
        zIndex: 10,
      };
    } else {
      const normalWidth = containerWidth < 768 
        ? `${containerWidth * 0.3}px`
        : `${containerWidth * 0.25}px`;
      
      return {
        width: normalWidth,
        flexShrink: 0,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }
  };

  // Calculate if scroll buttons should be disabled
  const isLeftDisabled = scrollPosition <= 0;
  const isRightDisabled = carouselRef.current ? 
    scrollPosition >= (carouselRef.current.scrollWidth - carouselRef.current.clientWidth) : false;

  return (
    <div className="bg-black text-white py-8 md:py-12 lg:py-16 relative">
     <style>{`
      :root {
        --item-width: clamp(250px, 30vw, 350px);
        --item-height: clamp(250px, 25vw, 300px);
        --gap: clamp(1rem, 2.5vw, 2.5rem);
      }

      .carousel-item {
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: width, transform;
      }

      .carousel-item:hover {
        transform: translateY(-0.5rem);
      }

      @media (max-width: 768px) {
        :root {
          --item-width: clamp(200px, 45vw, 280px);
          --item-height: clamp(200px, 35vw, 250px);
          --gap: clamp(0.75rem, 2vw, 1.5rem);
        }
      }

      .scroll-button {
        transition: all 0.3s ease;
        backdrop-filter: blur(8px);
        will-change: transform, background-color, border-color;
      }

      .scroll-button:hover:not(:disabled) {
        transform: scale(1.05);
        background: rgba(255, 255, 255, 0.1) !important;
        border-color: rgba(255, 255, 255, 0.8) !important;
      }

      .scroll-button:active:not(:disabled) {
        transform: scale(0.95);
      }

      .scroll-button:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        transform: scale(1);
      }

      .carousel-container {
        cursor: ${isDragging ? 'grabbing' : 'grab'};
        user-select: none;
      }

      .carousel-container:active {
        cursor: grabbing;
      }
    `}</style>


      {/* Padding Container */}
      <div className="px-2 md:px-7 lg:px-10">
        <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-bold uppercase mb-4 md:mb-6">
          EXPLORE
        </h2>
        <p className="text-center max-w-2xl mx-auto mb-6 md:mb-8 text-sm md:text-base px-4">
          Dive into our collection and begin a journey of self-discovery and transformation
          through the therapeutic medium of sound. Experience the impactful effects of aligning
          with your goals at Align Alternative Therapy.
        </p>

        <div className="relative max-w-7xl mx-auto">
          {/* Left Scroll Button */}
          <button
            className="scroll-button absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-transparent border border-white/30 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-white/10 hover:border-white/60 disabled:opacity-30 cursor-pointer transition-all duration-300"
            onClick={scrollLeft}
            disabled={isLeftDisabled}
            aria-label="Scroll left"
          >
            <svg 
              className="w-5 h-5 md:w-6 md:h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Carousel Container */}
          <div className="mx-10 md:mx-15 lg:mx-20">
            <div
              ref={carouselRef}
              className="carousel-container flex gap-[var(--gap)] overflow-hidden py-6 md:py-8"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' }
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {artists.map((artist, index) => (
                <div
                  key={index}
                  className="carousel-item group relative overflow-hidden rounded-lg cursor-pointer"
                  style={getItemStyle(index)}
                  onMouseEnter={() => !isDragging && setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div 
                    className="relative w-full bg-gray-800 hover:bg-gray-700 transition-colors duration-500 rounded-lg overflow-hidden"
                    style={{ height: 'var(--item-height)' }}
                  >
                    <img
                      src={artist.img}
                      alt={artist.description}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      draggable="false"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-3 md:p-4 lg:p-6 transition-all duration-500">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                        <h3 className="text-xs md:text-sm lg:text-base font-semibold mb-1 md:mb-2 text-gray-200">
                          {artist.name}
                        </h3>
                        <p className="text-xs md:text-sm lg:text-base mb-3 md:mb-4 text-white font-medium leading-tight">
                          {artist.description}
                        </p>
                        <button 
                          className="bg-transparent text-white border border-white px-3 md:px-4 py-1.5 md:py-2 rounded- md:rounded-full hover:bg-gray-100 hover:text-black text-xs md:text-sm font-medium transition-colors duration-300 w-fit min-w-[4rem] md:min-w-[5rem]"
                          style={{
                            borderRadius: '50% / 50%'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          Listen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Scroll Button */}
          <button
            className="scroll-button absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-transparent border border-white/30 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-white/10 hover:border-white/60 disabled:opacity-30 cursor-pointer transition-all duration-300"
            onClick={scrollRight}
            disabled={isRightDisabled}
            aria-label="Scroll right"
          >
            <svg 
              className="w-5 h-5 md:w-6 md:h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistCarousel;