// components/ui/animated-testimonials.tsx
"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"; // Importing from react-icons

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = false,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);
  const handleNext = () => setActive((p) => (p + 1) % testimonials.length);
  const handlePrev = () =>
    setActive((p) => (p - 1 + testimonials.length) % testimonials.length);
  const isActive = (i: number) => i === active;

  useEffect(() => {
    if (autoplay) {
      const iv = setInterval(handleNext, 5000);
      return () => clearInterval(iv);
    }
  }, [autoplay]);

  const randomRotateY = () => Math.floor(Math.random() * 21) - 10;

  return (
    <div className="w-full bg-black h-3/5 justify-center items-center py-30">
      <div className="mx-auto max-w-md px-4 py-20 antialiased md:max-w-5xl md:px-8 lg:px-12">
        <div className="relative grid grid-cols-1 gap-40 md:grid-cols-2">
          <div>
            <div className="relative h-80 w-full">
              <AnimatePresence>
                {testimonials.map((t, i) => (
                  <motion.div
                    key={t.src}
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                      z: -100,
                      rotate: randomRotateY(),
                    }}
                    animate={{
                      opacity: isActive(i) ? 1 : 0.7,
                      scale: isActive(i) ? 1 : 0.95,
                      z: isActive(i) ? 0 : -100,
                      rotate: isActive(i) ? 0 : randomRotateY(),
                      zIndex: isActive(i) ? 40 : testimonials.length + 2 - i,
                      y: isActive(i) ? [0, -80, 0] : 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      z: 100,
                      rotate: randomRotateY(),
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-0 origin-bottom"
                  >
                    <img
                      src={t.src}
                      alt={t.name}
                      className="h-full w-full rounded-3xl object-cover object-center"
                      draggable={false}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col justify-between py-4">
            <motion.div
              key={active}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <h3 className="text-2xl font-bold text-black dark:text-white">
                {testimonials[active].name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-500">
                {testimonials[active].designation}
              </p>
              <motion.p className="mt-8 text-lg text-gray-500 dark:text-neutral-300">
                {testimonials[active].quote.split(" ").map((word, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ filter: "blur(10px)", opacity: 0, y: 5 }}
                    animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: "easeInOut",
                      delay: 0.02 * idx,
                    }}
                    className="inline-block"
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
            <div className="flex gap-6 pt-2 md:pt-0">
              <button
                onClick={handlePrev}
                className="group/button flex h-15 w-15 items-center justify-center rounded-full border border-white bg-transparent"
              >
                {/* Changed from IconArrowLeft to FaArrowLeft */}
                <FaArrowLeft className="h-5 w-5 text-black transition-transform duration-300 group-hover/button:rotate-12 dark:text-white" />
              </button>
              <button
                onClick={handleNext}
                className="group/button flex h-15 w-15 items-center justify-center rounded-full border border-white bg-transparent"
              >
                {/* Changed from IconArrowRight to FaArrowRight */}
                <FaArrowRight className="h-5 w-5 text-black transition-transform duration-300 group-hover/button:-rotate-12 dark:text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};