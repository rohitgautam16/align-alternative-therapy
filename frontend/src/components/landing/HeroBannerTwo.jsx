import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowOutward } from "react-icons/md";

const videoUrl = "https://videos.pexels.com/video-files/6509628/6509628-uhd_2560_1440_30fps.mp4";

const HeroBannerTwo = () => {
  const videoRef = useRef(null);
  const cursorRef = useRef(null);
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.load();
      setTimeout(async () => {
        try {
          await video.play();
        } catch (error) {
          console.log("Video autoplay failed:", error);
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;

    const handleGlobalMouseMove = (e) => {
      if (cursor) {
        cursor.style.top = `${e.pageY - 40}px`;
        cursor.style.left = `${e.pageX - 40}px`;
      }
    };

    const handleGlobalClick = () => {
      if (cursor && isHovering) {
        cursor.classList.add("expand");
        setTimeout(() => {
          cursor.classList.remove("expand");
          navigate("/login");
        }, 500);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('click', handleGlobalClick);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [isHovering, navigate]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <>
      {/* Custom Cursor */}
      <div
        ref={cursorRef}
        className="cursor"
        style={{
          display: isHovering ? "flex" : "none",
          width: "clamp(60px, 8vw, 80px)",
          height: "clamp(60px, 8vw, 80px)",
          position: "fixed",
          top: "50%",
          left: "50%",
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
          transform: "scale(1)",
        }}
      >
        CLICK TO<br />LOGIN
      </div>

      <section 
        style={{ 
          width: "100vw", 
          height: "100vh", 
          position: "relative", 
          overflow: "hidden",
          minHeight: "100vh",
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
            preload="auto"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl.replace('uhd_2560_1440_30fps', 'hd_1920_1080_30fps')} type="video/mp4" />
          </video>

          {/* Video Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0, 0, 0, 0.2)",
              transition: "background 0.2s ease-out",
              ...(isHovering && { background: "rgba(0, 0, 0, 0.4)" }),
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
          }}
        >
          {/* Responsive Marquee */}
          <div 
            style={{ 
              width: "100vw", 
              overflow: "hidden", 
              marginBottom: "clamp(0.5rem, 2vw, 1rem)"
            }}
          >
            <div
              style={{
                display: "flex",
                animation: "scroll 20s linear infinite",
                whiteSpace: "nowrap",
                willChange: "transform",
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(3.5rem, 7.5vw, 5rem)",
                  color: "#fff",
                  letterSpacing: "0.10em",
                  fontWeight: 200,
                  paddingRight: "clamp(2rem, 5vw, 4rem)",
                  flexShrink: 0,
                }}
              >
                • Welcome to Align Alternative Therapy •
              </h2>
            </div>
          </div>

          {/* Responsive HR Line */}
          <hr
            style={{
              border: "none",
              height: "1px",
              background: "rgba(255,255,255,0.2)",
              margin: "clamp(1rem, 3vw, 2rem) auto",
              width: "90%",
            }}
          />

          {/* Responsive Three Columns */}
          <div
            className="responsive-columns"
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 clamp(1rem, 4vw, 2rem)",
              display: "grid",
              gap: "clamp(1rem, 3vw, 2rem)",
            }}
          >
            {/* Column 1 - Hidden on mobile  */}
            <div className="column-1">
              {/* <p className="column-text">
                Discover personalized audio journeys that quickly balance your mind, body, and spirit.
              </p> */}
              <MdArrowOutward className="text-white h-10 w-10"/>
            </div>

            {/* Column 2 - Always visible */}
            <div className="column-2">
              <p className="column-text">
                Experience a unique therapy designed to bring you rapid alignment and incredible personal growth.
              </p>
            </div>

            {/* Column 3 - Hidden on mobile */}
            <div className="column-3">
              <p className="column-text">
                Login to explore personalized sound therapy for mind-body harmony.
              </p>
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

            /* Default: Desktop - 3 columns */
            .responsive-columns {
              grid-template-columns: repeat(3, 1fr);
            }

            .column-text {
              fontSize: clamp(0.8rem, 2vw, 0.9rem);
              color: #ccc;
              lineHeight: 1.6;
              margin: 0;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              text-overflow: ellipsis;
            }

            /* Tablet: 768px - 1024px - Keep 3 columns with text truncation */
            @media (min-width: 481px) and (max-width: 1024px) {
              .responsive-columns {
                grid-template-columns: repeat(3, 1fr);
                gap: clamp(0.8rem, 2vw, 1.5rem);
              }
              
              .column-text {
                font-size: clamp(0.7rem, 1.8vw, 0.85rem);
                -webkit-line-clamp: 2; /* Truncate to 2 lines on tablet */
                line-height: 1.4;
              }
            }

            /* Mobile: Below 480px - Show only 1 column, hide others */
            @media (max-width: 480px) {
              .responsive-columns {
                grid-template-columns: 1fr;
              }
              
              .column-1, .column-3 {
                display: none !important;
              }
              
              .column-text {
                font-size: clamp(0.85rem, 3vw, 1rem);
                -webkit-line-clamp: unset; /* No truncation on mobile, show full text */
                line-height: 1.5;
                text-align: center;
              }

              .cursor {
                width: 50px !important;
                height: 50px !important;
                font-size: 8px !important;
              }
            }
          `}
        </style>
      </section>
    </>
  );
};

export default HeroBannerTwo;
