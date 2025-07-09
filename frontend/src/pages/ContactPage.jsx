import React from 'react';
import Login from '../components/auth/Login'; 
import ContactBanner from '../components/contact/ContactBanner';
import ContactForm from '../components/contact/ContactForm';
import Footer from '../components/common/Footer';
import TransitionWrapper from '../components/custom-ui/transition';
import Header from '../components/common/Header';

const ContactPage = () => {
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
