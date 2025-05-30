import React from "react";
import { FaLinkedin } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { Facebook, Instagram } from "lucide-react";
import logo from '../../assets/icons/Logo.png';

const Footer = () => {
  return (
    <footer className="bg-[#000000] text-white py-6 px-36 md:px-36">
      <div className="max-w-screen mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Section */}
        <div>
          <div className="flex items-center mb-4">
            <img src={logo} alt="Website Logo" className="h-10 mr-3" />
            <span className="text-xl font-semibold">ALIGN</span>
          </div>
          <p className="text-gray-400 mb-6">
           Align is more than just a wellness brand; it's your gateway to a 
           life of profound inner peace. Our carefully curated collection of
            products and practices are designed to help you:
          </p>
          <div className="flex space-x-4">
            <a href="#" aria-label="Facebook">
              <Facebook className="h-6 w-6 text-gray-400 hover:text-white" />
            </a>
            <a href="#" aria-label="Instagram">
              <Instagram className="h-6 w-6 text-gray-400 hover:text-white" />
            </a>
          </div>
          <div className="mt-6">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full md:w-auto bg-gray-800/70 text-gray-300 py-2 px-4 rounded-l-md focus:outline-none focus:ring-2 focus:ring-gray-600"
            />
            <button className="bg-white/70 text-black py-2 px-4 rounded-r-md hover:bg-gray-100 transition">
              Subscribe
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="col-span-2 grid grid-cols-2 ml-20 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="text-white">About Us</a></li>
              <li><a href="#" className="text-white">Careers</a></li>
              <li><a href="#" className="text-white">Blog</a></li>
              <li><a href="#" className="text-white">Press</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Support</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Align. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
