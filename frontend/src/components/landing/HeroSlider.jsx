import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Parallax, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/parallax';

const HeroSlider = () => {
  const swiperRef = useRef(null);

  const slides = [
    {
      id: 1,
      backgroundImage: 'https://images.unsplash.com/photo-1683876256262-a752b7a1150b?w=1200&auto=format&fit=crop&q=80',
      title: 'Welcome to Align Alternative Therapy',
      text: 'Experience the transformative power of holistic healing through our innovative approach to wellness and personal growth.',
    },
    {
      id: 2,
      backgroundImage: 'https://images.unsplash.com/photo-1745800151756-09d9f1b37ed6?w=1200&auto=format&fit=crop&q=80',
      title: 'Do I need to play the entire Audio?',
      text: 'No, you have the flexibility to listen to as much or as little as you prefer, feel free to tailor your experience to your needs and schedule. However consistency has its own rewards.',
    },
    {
      id: 3,
      backgroundImage: 'https://plus.unsplash.com/premium_photo-1661315669250-0a0255fb0e6b?w=1200&auto=format&fit=crop&q=80',
      title: 'Do I need headphones to experience benefits?',
      text: 'No, headphones are not required. Our audio therapies can be enjoyed through speakers as well. Recommended Volume - 30-50%',
    }
  ];

  const handleScrollDown = () => {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden group">
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination, Parallax, Autoplay]}
        loop={true}
        speed={1000}
        parallax={true}
        spaceBetween={0}
        autoplay={{
          delay: 6500,
          disableOnInteraction: false,
        }}
        pagination={{
          el: '.hero-pagination',
          clickable: true,
        }}
        navigation={{
          nextEl: '.hero-next',
          prevEl: '.hero-prev',
        }}
        className="w-full h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            {/* Background Image */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.backgroundImage})` }}
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-center px-6 lg:px-12">
              <div className="max-w-4xl mx-auto text-center">
                <h1 
                  data-swiper-parallax="-300"
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
                >
                  {slide.title}
                </h1>
                <p 
                  data-swiper-parallax="-200"
                  className="text-lg sm:text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto"
                >
                  {slide.text}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Arrows - Hidden by default, show on hover */}
      <button className="hero-prev absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300  md:flex">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button className="hero-next absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300  md:flex">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Pagination - Hidden by default, show on hover */}
      <div className="hero-pagination absolute bottom-20 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300" />

      {/* Scroll Down Arrow */}
      <button
        onClick={handleScrollDown}
        className="absolute left-1/2 -translate-x-1/2 bottom-8 z-30 flex flex-col items-center text-white/80 hover:text-white transition-colors duration-200 focus:outline-none group"
        aria-label="Scroll down"
      >
        <span className="text-sm font-medium mb-2">Scroll</span>
        <svg
          className="w-6 h-6 animate-bounce group-hover:animate-pulse"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Custom Styles */}
      <style jsx>{`
        .hero-pagination .swiper-pagination-bullet {
          width: 12px !important;
          height: 12px !important;
          background: rgba(255, 255, 255, 0.6) !important;
          opacity: 0.7 !important;
          margin: 0 6px !important;
          transition: all 0.3s ease !important;
        }
        
        .hero-pagination .swiper-pagination-bullet-active {
          background: white !important;
          opacity: 1 !important;
          transform: scale(1.3) !important;
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;
