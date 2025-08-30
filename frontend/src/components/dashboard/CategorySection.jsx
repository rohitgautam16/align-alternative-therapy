// src/components/dashboard/CategorySection.jsx
import React, { useRef, useEffect } from 'react';
import Slider from 'react-slick';
import { useGetCategoriesQuery } from '../../utils/api';
import { useSidebar } from '../../context/SidebarContext';
import CategoryBanner from '../custom-ui/CategoryBanner';

export default function CategorySection() {
  const { data: categories = [], isLoading, isError } = useGetCategoriesQuery();
  const { collapsed } = useSidebar();
  const sliderRef = useRef(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider && slider.innerSlider && typeof slider.innerSlider.onWindowResized === 'function') {
      slider.innerSlider.onWindowResized();
    }
  }, [collapsed]);

  if (isLoading) return <p className="text-center py-8">Loading categories…</p>;
  if (isError)   return <p className="text-center py-8">Error loading categories.</p>;

  const settings = {
    slidesToShow: 2,
    slidesToScroll: 1,
    infinite: true,
    arrows: false,
    dots: true,
    autoplay: true,
    autoplaySpeed: 5000,
    adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 1024, 
        settings: {
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <section className="space-y-4 p-6">
      <Slider
        ref={sliderRef}
        {...settings}
        className="-mx-6"
      >
        {categories.map((cat) => (
          <div key={cat.id} className="px-6">
            <CategoryBanner category={cat} />
          </div>
        ))}
      </Slider>
    </section>
  );
}
