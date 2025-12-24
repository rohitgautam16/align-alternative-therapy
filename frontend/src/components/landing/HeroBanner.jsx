import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';

const HeroBanner = () => {
    const heroRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const scrollRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        // Fallback: Make elements visible immediately if GSAP fails
        const makeVisible = () => {
            if (titleRef.current) {
                titleRef.current.style.opacity = '1';
                titleRef.current.style.transform = 'translateY(0)';
            }
            if (subtitleRef.current) {
                subtitleRef.current.style.opacity = '1';
                subtitleRef.current.style.transform = 'translateY(0)';
            }
            if (scrollRef.current) {
                scrollRef.current.style.opacity = '1';
                scrollRef.current.style.transform = 'translateY(0)';
            }
        };

        // Check if GSAP is available
        if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline({ delay: 0.5 });

            tl.to(titleRef.current, {
                duration: 1.2,
                opacity: 1,
                y: 0,
                ease: 'power3.out'
            })
            .to(subtitleRef.current, {
                duration: 1,
                opacity: 1,
                y: 0,
                ease: 'power3.out'
            }, '-=0.8')
            .to(scrollRef.current, {
                duration: 1,
                opacity: 1,
                y: 0,
                ease: 'power3.out'
            }, '-=0.4');
        } else {
            setTimeout(makeVisible, 100);
        }
    }, []);

    useEffect(() => {
        // Image scale effect on scroll
        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            const heroHeight = heroRef.current?.offsetHeight || window.innerHeight;
            const scrollProgress = Math.min(scrolled / heroHeight, 1);
            
            if (imageRef.current) {
                const scale = 1 + (scrollProgress * 0.5);
                gsap.to(imageRef.current, {
                    duration: 0.3,
                    scale: scale,
                    ease: 'ease-in'
                });
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleScrollClick = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    };

    return (
        <div 
            ref={heroRef}
            className="relative min-h-screen lg:h-screen md:h-45 sm:h-4/5 w-full overflow-hidden"
        >
            {/* Background Image with Scale Effect */}
            <div 
                ref={imageRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: 'scale(1)'
                }}
            />

            {/* Dark Overlay */}
            <div 
                className="absolute inset-0 z-10"
                style={{
                    background: `linear-gradient(
                        135deg,
                        rgba(0, 0, 0, 0.4) 0%,
                        rgba(0, 0, 0, 0.2) 50%,
                        rgba(0, 0, 0, 0.3) 100%
                    )`
                }}
            />

            {/* Additional Overlay */}
            <div 
                className="absolute inset-0 z-10"
                style={{
                    background: `linear-gradient(
                        135deg,
                        rgba(16, 16, 32, 0.3) 0%,
                        rgba(32, 16, 64, 0.2) 50%,
                        rgba(16, 32, 48, 0.3) 100%
                    )`
                }}
            />
            
            {/* Desktop Layout */}
            <div className="hidden lg:flex absolute inset-0 z-20 items-end justify-between px-16 py-12">
                {/* Professional Hero Content - Bottom Left */}
                <div className="max-w-4xl">
                    {/* Brand Name */}
                    <div 
                        ref={titleRef}
                        className="mb-3"
                        style={{
                            opacity: 1,
                            transform: 'translateY(0)'
                        }}
                    >
                        <span className="text-white/80 font-light tracking-[8px] text-sm uppercase block mb-2">
                            ALIGN
                        </span>
                        <div className="w-20 h-px bg-gradient-to-r from-white/60 to-transparent mb-6"></div>
                    </div>

                    {/* Main Title */}
                    <h1 
                        ref={subtitleRef}
                        className="font-light text-white leading-[0.9] tracking-wide"
                        style={{
                            fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
                            opacity: 1,
                            transform: 'translateY(0)',
                        }}
                    >
                        ALTERNATIVE {' '}
                        <span className="font-extralight text-white/90">
                            THERAPY
                        </span>
                    </h1>

                    {/* Subtle Tagline */}
                    <div className="mt-6 flex items-center">
                        <div className="w-8 h-px bg-white/40 mr-4"></div>
                        <span className="text-white/60 text-xs font-light tracking-[2px] uppercase">
                            Healing Through Sound
                        </span>
                    </div>
                </div>

                {/* Custom SVG Scroll Arrow - Bottom Right */}
                <motion.div 
                    ref={scrollRef}
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={handleScrollClick}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ 
                        opacity: 1,
                        transform: 'translateY(0)'
                    }}
                >
                    {/* Scroll Text */}
                    <span className="text-white/60 font-light text-xs tracking-[3px] uppercase mb-6 rotate-90 origin-center transition-colors duration-300 group-hover:text-white/90">
                        Scroll
                    </span>

                    {/* Your Custom SVG Arrow */}
                    <motion.div
                        className="relative"
                        animate={{ 
                            y: [0, 10, 0]
                        }}
                        transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        {/* Glowing Background Circle */}
                        <motion.div
                            className="absolute inset-0 w-20 h-20 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full border border-white/20"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />

                        {/* Your SVG */}
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            version="1.1" 
                            width="48" 
                            height="48" 
                            viewBox="0 0 96 96"
                            className="drop-shadow-lg group-hover:drop-shadow-lg transition-all duration-300"
                        >
                            <g transform="translate(36, 59.99454545454546)">
                                <path 
                                    d="M22.7-4.13L22.7-4.13Q23.18-4.13 23.18-3.22L23.18-3.22Q23.18-3.02 23.18-2.9 23.18-2.78 23.16-2.69 23.14-2.59 23.09-2.52 23.04-2.45 23.04-2.4 23.04-2.35 22.92-2.3 22.8-2.26 22.75-2.26 22.7-2.26 22.54-2.21 22.37-2.16 22.27-2.11L22.27-2.11Q18.67-1.2 16.08 1.56 13.49 4.32 12.67 8.06L12.67 8.06Q12.67 8.16 12.62 8.33 12.58 8.5 12.55 8.64 12.53 8.78 12.53 8.83L12.53 8.83Q12.38 9.55 11.76 9.22L11.76 9.22Q11.47 9.17 11.42 8.54L11.42 8.54Q10.8 4.66 8.11 1.75 5.42-1.15 1.73-2.11L1.73-2.11Q1.63-2.16 1.46-2.21 1.3-2.26 1.25-2.26 1.2-2.26 1.08-2.3 0.96-2.35 0.96-2.4 0.96-2.45 0.91-2.52 0.86-2.59 0.84-2.69 0.82-2.78 0.82-2.9 0.82-3.02 0.82-3.22L0.82-3.22Q0.82-4.18 1.3-4.18L1.3-4.18Q1.58-4.18 2.02-4.03L2.02-4.03Q7.58-2.5 10.7 2.16L10.7 2.16 11.04 2.64 11.04-14.98Q11.04-32.59 11.14-32.78L11.14-32.78Q11.42-33.31 12.05-33.31L12.05-33.31Q12.62-33.26 12.96-32.59L12.96-32.59 12.96 2.64 13.3 2.16Q15.5-1.2 19.3-3.02L19.3-3.02Q21.6-4.13 22.7-4.13Z" 
                                    fill="#ffffff"
                                    className="group-hover:fill-white/90 transition-colors duration-300"
                                />
                            </g>
                        </svg>

                        {/* Hover Effect Glow */}
                        <div className="absolute inset-0 w-24 h-24 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md" />
                    </motion.div>
                </motion.div>
            </div>

            {/* Mobile/Tablet Layout - Centered Text */}
            <div className="flex lg:hidden absolute inset-0 z-20 items-center justify-center p-8">
                {/* Professional Hero Content - Centered */}
                <div className="text-center">
                    {/* Brand Name and Main Title - Same Line */}
                    <h1 
                        className="font-light text-white leading-tight tracking-wide text-center"
                        style={{
                            fontSize: 'clamp(1.8rem, 7vw, 3rem)',
                            opacity: 1,
                            transform: 'translateY(0)',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                    >
                        <span className="font-light tracking-[4px] text-white/90">
                            ALIGN ALTERNATIVE
                        </span>
                        <br />
                        <span className="font-extralight text-white/90 mt-2 block">
                            THERAPY
                        </span>
                    </h1>

                    {/* Centered Tagline */}
                    <div className="mt-6 flex items-center justify-center">
                        <div className="w-6 h-px bg-white/40 mr-3"></div>
                        <span className="text-white/60 text-xs font-light tracking-[2px] uppercase">
                            Healing Through Sound
                        </span>
                        <div className="w-6 h-px bg-white/40 ml-3"></div>
                    </div>
                </div>

                {/* Custom SVG Scroll Arrow - Bottom Center */}
                <motion.div 
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer group"
                    onClick={handleScrollClick}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {/* Scroll Text */}
                    <span className="text-white/60 font-light text-xs tracking-[2px] uppercase mb-4 transition-colors duration-300 group-hover:text-white/90">
                        Scroll
                    </span>

                    {/* Your Custom SVG Arrow */}
                    <motion.div
                        className="relative"
                        animate={{ 
                            y: [0, 8, 0]
                        }}
                        transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            version="1.1" 
                            width="40" 
                            height="40" 
                            viewBox="0 0 96 96"
                            className="drop-shadow-xs"
                        >
                            <g transform="translate(36, 59.99454545454546)">
                                <path 
                                    d="M22.7-4.13L22.7-4.13Q23.18-4.13 23.18-3.22L23.18-3.22Q23.18-3.02 23.18-2.9 23.18-2.78 23.16-2.69 23.14-2.59 23.09-2.52 23.04-2.45 23.04-2.4 23.04-2.35 22.92-2.3 22.8-2.26 22.75-2.26 22.7-2.26 22.54-2.21 22.37-2.16 22.27-2.11L22.27-2.11Q18.67-1.2 16.08 1.56 13.49 4.32 12.67 8.06L12.67 8.06Q12.67 8.16 12.62 8.33 12.58 8.5 12.55 8.64 12.53 8.78 12.53 8.83L12.53 8.83Q12.38 9.55 11.76 9.22L11.76 9.22Q11.47 9.17 11.42 8.54L11.42 8.54Q10.8 4.66 8.11 1.75 5.42-1.15 1.73-2.11L1.73-2.11Q1.63-2.16 1.46-2.21 1.3-2.26 1.25-2.26 1.2-2.26 1.08-2.3 0.96-2.35 0.96-2.4 0.96-2.45 0.91-2.52 0.86-2.59 0.84-2.69 0.82-2.78 0.82-2.9 0.82-3.02 0.82-3.22L0.82-3.22Q0.82-4.18 1.3-4.18L1.3-4.18Q1.58-4.18 2.02-4.03L2.02-4.03Q7.58-2.5 10.7 2.16L10.7 2.16 11.04 2.64 11.04-14.98Q11.04-32.59 11.14-32.78L11.14-32.78Q11.42-33.31 12.05-33.31L12.05-33.31Q12.62-33.26 12.96-32.59L12.96-32.59 12.96 2.64 13.3 2.16Q15.5-1.2 19.3-3.02L19.3-3.02Q21.6-4.13 22.7-4.13Z" 
                                    fill="#ffffff"
                                />
                            </g>
                        </svg>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroBanner;
