import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Logo from '../../assets/icons/Logo.png';
import GlobeIcon from '../../assets/icons/Globe-icon.svg';
import MenuIcon from '../../assets/icons/menu.png';
import FullScreenMenu from '../common/FullScreenMenu/FullScreenMenu'; 
import heroWomen from '../../assets/images/woman-8798473.jpg';

const HeroSection = () => {


  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Hero Section */}
      <div
        className="relative w-full h-screen bg-cover bg-center text-white"
        style={{
          backgroundImage: `url(${heroWomen})`,
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/15"></div>

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <h1 className="text-[12rem] font-bold uppercase leading-none tracking-wide">
            ALIGN
          </h1>
          <div className="absolute right-10 flex items-center">
            <p className="text-xl tracking-widest transform rotate-90">
              ® Alternative Therapy
            </p>
          </div>
        </div>

        {/* Bottom Left Section */}
        <div className="absolute bottom-16 left-8 flex gap-4">
          <div className="flex items-center gap-4">
            <img src={GlobeIcon} alt="Globe Icon" className="h-12 w-auto" />
            <span className="font-bold text-lg"></span>
          </div>
          <div className="flex flex-col border rounded-full py-2 px-4 items-start">
            <div className="text-xs font-bold tracking-widest">MUSICIAN</div>
            <div className="text-xs tracking-wider opacity-80">
              Do not access if you're afraid of change
            </div>
          </div>
        </div>

        {/* Bottom Right Section */}
        <div className="absolute bottom-16 right-8">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-white rounded-full text-xs uppercase">
              Want to Invest | Heal Yourself
            </button>
            <div className="h-12 w-12 border rounded-full flex items-center justify-center">
              ▶
            </div>
          </div>
        </div>

        
      </div>

      {/* Bottom Icons Section */}
      <div className="flex flex-col items-center h-full justify-between py-36 bg-[#000000]">
        <div className="flex items-center justify-center gap-16">
          <div className="animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="w-20 h-20 fill-gray-400"
            >
              <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" />
            </svg>
          </div>
          <p className="text-2xl font-medium text-white text-center max-w-4xl">
            Our approach blends different audio therapies like affirmations, binaural beats 
            and solfeggio frequencies. Each audio experience is thoughtfully curated to provide 
            you with a significant advantage, aiding in aligning your mind, body and spirit for 
            optimal harmony and growth
          </p>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="w-20 h-20 text-gray-600 animate-spin"
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="gray"
                strokeWidth="2"
                fill="none"
              />
              <polygon points="50,10 60,40 40,40" fill="gray" />
            </svg>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-lg">
              <p className="text-gray-400 uppercase tracking-widest rotate-[20deg]">
                Channel Peace
              </p>
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-bold bebas-neue-regular tracking-wide text-white text-center uppercase mt-8">
          We tap into the transformative power of sound to enrich your well-being
        </h2>
      </div>


    </div>
  );
};

export default HeroSection;