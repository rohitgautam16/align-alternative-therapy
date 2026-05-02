// src/components/dashboard/CategorySection.jsx
import React, { useRef, useEffect, useState } from 'react';
import Slider from 'react-slick';
import { useGetCategoriesQuery } from '../../utils/api';
import { useSidebar } from '../../context/SidebarContext';
import CategoryBanner from '../custom-ui/CategoryBanner';

function SkeletonBanner() {
  return (
    <div className="relative w-full h-16 sm:h-40 md:h-54 rounded-lg overflow-hidden 
                    bg-black ring-1 ring-white/10 animate-pulse">
      <div className="absolute inset-0 bg-white/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="relative z-10 flex items-end justify-between h-full p-4">
        <div className="space-y-2 max-w-[70%]">
          <div className="h-4 sm:h-6 md:h-7 w-24 sm:w-40 md:w-48 bg-white/20 rounded" />
        </div>
        <div className="h-6 sm:h-8 w-20 sm:w-28 bg-white/20 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

export default function CategorySection() {
  const { data: categories = [], isLoading, isError } = useGetCategoriesQuery();
  const { collapsed } = useSidebar();
  const sliderRef = useRef(null);

  const [slidesVisible, setSlidesVisible] = useState(() => {
    if (typeof window === 'undefined') return 2;
    return window.innerWidth <= 1024 ? 1 : 2;
  });

  useEffect(() => {
    const mql = typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 1024px)')
      : null;

    const apply = () => setSlidesVisible(mql && mql.matches ? 1 : 2);

    if (mql) {

      apply();

      if (mql.addEventListener) {
        mql.addEventListener('change', apply);
      } else {

        mql.addListener(apply);
      }
      return () => {
        if (mql.removeEventListener) mql.removeEventListener('change', apply);
        else mql.removeListener(apply);
      };
    }
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider && slider.innerSlider && typeof slider.innerSlider.onWindowResized === 'function') {
      slider.innerSlider.onWindowResized();
    }
  }, [collapsed]);

  if (isLoading) {

    const skeletons = Array.from({ length: slidesVisible });
    return (
      <section className="space-y-4 p-4">
        {/* Dots placeholder */}
        <div className="flex justify-center gap-2 mb-2">
          <span className="h-2 w-2 rounded-full bg-white/15 animate-pulse" />
          <span className="h-2 w-2 rounded-full bg-white/10 animate-pulse" />
          <span className="h-2 w-2 rounded-full bg-white/5 animate-pulse" />
        </div>
        {/* Skeleton slides: mirror react-slick spacing using the same container paddings */}
        <div className="-mx-6">
          <div
            className={`grid gap-6 px-6`}
            style={{
              gridTemplateColumns: `repeat(${slidesVisible}, minmax(0, 1fr))`,
            }}
          >
            {skeletons.map((_, i) => (
              <SkeletonBanner key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) return <p className="text-center py-8">Error loading categories.</p>;

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
      { breakpoint: 1024, settings: { slidesToShow: 1 } },
      { breakpoint: 640,  settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <section className="space-y-4 px-2 pt-4 pb-1 md:px-6 md:py-6">
      <Slider
        ref={sliderRef}
        {...settings}
        className="-mx-6"
      >
        {categories.map((cat, index) => (
          <div key={cat.id} className="px-6">
            <CategoryBanner category={cat} priority={index === 0} />
          </div>
        ))}
      </Slider>
    </section>
  );
}
