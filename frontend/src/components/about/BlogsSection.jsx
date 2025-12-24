import React, { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import stubBlogs from '../../stubs/blogs';

const BlogHero = () => {
  const scope = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState(null);

  /* Initial reveal animations */
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-title', { y: 80, opacity: 0, duration: 1 });
    tl.from('.hero-meta>*', { y: 40, opacity: 0, stagger: 0.15 }, '-=0.6');
    tl.from('.swiper-container', { y: 60, opacity: 0, duration: 0.8 }, '-=0.4');
  }, { scope });

  // Custom Arrow Component with CORRECTED left/right orientation
  const ArrowIcon = ({ direction, disabled, size = "20" }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      version="1.1" 
      width={size} 
      height={size} 
      viewBox="0 0 96 96"
      className={`drop-shadow-lg transition-all duration-300 ${
        direction === 'left' ? 'rotate-90' : direction === 'right' ? '-rotate-90' : ''
        }`}
      style={{
        filter: disabled ? 'brightness(0.5)' : 'brightness(1)',
      }}
    >
      <g transform="translate(36, 59.99454545454546)">
        <path 
          d="M22.7-4.13L22.7-4.13Q23.18-4.13 23.18-3.22L23.18-3.22Q23.18-3.02 23.18-2.9 23.18-2.78 23.16-2.69 23.14-2.59 23.09-2.52 23.04-2.45 23.04-2.4 23.04-2.35 22.92-2.3 22.8-2.26 22.75-2.26 22.7-2.26 22.54-2.21 22.37-2.16 22.27-2.11L22.27-2.11Q18.67-1.2 16.08 1.56 13.49 4.32 12.67 8.06L12.67 8.06Q12.67 8.16 12.62 8.33 12.58 8.5 12.55 8.64 12.53 8.78 12.53 8.83L12.53 8.83Q12.38 9.55 11.76 9.22L11.76 9.22Q11.47 9.17 11.42 8.54L11.42 8.54Q10.8 4.66 8.11 1.75 5.42-1.15 1.73-2.11L1.73-2.11Q1.63-2.16 1.46-2.21 1.3-2.26 1.25-2.26 1.2-2.26 1.08-2.3 0.96-2.35 0.96-2.4 0.96-2.45 0.91-2.52 0.86-2.59 0.84-2.69 0.82-2.78 0.82-2.9 0.82-3.02 0.82-3.22L0.82-3.22Q0.82-4.18 1.3-4.18L1.3-4.18Q1.58-4.18 2.02-4.03L2.02-4.03Q7.58-2.5 10.7 2.16L10.7 2.16 11.04 2.64 11.04-14.98Q11.04-32.59 11.14-32.78L11.14-32.78Q11.42-33.31 12.05-33.31L12.05-33.31Q12.62-33.26 12.96-32.59L12.96-32.59 12.96 2.64 13.3 2.16Q15.5-1.2 19.3-3.02L19.3-3.02Q21.6-4.13 22.7-4.13Z" 
          fill={disabled ? "#4B5563" : "#ffffff"}
          className={`transition-colors duration-300 ${
            !disabled ? 'group-hover:fill-gray-200' : ''
          }`}
        />
      </g>
    </svg>
  );

  // Navigation handlers for card arrows
  const handleCardPrev = () => {
    if (swiperInstance && !isBeginning) {
      swiperInstance.slidePrev();
    }
  };

  const handleCardNext = () => {
    if (swiperInstance && !isEnd) {
      swiperInstance.slideNext();
    }
  };

  return (
    <section ref={scope} className="h-fit w-full bg-black font-sans px-5 py-10">
      <div className="px-3 sm:px-6 lg:px-12 xl:px-16 py-4 sm:py-6 lg:py-8">
        
        {/* Row-1: Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
          {/* Big heading */}
          <div className="col-span-1 lg:col-span-4">
            <h1 className="hero-title text-2xl sm:text-3xl md:text-4xl lg:text-[3.5rem] xl:text-[4rem] font-medium leading-[1.2] text-white">
              Explore the Science<br />
              <span className="bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent">
                of Sound
              </span>
            </h1>
          </div>

          {/* ARTICLES label / copy / arrows */}
          <div className="hero-meta col-span-1 lg:col-start-8 lg:col-span-5 flex flex-col justify-center space-y-3 sm:space-y-4 lg:space-y-6">
            <div>
              <span className="inline-block text-xs font-medium tracking-[0.2em] sm:tracking-[0.25em] uppercase text-gray-400 mb-2 sm:mb-3 relative">
                ARTICLES
                <div className="absolute -bottom-1 left-0 w-6 sm:w-8 h-0.5 bg-gradient-to-r from-white to-gray-500"></div>
              </span>
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-md">
                Unpacking the research behind therapeutic sound experiences.
              </p>
            </div>

            {/* Custom navigation arrows with FIXED orientations */}
            <div className="flex space-x-3 sm:space-x-4">
              <button
                ref={prevRef}
                className={`group w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 relative overflow-hidden rounded-full border flex items-center justify-center transition-all duration-500 ${
                  isBeginning 
                    ? 'border-gray-800 cursor-not-allowed opacity-50' 
                    : 'border-gray-700 hover:border-white cursor-pointer hover:bg-white/5'
                }`}
                disabled={isBeginning}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-white/10 to-gray-200/10 opacity-0 transition-opacity duration-500 ${
                  !isBeginning ? 'group-hover:opacity-100' : ''
                }`}></div>
                <div className="relative z-10">
                  <ArrowIcon direction="left" disabled={isBeginning} size="36" />
                </div>
              </button>
              
              <button
                ref={nextRef}
                className={`group w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 relative overflow-hidden rounded-full border flex items-center justify-center transition-all duration-500 ${
                  isEnd 
                    ? 'border-gray-800 cursor-not-allowed opacity-50' 
                    : 'border-gray-700 hover:border-white cursor-pointer hover:bg-white/5'
                }`}
                disabled={isEnd}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-white/10 to-gray-200/10 opacity-0 transition-opacity duration-500 ${
                  !isEnd ? 'group-hover:opacity-100' : ''
                }`}></div>
                <div className="relative z-10">
                  <ArrowIcon direction="right" disabled={isEnd} size="36" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Row-2: Swiper Carousel with FIXED content cropping */}
        <div className="swiper-container">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={15}
            slidesPerView={1}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            onSwiper={(swiper) => {
              setSwiperInstance(swiper);
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onInit={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              el: '.custom-pagination',
              bulletClass: 'custom-bullet',
              bulletActiveClass: 'custom-bullet-active',
            }}
            className="w-full"
          >
            {stubBlogs.map((article, index) => (
              <SwiperSlide key={article.slug || index}>
                {/* Card container with better height management */}
                <article
                  className="relative bg-white/80 backdrop-blur-3xl border border-gray-700/50 overflow-hidden shadow-2xl rounded-xl sm:rounded-2xl h-[320px] sm:h-[360px] lg:h-[400px]"
                >
                  <div className="relative z-10 flex flex-col sm:flex-row h-full">
                    {/* Image Section */}
                    <div className="sm:w-1/2 w-full h-48 sm:h-full overflow-hidden relative group">
                      <motion.img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover cursor-pointer"
                        whileHover={{ 
                          scale: 1.2,
                          transition: { 
                            duration: 0.6, 
                            ease: [0.25, 0.46, 0.45, 0.94] 
                          }
                        }}
                        initial={{ scale: 1 }}
                      />
                    </div>

                    {/* Content Section with FIXED cropping issues */}
                    <div className="sm:w-1/2 w-full h-[172px] sm:h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden">
                      {/* Card Navigation Arrows - Better positioned */}
                      {/* <div className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 flex space-x-1.5 z-20">
                        <button
                          onClick={handleCardPrev}
                          className={`group w-7 h-7 sm:w-8 sm:h-8 relative overflow-hidden rounded-full border flex items-center justify-center transition-all duration-300 ${
                            isBeginning 
                              ? 'border-gray-700 opacity-40 cursor-not-allowed' 
                              : 'border-gray-600 hover:border-white cursor-pointer hover:bg-white/10'
                          }`}
                          disabled={isBeginning}
                        >
                          <ArrowIcon direction="left" disabled={isBeginning} size="10" />
                        </button>
                        
                        <button
                          onClick={handleCardNext}
                          className={`group w-7 h-7 sm:w-8 sm:h-8 relative overflow-hidden rounded-full border flex items-center justify-center transition-all duration-300 ${
                            isEnd 
                              ? 'border-gray-700 opacity-40 cursor-not-allowed' 
                              : 'border-gray-600 hover:border-white cursor-pointer hover:bg-white/10'
                          }`}
                          disabled={isEnd}
                        >
                          <ArrowIcon direction="right" disabled={isEnd} size="10" />
                        </button>
                      </div> */}

                      {/* Content with proper spacing to avoid cropping */}
                      <div className="flex-1 pr-12 sm:pr-16 lg:pr-20">
                        <div className="mb-2 sm:mb-3">
                          <span className="inline-block px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 rounded-full shadow-lg border border-gray-600/30">
                            {article.category?.toUpperCase() || 'Category'}
                          </span>
                        </div>

                        <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold leading-tight text-black mb-2 sm:mb-3 line-clamp-2">
                          {article.title}
                        </h2>
                        
                        <p className="text-gray-8
                        00 leading-relaxed text-xs sm:text-sm lg:text-base line-clamp-2 sm:line-clamp-3">
                          {article.excerpt}
                        </p>
                      </div>

                      {/* CTA Button with proper spacing */}
                      <div className="mt-2 sm:mt-3 lg:mt-4">
                        <Link
                          to={`/blog/${article.slug}`}
                          className="group inline-flex items-center space-x-2 text-xs sm:text-sm font-medium uppercase text-black hover:text-gray-600 transition-all duration-300"
                        >
                          <span className="tracking-wider relative text-black">
                            READ ARTICLE
                            <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-black to-gray-400 group-hover:w-full transition-all duration-500"></div>
                          </span>
                          {/* <div className="relative w-10 h-10 sm:w-6 sm:h-6 rounded-full border border-gray-800 flex items-center justify-center group-hover:border-black transition-all duration-300 overflow-hidden">
                            <div className="absolute inset-0 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></div>
                            <div className="relative z-10 group-hover:text-black transition-colors duration-300">
                              <ArrowIcon direction="right" disabled={false} color='black' size="20" />
                            </div>
                          </div> */}
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom pagination dots */}
          <div className="custom-pagination flex justify-center items-center space-x-3 sm:space-x-4 mt-6 sm:mt-8"></div>
        </div>
      </div>
    </section>
  );
};

export default BlogHero;
