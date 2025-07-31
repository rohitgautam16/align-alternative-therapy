// src/pages/About.jsx
import React from 'react';
import AboutBanner from '../components/about/AboutBanner';
import AboutImgText from '../components/about/AboutImgText';
import ScrollImageComponent from '../components/about/ScrollImageComponent';
import Footer from '../components/common/Footer';
import TransitionWrapper from '../components/custom-ui/transition';
import Header from '../components/common/Header';
import HeroSection from '../components/landing/HeroSection';
import PlaylistCarousel from '../components/landing/PlaylistCarousel';
import AlbumTable from '../components/landing/AlbumTable';
import Benefits from '../components/landing/Benefits';
import Features from '../components/landing/Features';
import Plans from '../components/landing/Plans';
import Introduction from '../components/landing/Introduction';
import TwoImageReveal from '../components/landing/TwoImageReveal';
import AnimatedTestimonialsDemo from '../components/landing/animated-testimonials-demo';
import HeroSlider from '../components/landing/HeroSlider';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import ContactCTABanner from '../components/about/ContactCTABanner'
import JoinNowCTA from '../components/about/JoinNowCTA'
import HeroBanner from '../components/landing/HeroBanner';
import BlogsSection from '../components/about/BlogsSection'
import FAQsSection from '../components/about/FAQsSection'


const AboutPage = () => {
  return (
    <div>
      <Header />
      {/* <ContainerScroll/> */}
      {/* <AboutBanner /> */}
      {/* <AboutImgText /> */}
      <section className="hero-banner">
        <HeroBanner />
      </section>
      <section className="introduction">
        <Introduction />
      </section>
      {/* <section className="playlist-carousel">
        <PlaylistCarousel />
      </section> */}
      {/* <section className="album-table">
        <AlbumTable />
      </section> */}
      {/* <section className="benefits">
        <Benefits />
      </section> */}
      <section className="blogs">
        <BlogsSection />
      </section>
      {/* <section className='fullscreen-image'>
      <ScrollImageComponent />
      </section> */}
      <section className="contact-banner">
        <JoinNowCTA />
      </section>
      <section className="contact-banner">
        <ContactCTABanner />
      </section>
      <section className="faqs">
        <FAQsSection />
      </section>
      <Footer />
    </div>
  );
}

export default TransitionWrapper(AboutPage);