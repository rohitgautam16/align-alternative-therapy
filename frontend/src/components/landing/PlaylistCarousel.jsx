import React, { useState, useRef } from "react";
import Image1 from "../../assets/images/billy-huynh-W8KTS-mhFUE-unsplash-1-scaled.jpg";
import Image2 from "../../assets/images/manuel-meza-jYxNsyxoKJ4-unsplash.webp";
import Image3 from "../../assets/images/quino-al-dw54s2O-lpk-unsplash-scaled.jpg";
import Image4 from "../../assets/images/Feel-Good-Energy.png";
import Image5 from "../../assets/images/bady-abbas-uZoR8U2hyiw-unsplash.jpg";
import Image6 from "../../assets/images/billy-huynh-W8KTS-mhFUE-unsplash-1-scaled.jpg";
import Image7 from "../../assets/images/runze-shi-1kIyfRdLMxI-unsplash-scaled.jpg";

const PlaylistCarousel = () => {
  const artists = [
    { img: Image1, name: "CATEGORY", description: "Fitness & Workout" },
    { img: Image2, name: "CATEGORY", description: "Animals & Pets" },
    { img: Image3, name: "CATEGORY", description: "Mind" },
    { img: Image4, name: "CATEGORY", description: "Ultimate Stress Relief" },
    { img: Image5, name: "CATEGORY", description: "Aesthetics" },
    { img: Image6, name: "CATEGORY", description: "Mind" },
    { img: Image7, name: "CATEGORY", description: "Energy & Regeneration" },
  ];

  const carouselRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const scrollLeft = () => {
    if (carouselRef.current) {
      const newScrollPosition = Math.max(scrollPosition - 300, 0);
      carouselRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
      setScrollPosition(newScrollPosition);
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
      const newScrollPosition = Math.min(scrollPosition + 300, maxScroll);
      carouselRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
      setScrollPosition(newScrollPosition);
    }
  };

  return (
    <div className="bg-black text-white py-10 px-4 relative overflow-x-hidden">
      <h2 className="text-center text-3xl font-bold uppercase mb-6">EXPLORE</h2>
      <p className="text-center max-w-2xl mx-auto mb-8">
        Dive into our collection and begin a journey of self-discovery and transformation
        through the therapeutic medium of sound. Experience the impactful effects of aligning
        with your goals at Align Alternative Therapy.
      </p>

      <div className="relative flex items-center">
        {/* Left Scroll Button */}
        <button
          className="absolute left-0 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full shadow-md hover:bg-opacity-75"
          onClick={scrollLeft}
        >
          &lt;
        </button>

        {/* Carousel */}
        <div
          ref={carouselRef}
          className="flex gap-10 overflow-hidden px-12"
        >
          {artists.map((artist, index) => (
            <div
              key={index}
              className="group flex-shrink-0 w-[300px] md:w-[350px] relative overflow-hidden rounded-lg cursor-pointer transition-all duration-500 hover:w-[500px] hover:z-10"
            >
              {/* Expanding Div */}
              <div className="relative w-full h-[300px] bg-gray-800 hover:bg-gray-700 transition-all duration-500">
                
                <img
                  src={artist.img}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 bg-opacity-60 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-4 transition-opacity duration-500">
                  <h3 className="text-lg font-bold mb-2">{artist.name}</h3>
                  <p className="text-sm mb-4">{artist.description}</p>
                  <button className="bg-white text-black px-1 py-2 rounded-lg hover:bg-gray-200 w-1/3">
                    Listen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          className="absolute right-0 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full shadow-md hover:bg-opacity-75"
          onClick={scrollRight}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default PlaylistCarousel;
