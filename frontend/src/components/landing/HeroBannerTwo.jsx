import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowOutward } from "react-icons/md";
import { useGetHeroQuery } from "../../utils/api";


const FALLBACK = {
  video_url: "https://cdn.align-alternativetherapy.com/static-pages-media/13115940_3840_2160_60fps.mp4",
  mobile_video_url: null,
  marquee_text: "• Welcome to Align Alternative Therapy •",
  column_2_text: "Experience a unique therapy designed to bring you rapid alignment and incredible personal growth.",
  column_3_text: "Login to explore personalized sound therapy for mind-body harmony.",
  overlay_opacity: 0.2
};

const HeroBannerTwo = () => {
  const videoRef = useRef(null);
  const cursorRef = useRef(null);
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const playAttemptRef = useRef(false);
  const animationFrameRef = useRef(null);

  const MIN_LOADING_TIME = 2000;


  const { data: hero } = useGetHeroQuery();


  const isMobile = useCallback(() => {
    return (
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }, []);

  // Helper to resolve config values with fallback
  const getValue = (key) => {
    if (hero && Object.prototype.hasOwnProperty.call(hero, key)) {
      // explicit check to allow empty string/null from DB to fall back if needed
      const val = hero[key];
      return val === null || val === undefined || val === "" ? FALLBACK[key] : val;
    }
    return FALLBACK[key];
  };

  // Determine video source (use mobile_video_url if available on mobile)
  const getVideoSource = () => {
    if (isMobile()) {
      const mobile = getValue("mobile_video_url");
      if (mobile) return mobile;
      // fallback to desktop video if mobile not provided
      return getValue("video_url");
    }
    return getValue("video_url");
  };

  // Optimized Video Loading Strategy with Better Error Handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.preload = "metadata";
    const loadStartTime = Date.now();
    let hasCompletedLoading = false;

    const completeLoading = () => {
      if (hasCompletedLoading) return;

      const elapsed = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      setTimeout(() => {
        hasCompletedLoading = true;
        setIsVideoLoaded(true);
        setShowPreloader(false);
      }, remainingTime);
    };

    const attemptPlay = async () => {
      if (playAttemptRef.current) return;

      try {
        playAttemptRef.current = true;

        if (video.readyState >= 2) {
          const playPromise = video.play();

          if (playPromise !== undefined) {
            await playPromise;
            // console.log("Video playing successfully");
            completeLoading();
          }
        }
      } catch (error) {
        // console.log("Autoplay prevented:", error.name);
        if (error && (error.name === "AbortError" || error.name === "NotAllowedError")) {
          completeLoading();

          const playOnInteraction = () => {
            video.play().catch((e) => {
              // console.log("Play after interaction failed:", e);
            });
          };

          const interactions = ["click", "touchstart", "keydown"];
          interactions.forEach((event) => {
            document.addEventListener(event, playOnInteraction, { once: true, passive: true });
          });

          setTimeout(() => {
            interactions.forEach((event) => {
              document.removeEventListener(event, playOnInteraction);
            });
          }, 10000);
        } else {
          completeLoading();
        }
      } finally {
        playAttemptRef.current = false;
      }
    };

    const handleCanPlay = () => attemptPlay();
    const handleLoadedData = () => attemptPlay();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && video.paused && isVideoLoaded) {
        video.play().catch((e) => {
          // console.log("Resume play failed:", e);
        });
      }
    };

    if (video.readyState >= 2) {
      attemptPlay();
    }

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("loadedmetadata", handleCanPlay);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const fallbackTimeout = setTimeout(() => {
      if (!hasCompletedLoading) {
        // console.log("Loading timeout - showing interface");
        completeLoading();
      }
    }, MIN_LOADING_TIME + 2000);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("loadedmetadata", handleCanPlay);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(fallbackTimeout);
    };
  }, [MIN_LOADING_TIME, isVideoLoaded]);

  // Intersection Observer for Lazy Loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.preload = "auto";
            video.load();
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "50px"
      }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Optimized Cursor Movement with RAF
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || !isVideoLoaded) return;

    const handleGlobalMouseMove = (e) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        cursor.style.transform = `translate(${e.pageX - 40}px, ${e.pageY - 40}px)`;
      });
    };

    const handleGlobalClick = () => {
      if (isHovering) {
        cursor.classList.add("expand");
        setTimeout(() => {
          cursor.classList.remove("expand");
          navigate("/login");
        }, 500);
      }
    };

    document.addEventListener("mousemove", handleGlobalMouseMove, { passive: true });
    document.addEventListener("click", handleGlobalClick);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("click", handleGlobalClick);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovering, navigate, isVideoLoaded]);

  const handleMouseEnter = useCallback(() => {
    if (isVideoLoaded && !isMobile()) {
      setIsHovering(true);
    }
  }, [isVideoLoaded, isMobile]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);


