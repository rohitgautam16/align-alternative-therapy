// src/components/common/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../../context/MenuContext';
import Logo from '../../assets/images/logo-with-text-removebg-preview.png';
import { usePWAInstallPrompt } from '../../hooks/usePWAInstallPrompt';
import { Download } from 'lucide-react'; 

export default function Header() {
  const navigate = useNavigate();
  const { toggleMenu } = useMenu();
  const { canInstall, install, installed } = usePWAInstallPrompt();

  return (
    <header className="absolute top-0 pt-2 left-0 w-full z-80">
      <div className="relative flex items-center justify-center h-16">

        {/* LOGO */}
        <div
          className="absolute left-6 top-1 transform text-white cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img src={Logo} alt="Align Logo" className="h-18 sm:h-20 w-auto" />
        </div>

        {/* RIGHT ACTION BUTTONS */}
        <div className="absolute right-6 flex items-center space-x-4">


          {canInstall && !installed && (
            <button
              onClick={install}
              className="flex items-center gap-1 px-3 py-2 md:px-4 bg-transparent border-white border text-white rounded-full text-xs md:text-sm uppercase transition hover:bg-white hover:text-black cursor-pointer"
            >
              <Download size={16} />
              <span className="hidden md:inline">Install</span>
            </button>
          )}

          {/* LOGIN */}
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 md:px-6 cursor-pointer bg-white rounded-full text-xs md:text-sm uppercase text-black transition"
          >
            Log In
          </button>

        </div>
      </div>
    </header>
  );
}
