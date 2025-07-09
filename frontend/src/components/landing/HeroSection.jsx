import React, { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const heroRef = useRef(null);
  const headingRef = useRef(null);
  const videoRef = useRef(null);

  useLayoutEffect(() => {
    const heroEl = heroRef.current;
    const textLines = headingRef.current.querySelectorAll(".text-line");
    const videoEl = videoRef.current;

    // 1) Animate heading lines in with slide-up reveal effect
    gsap.fromTo(
      textLines,
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

    // 2) Animate video "clip-path" from fully clipped to fully shown
    gsap.fromTo(
      videoEl,
      {
        clipPath: "inset(0 100% 0 0)",
        webkitClipPath: "inset(0 100% 0 0)",
      },
      {
        clipPath: "inset(0 0% 0 0)",
        webkitClipPath: "inset(0 0% 0 0)",
        duration: 1.2,
        delay: 3.2,
        ease: "power4.out",
      }
    );

    // 3) Create timeline for scroll-triggered animations
    const scrollTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: heroEl,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        pin: true,
      },
    });

    // 4) Scale video to fullscreen with proper object-fit cover
    scrollTimeline.to(videoEl, {
      width: "100vw",
      height: "100vh",
      borderRadius: "0px",
      position: "fixed",
      top: "50%",
      left: "50%",
      objectFit: "cover",
      transform: "translate(-50%, -50%)",
      maxWidth: "none",
      maxHeight: "none",
      margin: "0",
      padding: "0",
      zIndex: 20,
      duration: 1,
      ease: "power2.out",
    }, 0);

    // 5) Fade out and slide up the text simultaneously
    scrollTimeline.to(headingRef.current, {
      opacity: 0,
      y: -150,
      scale: 0.5,
      duration: 0.8,
      ease: "power2.out",
    }, 0);

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <>
      {/* HERO SECTION: full‐screen dark, with multi‐line heading + clip‐anim video */}
      <header
        ref={heroRef}
        className="relative w-screen h-screen bg-black"
      >
        <div
          ref={headingRef}
          className=" inset-0 flex items-center w-screen h-screen justify-center z-10 px-4 text-center"
        >
          <h1
            className="text-white font-heading uppercase tracking-wide"
            style={{
              fontSize: "6rem",
              lineHeight: 1.5,
            }}
          >
            <div className="overflow-hidden">
              <div className="text-line block">&nbsp;Your</div>
            </div>
            <div className="overflow-hidden">
              <div className="text-line block">Inner&nbsp;Harmony</div>
            </div>
            <div className="overflow-hidden">
              <div className="text-line block">Amplified</div>
            </div>
          </h1>
        </div>

        {/* VIDEO ELEMENT (absolutely positioned to allow free scaling) */}
        <video
          ref={videoRef}
          className="absolute top-1/2 left-1/2 w-72 max-w-lg object-cover rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-20"
          src="https://cdn.pixabay.com/video/2023/08/31/178474-860033394_large.mp4"
          autoPlay
          muted
          loop
          playsInline
          style={{ objectFit: "cover" }}
        />
      </header>

    </>
  );
};

export default HeroSection;