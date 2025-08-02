// src/components/common/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../../context/MenuContext';
import Logo from '../../assets/images/logo-with-text-removebg-preview.png';

export default function Header() {
  const navigate = useNavigate();
  const { toggleMenu } = useMenu();

  return (
    <header className="absolute top-0 pt-2 left-0 w-full z-80">
      <div className="relative flex items-center justify-center h-16">
       
        <div
          className="absolute left-6 top-1 transform text-white cursor-pointer"
          onClick={() => navigate('/')}
        > 
          <img src={Logo} alt="Align Logo" className="h-25 w-auto" />
        </div>

        <div className="absolute right-6 flex items-center space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 cursor-pointer text-sm uppercase text-white transition hover:opacity-80"
          >
            Log In
          </button>

          <div
            className="h-10 w-10 flex flex-col items-center justify-center cursor-pointer space-y-1 group"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="block w-6 h-[1px] bg-white transition-all duration-300 group-hover:opacity-80"></span>
            <span className="block w-6 h-[1px] bg-white transition-all duration-300 group-hover:opacity-80"></span>
            <span className="block w-6 h-[1px] bg-white transition-all duration-300 group-hover:opacity-80"></span>
          </div>
        </div>
      </div>
    </header>
  );
}
