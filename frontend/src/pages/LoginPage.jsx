
import React from 'react';
import Login from '../components/auth/Login'; 
import TransitionWrapper from '../components/custom-ui/transition';
import Header from '../components/common/Header';

const LoginPage = () => {

  return (
    <div className="login-page">
      <Header />
      <Login />
    </div>
  );
};

export default TransitionWrapper(LoginPage);
