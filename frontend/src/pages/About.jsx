// src/pages/About.jsx
import Footer from '../components/common/Footer';
import TransitionWrapper from '../components/custom-ui/transition';
import Header from '../components/common/Header';
import Introduction from '../components/landing/Introduction';
import ContactCTABanner from '../components/about/ContactCTABanner'
import JoinNowCTA from '../components/about/JoinNowCTA'
import HeroBanner from '../components/landing/HeroBanner';
import BlogsSection from '../components/about/BlogsSection'
import FAQsSection from '../components/about/FAQsSection'
import useDocumentMeta from '../hooks/useDocumentMeta';


const AboutPage = () => {
  useDocumentMeta({
    title: 'About Align',
    description:
      'Learn about Align Alternative Therapy, our sound-based wellness approach, and our mission to make therapeutic audio accessible and supportive.',
    path: '/about',
  });

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
