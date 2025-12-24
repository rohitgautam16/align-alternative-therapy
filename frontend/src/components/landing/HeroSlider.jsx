import { useEffect, useRef, useState } from "react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/splide/css";
import "@splidejs/react-splide/css";

const HeroSlider = () => {
  const splideRef = useRef(null);
  const progressRef = useRef(null);
  const [progress, setProgress] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = [
    {
      id: 1,
      backgroundImage: "https://images.unsplash.com/photo-1683876256262-a752b7a1150b?w=1200&auto=format&fit=crop&q=80",
      title: "Welcome to Align Alternative Therapy",
      text: "Experience the transformative power of holistic healing through our innovative approach to wellness and personal growth.",
    },
    {
      id: 2,
      backgroundImage: "https://images.unsplash.com/photo-1745800151756-09d9f1b37ed6?w=1200&auto=format&fit=crop&q=80",
      title: "Do I need to play the entire Audio?",
      text: "No, you have the flexibility to listen to as much or as little as you prefer, feel free to tailor your experience to your needs and schedule. However consistency has its own rewards.",
    },
    {
      id: 3,
      backgroundImage: "https://plus.unsplash.com/premium_photo-1661315669250-0a0255fb0e6b?w=1200&auto=format&fit=crop&q=80",
      title: "Do I need headphones to experience benefits?",
      text: "No, headphones are not required. Our audio therapies can be enjoyed through speakers as well. Recommended Volume - 30-50%",
    },
  ];

  useEffect(() => {
    if (!splideRef.current) return;
    const splide = splideRef.current.splide;

    splide.on("active", () => {
      setActiveIndex(splide.index);
    });

    splide.on("autoplay:playing", (rate) => {
      setProgress(1 - rate);
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${1 - rate})`;
      }
    });

    splide.on("autoplay:start", () => setProgress(1));
    splide.on("move", () => setProgress(1));

    return () => {
      splide.off("active");
      splide.off("autoplay:playing");
      splide.off("autoplay:start");
      splide.off("move");
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none group">
      {/* Fix Splide container heights */}
      <style jsx global>{`
        .splide__track,
        .splide__list,
        .splide__slide {
          height: 100%;
        }
      `}</style>

      <Splide
        ref={splideRef}
        options={{
          type: "loop",
          speed: 1000,
          autoplay: true,
          interval: 6500,
          pauseOnHover: false,
          pauseOnFocus: false,
          resetProgress: true,
          arrows: false,
          pagination: false,
          height: "100%",
        }}
        className="w-full h-full"
      >
        {slides.map((slide) => (
          <SplideSlide key={slide.id}>
            {/* Background image */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.backgroundImage})` }}
            />
            {/* Subtle dark overlay for contrast */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Centered heading */}
            <div className="absolute inset-0 flex items-center justify-start z-10 pointer-events-none px-6 lg:px-12 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white text-left drop-shadow-lg">
                {slide.title}
              </h1>
            </div>

            {/* Moved description text to bottom-left */}
            <div className="absolute left-0 bottom-0 z-10 w-full pb-10 px-6 lg:px-12 max-w-2xl">
              <p className="text-md sm:text-lg md:text-xl text-white/90">
                {slide.text}
              </p>
            </div>
          </SplideSlide>
        ))}
      </Splide>

      {/* Numbered 16:9 image preview boxes and progress bar below active preview */}
      <div className="absolute bottom-0 right-0 z-30 w-auto pb-8 pr-3 sm:pr-5">
        <div className="grid auto-cols-min grid-flow-col gap-x-2 place-content-end">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="row-start-1 flex flex-col gap-1"
              style={{ gridColumn: index + 1 }}
            >
              {/* Slide number */}
              <span className="text-xs sm:text-sm font-bold text-white/80">
                0{index + 1}.
              </span>
              {/* Preview image box */}
              <button
                className={`aspect-video w-28 h-16 md:w-36 md:h-20 rounded-md overflow-hidden focus:outline-none transition-transform hover:scale-105 active:scale-95 ${
                  activeIndex === index ? "ring-2 ring-white scale-105" : "opacity-80"
                }`}
                onClick={() => splideRef.current?.splide.go(index)}
                aria-label={`Go to slide ${index + 1}`}
              >
                <img
                  src={slide.backgroundImage}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          ))}
          {/* Autoplay progress bar below active preview */}
          <div
            className="row-start-2 flex justify-center w-28 md:w-36 transition-transform duration-300 ease-out"
            style={{
              gridColumn: activeIndex + 1,
              marginTop: "0.5rem",
            }}
          >
            <div className="relative w-full h-0.5 rounded-full overflow-hidden bg-white/20">
              <div
                ref={progressRef}
                className="absolute inset-0 bg-white origin-left"
                style={{
                  transform: `scaleX(${progress})`,
                  transition: "transform 50ms linear",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        className="hero-prev absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 md:flex"
        onClick={() => splideRef.current?.splide.go("<")}
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        className="hero-next absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 md:flex"
        onClick={() => splideRef.current?.splide.go(">")}
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default HeroSlider;
