import Header from '../components/common/Header';
import HeroBannerTwo from '../components/landing/HeroBannerTwo';
import useDocumentMeta from '../hooks/useDocumentMeta';

const Homepage = () => {
  useDocumentMeta({
    title: 'Sound Healing and Alternative Therapy',
    description:
      'Align Alternative Therapy offers sound healing, frequency-based audio, and personalized wellness tools for calm, focus, sleep, and balance.',
    path: '/',
  });

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
