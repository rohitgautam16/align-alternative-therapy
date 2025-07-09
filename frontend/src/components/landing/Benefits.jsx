import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "../../lib/utils";
import BinuralBeats from "../../assets/images/binural beats.jpg";
import Stress from "../../assets/images/stress.png";
import SleepQuality from "../../assets/images/sleep quality.jpg";
import Focus from "../../assets/images/focus.jpg";
import OverallBeing from "../../assets/images/overall-being.jpg";
import Meditation from "../../assets/images/meditation.jpg";
import Creative from "../../assets/images/creativeness.jpg";
import { useNavigate } from 'react-router-dom';

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Simple card component
const Card = React.memo(({ card, onNavigate, index }) => (
  <div className={cn("card", `card-${index}`, "relative group break-inside-avoid")}>
    <div
      className="relative overflow-hidden rounded-xl will-change-transform"
      style={{ height: `${card.height}px` }}
    >
      <img
        src={card.image}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        alt={card.title}
        loading="lazy"
      />

      <button
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full transition-all -rotate-45 flex items-center justify-center hover:scale-110"
        onClick={() => onNavigate(card)}
      >
        →
      </button>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white mb-2">{card.title}</h3>
          <p className="text-white/80 text-sm">{card.description}</p>
        </div>
      </div>
    </div>
  </div>
));

const ParallaxScroll = ({ cards, className, onCardNavigate }) => {
  const containerRef = useRef(null);
  const firstColumnRef = useRef(null);
  const secondColumnRef = useRef(null);

  const half = Math.ceil(cards.length / 2);
  const firstColumn = cards.slice(0, half);
  const secondColumn = cards.slice(half);

  useEffect(() => {
    ScrollTrigger.defaults({ scroller: window });

    // Desktop & tablet parallax and pinning
    ScrollTrigger.matchMedia({
      "(min-width: 768px)": () => {
        // Parallax columns
        gsap.to(firstColumnRef.current, {
          y: -30,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
        gsap.to(secondColumnRef.current, {
          y: 30,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });

        // Pin left section handled in parent
      },
      // Mobile: no parallax movement
      "(max-width: 767px)": () => {
        // Nothing special here; default scrolling
      },
    });

    // Batch fade-in for cards (all viewports)
    ScrollTrigger.batch(".card", {
      interval: 0.1,
      batchMax: 3,
      onEnter: batch => gsap.to(batch, {
        opacity: 1,
        y: 0,
        overwrite: true,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      }),
      start: "top 85%",
      once: false,
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [cards]);

  return (
    <div className={cn("w-full scroll-smooth", className)} ref={containerRef}>
      <div className="grid grid-cols-1 md:grid-cols-2 items-start max-w-full mx-auto gap-4 px-6">
        <div className="grid gap-4" ref={firstColumnRef}>
          {firstColumn.map((card, idx) => (
            <Card key={card.title} card={card} onNavigate={onCardNavigate} index={idx} />
          ))}
        </div>
        <div className="grid gap-4" ref={secondColumnRef}>
          {secondColumn.map((card, idx) => (
            <Card key={card.title} card={card} onNavigate={onCardNavigate} index={idx + half} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Benefits = () => {
  const leftSectionRef = useRef(null);
  const containerRef = useRef(null);
  const rightSectionRef = useRef(null);
  const headerRef = useRef(null);
  const mainImageRef = useRef(null);
  const joinButtonRef = useRef(null);

  const navigate = useNavigate();

  const cards = useMemo(() => [
    { title: "Reduce Stress", description: "Find inner peace...", image: Stress, height: 400 },
    { title: "Improve Sleep Quality", description: "Experience deeper...", image: SleepQuality, height: 350 },
    { title: "Enhanced Focus", description: "Sharpen your mind...", image: Focus, height: 380 },
    { title: "Overall Well-being", description: "Transform your life...", image: OverallBeing, height: 450 },
    { title: "Create Balance", description: "Harmonize your emotions...", image: Meditation, height: 370 },
    { title: "Explore New Ideas", description: "Clear your mind...", image: Creative, height: 390 },
  ], []);

  const handleCardNavigate = useCallback(card => {
    console.log("Navigate to:", card.title);
  }, []);

  const handleJoinNow = useCallback(() => {
    navigate("/pricing"); 
  }, []);

  useEffect(() => {
    // Header
    if (headerRef.current) {
      const [titleEl, descEl] = headerRef.current.children;
      gsap.fromTo(titleEl, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6 });
      gsap.fromTo(descEl, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.2 });
    }

    // Main image & button
    gsap.fromTo(mainImageRef.current, { opacity: 0, x: -40, force3D: true }, { opacity: 1, x: 0, duration: 1 });
    gsap.fromTo(joinButtonRef.current, { scale: 0.9, opacity: 0, force3D: true }, { scale: 1, opacity: 1, delay: 0.5, duration: 0.6 });

    // Pin on desktop
    ScrollTrigger.matchMedia({
      "(min-width: 768px)": () => {
        const pt = ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: () => {
            const rh = rightSectionRef.current?.offsetHeight || 0;
            const vh = window.innerHeight;
            return `+=${Math.max(rh - vh + 100, 0)}`;
          },
          pin: leftSectionRef.current,
          anticipatePin: 1,
          refreshPriority: -1,
        });
        return () => pt.kill();
      }
    });

    const resizeHandler = () => ScrollTrigger.refresh();
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  return (
    <div className="bg-black text-white">
      <div className="text-center py-12 px-6 scroll-smooth" ref={headerRef}>
        <h1 className="text-4xl font-bold lg:text-5xl mb-4">Benefits</h1>
        <p className="text-lg lg:text-xl text-gray-300">
          Improve Mental Health, Relaxation, and Focus with Binaural Beats
        </p>
      </div>

      <div ref={containerRef} className="relative">
        <div className="flex flex-col lg:flex-row">
          <div ref={leftSectionRef} className="w-full lg:w-2/5 lg:h-screen p-6 sticky top-0">
            <div
              ref={mainImageRef}
              className="relative group w-full h-full min-h-[500px] lg:min-h-full overflow-hidden rounded-3xl will-change-transform"
            >
              <img
                src={BinuralBeats}
                alt="Binaural Beats"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col items-center justify-end pb-12">
                <h2 className="text-3xl font-bold mb-4 text-white tracking-wider text-center">
                  Access Premium Sounds
                </h2>
                <button
                  ref={joinButtonRef}
                  className="px-8 py-3 bg-white bg-opacity-90 rounded-full hover:bg-secondary cursor-pointer text-black transition-all duration-300 font-medium"
                  onClick={handleJoinNow}
                >
                  Join Now
                </button>
              </div>
            </div>
          </div>

          <div ref={rightSectionRef} className="w-full lg:w-3/5 py-10">
            <ParallaxScroll cards={cards} className="bg-black" onCardNavigate={handleCardNavigate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Benefits;
