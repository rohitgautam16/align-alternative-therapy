// src/components/dashboard/CategorySection.jsx
import React, { useRef, useEffect, useState } from 'react';
import Slider from 'react-slick';
import { useGetCategoriesQuery } from '../../utils/api';
import { useSidebar } from '../../context/SidebarContext';
import CategoryBanner from '../custom-ui/CategoryBanner';

function SkeletonBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10 animate-pulse">
      {/* image/banner area */}
      <div className="h-48 sm:h-56 md:h-64 bg-white/10" />
      {/* content overlay skeleton */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 md:p-6">
        <div className="h-4 w-40 sm:w-48 md:w-56 rounded bg-white/20 mb-2" />
        <div className="h-3 w-28 sm:w-32 md:w-36 rounded bg-white/15" />
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
      <section className="space-y-4 p-6">
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
