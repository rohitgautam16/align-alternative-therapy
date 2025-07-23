import React, { useState } from 'react';
import Slider from 'react-slick';
import { useNavigate } from 'react-router-dom';
import { useGetCategoriesQuery } from '../../utils/api';

export default function CategoryCarousel() {
  const { data: categories = [], isLoading, isError } = useGetCategoriesQuery();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  if (isLoading) return <p className="text-center text-white py-8">Loading categories…</p>;
  if (isError) return <p className="text-center text-red-400 py-8">Error loading categories.</p>;

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    swipeToSlide: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    centerMode: true,
    centerPadding: '80px', // Increased padding for better arrow spacing
    variableWidth: true,
    beforeChange: (current, next) => setActiveIndex(next),
    responsive: [
      {
        breakpoint: 1024,
        settings: { 
          slidesToShow: 3,
          centerPadding: '60px'
        }
      },
      {
        breakpoint: 768,
        settings: { 
          slidesToShow: 2,
          centerPadding: '40px'
        }
      },
      {
        breakpoint: 480,
        settings: { 
          slidesToShow: 1,
          centerPadding: '20px'
        }
      }
    ]
  };

  const handleItemClick = (index, slug) => {
    setActiveIndex(index);
    navigate(`/dashboard/category/${slug}`);
  };

  return (
    <div className="bg-black text-white py-8 md:py-12 lg:py-16">
      <div className="px-4 md:px-10">
        <h2 className="text-center text-3xl font-bold uppercase mb-4 relative">
          EXPLORE
          {/* <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-red-600 rounded"></span> */}
        </h2>
        <p className="text-center max-w-2xl mx-auto mb-8 text-sm md:text-base">
          Dive into our collection and begin a journey of self-discovery and transformation
          through the therapeutic medium of sound.
        </p>

        <div className="game-section-carousel overflow-hidden">
          <Slider {...settings} className="custom-carousel">
            {categories.map((cat, index) => (
              <div
                key={cat.id}
                className="slide-item"
              >
                <div 
                  className={`expandable-item cursor-pointer relative overflow-hidden rounded-2xl transition-all duration-500 ease-in-out flex items-end ${
                    activeIndex === index ? 'active' : ''
                  }`}
                  style={{
                    backgroundImage: `url(${cat.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#343434'
                  }}
                  onClick={() => handleItemClick(index, cat.slug)}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                  
                  <div className="item-desc relative z-10 p-6 text-white transform transition-all duration-500 ease-in-out overflow-hidden">
                    <h3 className="text-xl md:text-2xl font-bold mb-2 text-white">
                      {cat.title}
                    </h3>
                    <p className="text-sm text-gray-200 opacity-0 transform translate-y-8 transition-all duration-500 ease-in-out delay-200 leading-relaxed">
                      Discover the healing power of sound through our carefully curated collection designed for transformation and self-discovery.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>

      <style jsx>{`
        .game-section-carousel {
          margin: 15px 0;
          padding: 0 40px; /* Added more padding around carousel */
        }

        .slide-item {
          padding: 0 12px !important; /* Reduced padding between slides */
          outline: none;
        }

        /* Reduced slide sizes for better fit */
        .expandable-item {
          width: 280px !important; /* Reduced from 320px */
          height: 380px; /* Slightly reduced height */
          margin: 0 auto 60px;
          transition: all 0.5s ease-in-out;
          position: relative;
          border-radius: 16px;
        }

        .expandable-item.active {
          width: 400px !important; /* Reduced from 500px */
          box-shadow: 12px 40px 40px rgba(0, 0, 0, 0.25);
        }

        .expandable-item::after {
          content: "";
          display: block;
          position: absolute;
          height: 100%;
          width: 100%;
          left: 0;
          top: 0;
          background-image: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
          border-radius: 16px;
        }

        .expandable-item .item-desc {
          transform: translateY(calc(100% - 54px));
          transition: all 0.5s ease-in-out;
        }

        .expandable-item.active .item-desc {
          transform: none;
        }

        .expandable-item.active .item-desc p {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        /* Fix slick carousel gaps and arrow spacing */
        .custom-carousel .slick-track {
          display: flex !important;
          align-items: center;
        }

        .custom-carousel .slick-slide {
          height: inherit !important;
          display: flex !important;
          justify-content: center;
        }

        /* Arrow positioning with proper spacing */
        .custom-carousel .slick-prev,
        .custom-carousel .slick-next {
          z-index: 10;
        }

        .custom-carousel .slick-prev {
          left: 10px;
        }

        .custom-carousel .slick-next {
          right: 10px;
        }

        /* Responsive styles with smaller sizes */
        @media (min-width: 992px) and (max-width: 1199px) {
          .expandable-item {
            width: 240px !important; /* Reduced from 260px */
            height: 340px;
          }
          .expandable-item.active {
            width: 350px !important; /* Reduced from 400px */
          }
          .expandable-item .item-desc {
            transform: translateY(calc(100% - 46px));
          }
          .expandable-item h3 {
            font-size: 20px;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .expandable-item {
            width: 220px !important; /* Reduced from 240px */
            height: 310px;
          }
          .expandable-item.active {
            width: 320px !important; /* Reduced from 360px */
          }
          .expandable-item .item-desc {
            transform: translateY(calc(100% - 42px));
          }
          .expandable-item h3 {
            font-size: 20px;
          }
        }

        @media (max-width: 767px) {
          .game-section-carousel {
            padding: 0 20px;
          }
          .slide-item {
            padding: 0 8px !important;
          }
          .expandable-item {
            width: 180px !important; /* Reduced from 200px */
            height: 260px;
            margin-bottom: 40px;
          }
          .expandable-item.active {
            width: 240px !important; /* Reduced from 270px */
            box-shadow: 6px 10px 10px rgba(0, 0, 0, 0.25);
          }
          .expandable-item .item-desc {
            padding: 0 12px 5px;
            transform: translateY(calc(100% - 42px));
          }
          .expandable-item h3 {
            font-size: 18px;
            line-height: 22px;
          }
        }
      `}</style>
    </div>
  );
}
