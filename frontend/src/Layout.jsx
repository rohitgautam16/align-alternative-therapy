// src/Layout.jsx
import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useMenu } from './context/MenuContext';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Header from './components/common/Header';
import FullScreenMenu from './components/common/FullScreenMenu/FullScreenMenu';
// import MusicPlayer from './components/music/MusicPlayer';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';

gsap.registerPlugin(ScrollTrigger);

export default function Layout() {
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  //const isAuth = useSelector((s) => s.auth.isAuthenticated);
  const isAuth = useIsAuthenticated(); 
  const { pathname } = useLocation();
  const showPlayer = isAuth && pathname.startsWith('/dashboard');

  const lenisRef = useRef(null);

  useEffect(() => {
  const lenis = new Lenis({
    duration: 2.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });

  lenisRef.current = lenis;

  function raf(time) {
    lenis.raf(time);
    ScrollTrigger.update();
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      return arguments.length
        ? lenis.scrollTo(value, { immediate: true })
        : window.scrollY;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
    pinType: document.body.style.transform ? 'transform' : 'fixed',
  });

  ScrollTrigger.refresh();

  return () => {
    lenis.destroy();
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  };
}, []);


  return (
    <div className="flex flex-col min-h-screen">
      {/* <Header onMenuClick={() => setIsMenuOpen(o => !o)} /> */}

      {isMenuOpen && (
        <FullScreenMenu
          trigger={isMenuOpen}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
      )}

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {showPlayer && (
        <footer className="border-t border-gray-700">
          {/* <MusicPlayer /> */}
        </footer>
      )}
    </div>
  );
}
