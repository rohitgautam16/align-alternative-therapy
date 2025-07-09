// src/pages/About.jsx
import React from 'react';
import AboutBanner from '../components/about/AboutBanner';
import AboutImgText from '../components/about/AboutImgText';
import ScrollImageComponent from '../components/about/ScrollImageComponent';
import Footer from '../components/common/Footer';
import TransitionWrapper from '../components/custom-ui/transition';
import Header from '../components/common/Header';


const AboutPage = () => {
  return (
    <div>
      <Header />
      <AboutBanner />
      <ScrollImageComponent />
      <AboutImgText />
      <Footer />
    </div>
  );
}

export default TransitionWrapper(AboutPage);