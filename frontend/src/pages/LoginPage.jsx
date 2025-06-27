
import React from 'react';
import Login from '../components/auth/Login'; 
import TransitionWrapper from '../components/custom-ui/transition';

const LoginPage = () => {
  return (
    <div className="login-page">
      <Login />
    </div>
  );
};

export default TransitionWrapper(LoginPage);
