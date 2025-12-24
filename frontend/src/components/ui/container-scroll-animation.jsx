"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "motion/react";

export const ContainerScroll = ({
  titleComponent,
  children
}) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);


  return (
    <div
      className="relative h-[60rem] md:h-[70rem] flex items-center justify-center p-2 md:p-5"
      ref={containerRef}
      style={{ backgroundColor: "#000000" }}  
    >
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          filter: "brightness(0.3) blur(2px)"
        }}
        aria-hidden="true"
      />
      <div
        className="w-full relative max-w-7xl"
        style={{
          perspective: "1000px",
          zIndex: 10,
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent
}) => {
  return (
    <motion.div
      style={{ translateY: translate }}
      className="w-full justify-center items-center mx-auto pb-5 md:pb-20"
    >
    <h3 className=" text-white text-center text-wrap text-3xl md:text-4xl lg:text-6xl">
       Welcome to Align <br></br>Alternative Therapy
    </h3>
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-5xl -mt-12 mx-auto h-[40rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] bg-black rounded-[30px] shadow-2xl relative overflow-hidden"
    >
      {/* Background image inside card */}
      <img
        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover rounded-[26px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black opacity-60 rounded-[26px]" />

      {/* Content container */}
      <div className="relative h-full w-full overflow-hidden rounded-2xl p-6 text-white">
        {children}
      </div>
    </motion.div>
  );
};
