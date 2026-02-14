import React from 'react';
import { router } from 'expo-router';
import { AuthFlowProvider, AuthFlowNavigator, authFlowData } from '../../features/auth';

export default function AuthScreen() {
  const handleExitToHome = () => {
    // Navigate to main app
    router.replace('/');
  };

  return (
    <AuthFlowProvider
      flow={authFlowData}
      onExitToHome={handleExitToHome}
    >
      <AuthFlowNavigator />
    </AuthFlowProvider>
  );
}
