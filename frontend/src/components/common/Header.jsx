// src/components/common/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../../context/MenuContext';
import Logo from '../../assets/icons/Logo.png';
import MenuIcon from '../../assets/icons/menu.png';

export default function Header() {
  const navigate = useNavigate();
  const { toggleMenu } = useMenu();

  return (
    <header className="absolute top-0 left-0 w-full z-50">
      <div className="relative flex items-center justify-center h-16">
       
        <div
          className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img src={Logo} alt="Align Logo" className="h-20 w-auto" />
        </div>

        
        <div className="absolute right-6 flex items-center space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 border border-white rounded-md cursor-pointer text-sm uppercase text-white transition"
          >
            Log In
          </button>

          <div
            className="h-10 w-10 border border-white flex items-center justify-center rounded cursor-pointer"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <img src={MenuIcon} alt="menu-icon" className="h-6 w-6" />
          </div>
        </div>
      </div>
    </header>
  );
}
