import ContactBanner from '../components/contact/ContactBanner';
import ContactForm from '../components/contact/ContactForm';
import Footer from '../components/common/Footer';
import TransitionWrapper from '../components/custom-ui/transition';
import Header from '../components/common/Header';
import useDocumentMeta from '../hooks/useDocumentMeta';

const ContactPage = () => {
  useDocumentMeta({
    title: 'Contact',
    description:
      'Contact Align Alternative Therapy for support, questions about sound healing, personalized plans, subscriptions, and wellness audio guidance.',
    path: '/contact-us',
  });

  return (
    <div className="contact-page">
      <Header />
      <ContactBanner />
      <ContactForm />
      <Footer />
    </div>
  );
};

export default TransitionWrapper(ContactPage);
