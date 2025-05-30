import React, { useEffect, useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import BinuralBeats from "../../assets/images/binural beats.jpg";
import Stress from "../../assets/images/stress.png";
import SleepQuality from "../../assets/images/sleep quality.jpg";
import Focus from "../../assets/images/focus.jpg";
import OverallBeing from "../../assets/images/overall-being.jpg";
import Meditation from "../../assets/images/meditation.jpg";
import Creative from "../../assets/images/creativeness.jpg";

const Benefits = () => {
  const observerRef = useRef(null);

  useEffect(() => {
    AOS.init({
      duration: 200,
      once: false,
      mirror: true,
    });

    const options = {
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    }, options);

    const cards = document.querySelectorAll(".gallery-item");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const cards = [
    {
      title: "Reduce Stress",
      description: "Find inner peace through guided meditation and calming frequencies",
      image: Stress,
      height: "h-[450px]",
    },
    {
      title: "Improve Sleep Quality",
      description: "Experience deeper, more restful sleep with specialized frequencies",
      image: SleepQuality,
      height: "h-[350px]",
    },
    {
      title: "Enhanced Focus",
      description: "Sharpen your mind and boost productivity",
      image: Focus,
      height: "h-[400px]",
    },
    {
      title: "Overall Well-being",
      description: "Transform your life with holistic sound therapy",
      image: OverallBeing,
      height: "h-[500px]",
    },
    {
      title: "Create Balance",
      description: "Harmonize your emotions through Meditative sound frequencies",
      image: Meditation,
      height: "h-[380px]",
    },
    {
      title: "Explore New Ideas",
      description: "Clear your mind and find your new paths",
      image: Creative,
      height: "h-[420px]",
    },
  ];

  return (
    <div className="flex flex-col bg-black text-white min-h-screen">
      {/* Heading Section */}
      <div className="text-center p-6 md:py-12">
        <h1 className="text-4xl font-bold md:text-5xl mb-4">Benefits</h1>
        <p className="text-lg md:text-xl text-gray-300">
          Improve Mental Health, Relaxation, and Focus with Binaural Beats
        </p>
      </div>

      <div className="flex flex-1">
        {/* Left Section - Sticky */}
        <div className="w-2/5 h-screen sticky top-0 p-4">
          <div
            className="relative group w-full h-full overflow-hidden rounded-3xl"
            data-aos="fade-right"
          >
            <img
              src={BinuralBeats}
              alt="Binaural Beats"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col items-center justify-end pb-12">
              <h2 className="text-3xl font-bold mb-4 text-white tracking-wider">
                Access Premium Sounds
              </h2>
              <button className="px-8 py-3 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 text-black transition-all duration-300 transform hover:scale-105">
                Join Now
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Scrollable Gallery */}
        <div className="w-3/5 min-h-screen p-4 overflow-y-auto">
          <div className="columns-2 gap-4 space-y-4">
            {cards.map((card, index) => (
              <div
                key={index}
                className={`gallery-item break-inside-avoid mb-4 opacity-0 translate-y-10 transition-all duration-700 ease-out ${card.height}`}
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="relative group rounded-xl overflow-hidden h-full">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Arrow Button */}
                  <button
                    className="absolute text-2xl font-bold top-4 right-4 bg-black/50 hover:bg-black/20 text-white w-10 h-10 rounded-full backdrop-blur-sm transition-all -rotate-45 flex items-center justify-center transform hover:scale-110 z-10"
                    onClick={() => console.log("Navigate to details")}
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
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Benefits;
