import React from 'react';
import { Menu, X } from 'lucide-react';
import logo from '../../../assets/icons/Logo.png';
import SideImg from '../../../assets/images/peace-8622077.jpg';

const FullScreenMenu = ({ isMenuOpen, setIsMenuOpen }) => {
  const categorizedMenuItems = {
    "About Align": ['About Us', 'Blogs', 'Contact Us'],
    "Explore": ['Mind', 'Aesthetic', 'Health & Healing', 'Fitness']
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-transform duration-500 ease-in-out ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!isMenuOpen}
    >
      <div className="h-screen flex">
        {/* Left Section - Image */}
        <div className="w-1/2 relative">
          <div className="absolute inset-0 bg-black/30 bg-opacity-20"></div>
          <img
            src={SideImg}
            alt="Interior"
            className="w-full h-full object-fill"
          />
          <div className="absolute top-0 left-0 w-full p-6">
            <img src={logo} alt="logo" className="w-20 h-20" />
          </div>
          <div className="absolute bottom-0 left-0 w-full p-6">
            <div className="text-4xl font-bold text-white">ALIGN</div>
          </div>
        </div>

        {/* Right Section - Menu */}
        <div className="w-1/2 bg-black/95 h-screen flex flex-col">
          {/* Menu Header */}
          <div className="h-20 px-12 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-8">
              <span className="text-white">t. 1234567890</span>
              <button className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                Try 7-Day Free Trial
              </button>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Menu Items - Categorized */}
          <nav className="h-[calc(100vh-11rem)] overflow-hidden px-12 py-8 space-y-8 overflow-y-auto">
            {Object.keys(categorizedMenuItems).map((category) => (
              <div key={category}>
                <h2 className="text-white text-xl mb-4">{category}</h2>
                <div className="flex flex-wrap gap-4">
                  {categorizedMenuItems[category].map((item) => (
                    <a
                      key={item}
                      href="#"
                      className="nav-item text-white hover:text-red-500 transition-colors"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Contact Information */}
          <div className="h-24 px-12 flex items-center border-t border-white/10">
            <div className="flex justify-between items-center w-full">
              <div className="text-white/80">
                <p className="text-sm">t. 1234567890</p>
                <p className="text-sm">e. contact@align.com</p>
              </div>
              <div className="flex gap-8">
                <a href="#" className="text-white hover:text-red-500 transition-colors">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-white hover:text-red-500 transition-colors">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-white hover:text-red-500 transition-colors">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenMenu;