const prevUpdatedAtRef = useRef(null);

useEffect(() => {
  const newUpdatedAt = hero?.updated_at ?? null;
  if (prevUpdatedAtRef.current === newUpdatedAt) return;
  prevUpdatedAtRef.current = newUpdatedAt;

  const videoEl = videoRef.current;
  if (!videoEl) return;

  const baseUrl = isMobile() ? (hero?.mobile_video_url || hero?.video_url) : (hero?.video_url || FALLBACK.video_url);

  if (!baseUrl) return;

  setIsVideoLoaded(false);
  setShowPreloader(true);

  const cacheBustedUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;

  try {
    videoEl.src = cacheBustedUrl;
    const firstSource = videoEl.querySelector('source');
    if (firstSource) firstSource.src = cacheBustedUrl;

    videoEl.load();
    videoEl.play().catch(() => {
    });

    const t = setTimeout(() => {
      setIsVideoLoaded(true);
      setShowPreloader(false);
    }, 3500);
    return () => clearTimeout(t);
  } catch (err) {
    console.error("Error applying new hero video source:", err);
    setTimeout(() => {
      setIsVideoLoaded(true);
      setShowPreloader(false);
    }, 500);
  }
}, [hero, isMobile]);


  return (
    <>
      {/* Preloader Component (kept commented as before) */}
      {/* <Preloader 
        isVisible={showPreloader}
        onComplete={handlePreloaderComplete}
        minDuration={MIN_LOADING_TIME}
        targetText="ALIGN"
      /> */}

      {/* Custom Cursor */}
      <div
        ref={cursorRef}
        className="cursor"
        style={{
          display: isHovering && isVideoLoaded ? "flex" : "none",
          width: "clamp(60px, 8vw, 80px)",
          height: "clamp(60px, 8vw, 80px)",
          position: "fixed",
          top: 0,
          left: 0,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.9)",
          color: "#000",
          fontSize: "clamp(8px, 1.2vw, 12px)",
          fontWeight: 500,
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 9999,
          border: "1px solid #fff",
          transition: "all 0.2s ease-out",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 15px rgba(0, 0, 0, 0.2)",
          opacity: 1,
          willChange: "transform"
        }}
      >
        LOGIN TO
        <br />
        LISTEN
      </div>

      <section
        style={{
          width: "100vw",
          height: "100svh",
          position: "relative",
          overflow: "hidden",
          minHeight: "100svh",
          backgroundColor: "#000"
        }}
      >
        {/* Video Background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            opacity: isVideoLoaded ? 1 : 0,
            transition: "opacity 0.8s ease-in"
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              backgroundColor: "#000"
            }}
          >
            <source src={getVideoSource()} type="video/mp4" />
            {/* second source: try the lower-res version if available */}
            <source
              src={(getValue("video_url") || FALLBACK.video_url).replace("3840_2160_60fps", "1920_1080_30fps")}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>

          {/* Video Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `rgba(0, 0, 0, ${getValue("overlay_opacity") ?? FALLBACK.overlay_opacity})`,
              transition: "background 0.3s ease-out",
              ...(isHovering && { background: `rgba(0, 0, 0, ${Math.min(1, (getValue("overlay_opacity") ?? FALLBACK.overlay_opacity) + 0.2)})` })
            }}
          />
        </div>

        {/* Content Overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
            padding: "clamp(1rem, 4vw, 2rem) 0 clamp(1.5rem, 4vw, 3rem) 0",
            pointerEvents: "none",
            opacity: isVideoLoaded ? 1 : 0,
            transform: isVideoLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s ease-in-out 0.4s"
          }}
        >
          {/* Responsive Marquee */}
          <div style={{ width: "100vw", overflow: "hidden", marginBottom: "clamp(0.5rem, 2vw, 1rem)" }}>
            <div
              style={{
                display: "flex",
                animation: isVideoLoaded ? "scroll 20s linear infinite" : "none",
                whiteSpace: "nowrap",
                willChange: "transform"
              }}
            >
              {[...Array(10)].map((_, index) => (
                <h2
                  key={index}
                  style={{
                    fontSize: "clamp(3.5rem, 7.5vw, 5rem)",
                    color: "#fff",
                    letterSpacing: "0.10em",
                    fontWeight: 200,
                    paddingRight: "clamp(2rem, 5vw, 4rem)",
                    flexShrink: 0
                  }}
                >
                  {getValue("marquee_text")}
                </h2>
              ))}
            </div>
          </div>

          {/* Container for HR and Columns */}
          <div className="content-container">
            {/* Responsive HR Line */}
            <hr className="responsive-hr" />

            {/* Responsive Three Columns */}
            <div className="responsive-columns">
              {/* Column 1 - Hidden on mobile */}
              <div className="column column-1">
                <div className="arrow-container">
                  <MdArrowOutward className="arrow-icon" />
                </div>
              </div>

              <div className="column column-2">
                <p className="column-text">{getValue("column_2_text")}</p>
              </div>

              <div className="column column-3">
                <p className="column-text">{getValue("column_3_text")}</p>
              </div>
            </div>
          </div>
        </div>

        <style>
          {`
            @keyframes scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }

            @keyframes moveCursor2 {
              0% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.5);
              }
              100% {
                transform: scale(1);
                opacity: 0.8;
              }
            }

            .cursor.expand {
              background: rgba(255, 255, 0, 0.9) !important;
              animation: moveCursor2 0.5s forwards !important;
              border: 2px solid yellow !important;
            }

            /* Content Container */
            .content-container {
              width: 100%;
              margin: 0 auto;
              padding: 0 clamp(1rem, 4vw, 2rem);
            }

            /* Responsive HR */
            .responsive-hr {
              border: none;
              height: 1px;
              background: rgba(255, 255, 255, 0.2);
              margin: clamp(1rem, 3vw, 2rem) 0;
              width: 100%;
            }

            /* Column Grid */
            .responsive-columns {
              display: grid;
              gap: clamp(1rem, 3vw, 2rem);
              grid-template-columns: repeat(3, 1fr);
              align-items: start;
            }

            .column {
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              height: 100%;
            }

            .column-text {
              font-size: clamp(0.8rem, 1.8vw, 0.9rem);
              color: #ccc;
              line-height: 1.6;
              margin: 0;
              text-align: left;
            }

            .arrow-container {
              display: flex;
              justify-content: flex-start;
              align-items: flex-start;
            }

            .arrow-icon {
              color: white;
              width: clamp(32px, 4vw, 40px);
              height: clamp(32px, 4vw, 40px);
              opacity: 0.8;
              transition: opacity 0.3s ease;
            }

            .arrow-icon:hover {
              opacity: 1;
            }

            /* Large Desktop: 1200px+ */
            @media (min-width: 1200px) {
              .content-container {
                padding: 0 3rem;
              }
              
              .column-text {
                font-size: 0.95rem;
                line-height: 1.7;
              }
            }

            /* Desktop/Laptop: 769px - 1199px */
            @media (min-width: 769px) and (max-width: 1199px) {
              .responsive-columns {
                gap: clamp(1.5rem, 2.5vw, 2rem);
              }
              
              .column-text {
                font-size: clamp(0.8rem, 1.6vw, 0.9rem);
                line-height: 1.5;
              }
            }

            /* Tablet: 481px - 768px */
            @media (min-width: 481px) and (max-width: 768px) {
              .responsive-columns {
                grid-template-columns: repeat(3, 1fr);
                gap: clamp(1rem, 2vw, 1.5rem);
              }
              
              .column-text {
                font-size: clamp(0.7rem, 1.8vw, 0.8rem);
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .arrow-icon {
                width: clamp(28px, 3.5vw, 36px);
                height: clamp(28px, 3.5vw, 36px);
              }
            }

            /* Mobile: 320px - 480px */
            @media (max-width: 480px) {
              .content-container {
                padding: 0 1rem;
              }

              .responsive-columns {
                grid-template-columns: 1fr;
                gap: 0;
                text-align: center;
              }
              
              .column-1, .column-3 {
                display: none !important;
              }
              
              .column-2 {
                width: 100%;
              }

              .column-text {
                font-size: clamp(0.9rem, 3vw, 1rem);
                line-height: 1.6;
                text-align: center;
                display: block;
                -webkit-line-clamp: unset;
                overflow: visible;
              }

              .cursor {
                width: 50px !important;
                height: 50px !important;
                font-size: 8px !important;
              }

              .responsive-hr {
                margin: clamp(0.8rem, 2vw, 1.2rem) 0;
              }
            }

            /* Extra Small Mobile: Below 320px */
            @media (max-width: 319px) {
              .column-text {
                font-size: 0.85rem;
                line-height: 1.5;
              }
            }

            /* Reduce motion for accessibility */
            @media (prefers-reduced-motion: reduce) {
              * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
          `}
        </style>
      </section>
    </>
  );
};

export default HeroBannerTwo;
