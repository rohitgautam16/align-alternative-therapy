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
import HeroSlider from '../components/landing/HeroSlider';
import HeroBanner from '../components/landing/HeroBanner';
import HeroBannerTwo from '../components/landing/HeroBannerTwo';

const Homepage = () => {
  return (
    <main className="homepage overflow-hidden">
      <section className="header">
        <Header />
      </section>
      <section className="hero-slider">
        <HeroBannerTwo />
      </section>
      {/* <section className="hero-slider">
        <HeroSlider />
      </section> */}
    </main>
  );
};

export default Homepage;
