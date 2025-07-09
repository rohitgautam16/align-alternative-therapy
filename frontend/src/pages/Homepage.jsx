import React from 'react';
import Header from '../components/common/Header';
import HeroSection from '../components/landing/HeroSection';
import PlaylistCarousel from '../components/landing/PlaylistCarousel';
import AlbumTable from '../components/landing/AlbumTable';
import Benefits from '../components/landing/Benefits';
import Features from '../components/landing/Features';
import Plans from '../components/landing/Plans';
import Footer from '../components/common/Footer';
import Introduction from '../components/landing/Introduction';
import TwoImageReveal from '../components/landing/TwoImageReveal';
import AnimatedTestimonialsDemo from '../components/landing/animated-testimonials-demo';
import TransitionWrapper from '../components/custom-ui/transition';

const Homepage = () => {
  return (
    <main className="homepage overflow-x-hidden">
      <section className="header">
        <Header />
      </section>
      <section className="hero-section">
        <HeroSection />
      </section>
      {/* <section className="introduction">
        <Introduction />
      </section> */}
      <section className="playlist-carousel">
        <PlaylistCarousel />
      </section>
      <section className="album-table">
        <AlbumTable />
      </section>
      <section className="benefits">
        <Benefits />
      </section>
      <section className="testimonials">
        <AnimatedTestimonialsDemo />
      </section>
      <section className="two-image-reveal">
        <TwoImageReveal />
      </section>
      {/* <section className="features">
        <Features />
      </section> */}
      <section className="plans">
        <Plans />
      </section>
      <Footer />
    </main>
  );
};

export default TransitionWrapper(Homepage);
