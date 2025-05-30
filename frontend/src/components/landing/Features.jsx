import React, { useState, useEffect } from "react";
import Image1 from '../../assets/images/binural beats (7).jpg';

const Features = () => {
  const slides = [
    {
      image: Image1,
      quote:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut ",
      author: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
      location: "Lorem ipsum dolor ",
    },
    {
        image: Image1,
        quote:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut ",
        author: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
        location: "Lorem ipsum dolor ",
    },
    {
        image: Image1,
        quote:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut ",
        author: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
        location: "Lorem ipsum dolor ",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="bg-black min-h-screen flex items-center justify-center p-8 px-20">
      {/* Left-aligned Carousel */}
      <div className="w-full">
        {/* Heading */}
        <h1 className="text-white text-3xl text-center font-bold mb-4">
          Features
        </h1>
        <h2 className="text-gray-400 text-center text-lg mb-8">
          See how these Sounds Help you live a better life
        </h2>

        {/* Content Section */}
        <div className="relative flex items-start">
          {/* Image */}
          <div className="relative w-2/4">
            <img
              src={slides[currentSlide].image}
              alt={`Slide ${currentSlide + 1}`}
              className="rounded-full border-l border-white w-full h-auto shadow-lg transform hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Text Section */}
          <div className="absolute bottom-0 right-20 bg-[#ffffffce] bg-opacity-90 p-8 rounded-lg shadow-lg max-w-lg translate-y-10">
            <blockquote className="text-gray-800 text-lg italic mb-4">
              {slides[currentSlide].quote}
            </blockquote>
            <p className="text-gray-700 text-sm mb-6">
              <strong>{slides[currentSlide].author}</strong>
              <br />
              {slides[currentSlide].location}
            </p>
            {/* Button */}
            <button className="text-red-400 font-semibold hover:underline flex items-center space-x-1">
              <span>Learn More</span>
              <span className="text-xl">→</span>
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-start mt-8 space-x-2 translate-x-1/4 mr-5">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-4 h-4 rounded-full ${
                index === currentSlide ? "bg-red-500" : "bg-gray-500"
              }`}
              onClick={() => handleDotClick(index)}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
