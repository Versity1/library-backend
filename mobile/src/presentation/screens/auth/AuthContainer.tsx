import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';

export const AuthContainer: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  if (isLogin) {
    return <LoginScreen onNavigateRegister={() => setIsLogin(false)} />;
  }

  return <RegisterScreen onNavigateLogin={() => setIsLogin(true)} />;
};
