
import React from 'react';
import ForgotPassword from '../components/auth/ForgotPassword'; 
import TransitionWrapper from '../components/custom-ui/transition';
import Header from '../components/common/Header';

const ForgotPasswordPage = () => {

  return (
    <div className="login-page">
      <Header />
      <ForgotPassword />
    </div>
  );
};

export default TransitionWrapper(ForgotPasswordPage);
