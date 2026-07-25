import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

export const AuthContainer: React.FC = () => {
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('LOGIN');

  if (authView === 'LOGIN') {
    return (
      <LoginScreen 
        onNavigateRegister={() => setAuthView('REGISTER')} 
        onNavigateForgotPassword={() => setAuthView('FORGOT_PASSWORD')}
      />
    );
  }

  if (authView === 'FORGOT_PASSWORD') {
    return <ForgotPasswordScreen onNavigateLogin={() => setAuthView('LOGIN')} />;
  }

  return <RegisterScreen onNavigateLogin={() => setAuthView('LOGIN')} />;
};
