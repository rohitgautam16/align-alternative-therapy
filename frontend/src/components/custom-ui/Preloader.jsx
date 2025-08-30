import React, { useMemo, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";

const Preloader = ({
  isVisible,
  onComplete,
  targetText = "ALIGN",
  // your confirmed counter speeds
  counterDurations = { c1: 3.8, c2: 6.5, c3: 6.8 },
  // slower, smoother typing loop
  typing = { perChar: 0.22, stagger: 0.26, hold: 0.6 },
  // exit feel
  scaleUpDur = 0.6,
  slideUpDur = 0.95
}) => {
  const loadingScreenRef = useRef(null);
  const counter1Ref = useRef(null);
  const counter2Ref = useRef(null);
  const counter3Ref = useRef(null);
  const textRef = useRef(null);
  const tlRef = useRef(null);
  const typingLoopRef = useRef(null);
  

  const chars = useMemo(() => Array.from(targetText), [targetText]);

  // digits for counter-3: 00..99 + 0
  const counter3Digits = useMemo(() => {
    const twoCycles = Array.from({ length: 20 }, (_, i) => i % 10);
    return [...twoCycles, 0];
  }, []);

  useLayoutEffect(() => {
    if (!isVisible) return;

    const ctx = gsap.context(() => {
      const screen = loadingScreenRef.current;
      const c1 = counter1Ref.current;
      const c2 = counter2Ref.current;
      const c3 = counter3Ref.current;
      const charSpans = textRef.current?.querySelectorAll(".char") || [];

      // initial states
      gsap.set(screen, {
        yPercent: 0,
        scale: 1,
        transformOrigin: "center center",
        opacity: 1,
        display: "block"
      });
      gsap.set([c1, c2, c3], { y: 0, opacity: 1 });
      gsap.set(charSpans, { opacity: 0, y: 10, filter: "blur(2px)" });

      // measurements
      const h1 = c1?.querySelector(".num")?.clientHeight || 100;
      const h2 = c2?.querySelector(".num")?.clientHeight || 100;
      const h3 = c3?.querySelector(".num")?.clientHeight || 100;

      const d1 = ((c1?.querySelectorAll(".num")?.length || 1) - 1) * h1;
      const d2 = ((c2?.querySelectorAll(".num")?.length || 1) - 1) * h2;
      const d3 = ((c3?.querySelectorAll(".num")?.length || 1) - 1) * h3;

      const slowestCounter = Math.max(
        counterDurations.c1,
        counterDurations.c2,
        counterDurations.c3
      );

      // typing loop (plays until counters finish)
      const typingLoop = gsap.timeline({ repeat: -1, defaults: { ease: "power2.out" } });
      typingLoop
        .to(charSpans, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: typing.perChar,
          stagger: typing.stagger
        })
        .to({}, { duration: typing.hold })
        .to(charSpans, {
          opacity: 0,
          y: 10,
          filter: "blur(2px)",
          duration: typing.perChar * 0.8,
          stagger: typing.stagger * 0.6
        });
      typingLoop.pause();
      typingLoopRef.current = typingLoop;

      // master timeline
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          onComplete && onComplete();
        }
      });
      tlRef.current = tl;

      // start together: counters + typing loop
      tl.add("go")
        .to(c3, { y: -d3, duration: counterDurations.c3 }, "go")
        .to(c2, { y: -d2, duration: counterDurations.c2 }, "go")
        .to(c1, { y: -d1, duration: counterDurations.c1 }, "go")
        .call(() => typingLoop.play(0), null, "go");

      // after counters finish: stop loop, lock typed visible, scale up, then slide up
      tl.add("afterCount", `go+=${slowestCounter}`)
        .call(() => {
          typingLoop.kill();
          gsap.set(charSpans, { opacity: 1, y: 0, filter: "blur(0px)" });
        })
        .to([c1, c2, c3], { y: "-=150", opacity: 0, duration: 0.8 }, "afterCount")
        .to(screen, { scale: 1.04, duration: scaleUpDur }, "afterCount")
        .to(
          screen,
          {
            yPercent: -100,
            duration: slideUpDur,
            onComplete: () => {
              // ensure no black stays on top for even a frame
              gsap.set(screen, { display: "none" });
              onComplete && onComplete();
            }
          },
          `afterCount+=0.2`
        );
    }, loadingScreenRef);

    return () => {
      tlRef.current?.kill();
      typingLoopRef.current?.kill();
      ctx.revert();
    };
  }, [isVisible, onComplete, counterDurations, typing, scaleUpDur, slideUpDur]);

  if (!isVisible) return null;

  return (
    <div ref={loadingScreenRef} className="loading-screen">
      {/* Centered typing with caret at START */}
      <div className="text-container center">
        <div ref={textRef} className="typing">
          <span className="caret" />
          {chars.map((ch, i) => (
            <span key={i} className="char">{ch === " " ? "\u00A0" : ch}</span>
          ))}
        </div>
      </div>

      {/* Counters bottom-left (unchanged) */}
      <div className="counter">
        <div ref={counter1Ref} className="counter-1 digit">
          <div className="num">0</div>
          <div className="num num1offset1">1</div>
        </div>
        <div ref={counter2Ref} className="counter-2 digit">
          <div className="num">0</div>
          <div className="num num1offset2">1</div>
          <div className="num">2</div>
          <div className="num">3</div>
          <div className="num">4</div>
          <div className="num">5</div>
          <div className="num">6</div>
          <div className="num">7</div>
          <div className="num">8</div>
          <div className="num">9</div>
          <div className="num">0</div>
        </div>
        <div ref={counter3Ref} className="counter-3 digit">
          {counter3Digits.map((n, i) => (
            <div key={i} className="num">{n}</div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .loading-screen {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: #000; /* main screen is black */
          color: #fff;
          z-index: 10000;
          overflow: hidden;
          will-change: transform, opacity;
          transform-origin: center center;
        }

        /* Centered typing */
        .text-container.center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          user-select: none;
          pointer-events: none;
          z-index: 2;
        }
        .typing {
          font-size: 5rem;
          font-weight: 200;
          letter-spacing: 0.18em;
          line-height: 1.1;
          white-space: nowrap;
          display: inline-flex;
          align-items: baseline;
          gap: 6px; /* spacing between caret and first char */
        }
        .char {
          display: inline-block;
          will-change: transform, opacity, filter;
        }
        .caret {
          display: none;
          width: 2px;
          height: 1em;
          background: #fff;
          transform: translateY(2px);
          animation: blink 1s steps(1, end) infinite;
          flex: 0 0 auto;
        }
        @keyframes blink { 50% { opacity: 0; } }

        /* Counters */
        .counter {
          position: fixed;
          left: 50px;
          bottom: 50px;
          display: flex;
          height: 100px;
          font-size: 100px;
          line-height: 102px;
          font-weight: 400;
          overflow: hidden;
          z-index: 1;
        }
        .counter-1, .counter-2, .counter-3 { position: relative; top: 0; }
        .num1offset1 { position: relative; right: -12px; }
        .num1offset2 { position: relative; right: -10px; }
        .num {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .typing {
            font-size: 3rem;
            letter-spacing: 0.14em;
          }
          .counter {
            left: 20px;
            bottom: 20px;
            font-size: 60px;
            line-height: 62px;
            height: 60px;
          }
          .num { height: 60px; }
        }
      `}</style>
    </div>
  );
};

export default Preloader;
