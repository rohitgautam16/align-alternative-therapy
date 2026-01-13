
import React from 'react';
import ResetPassword from '../components/auth/ResetPassword'; 
import TransitionWrapper from '../components/custom-ui/transition';
import Header from '../components/common/Header';

const ResetPasswordPage = () => {

  return (
    <div className="login-page">
      <Header />
      <ResetPassword />
    </div>
  );
};

export default ResetPasswordPage;
