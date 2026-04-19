import { Stack } from 'expo-router';
import { AuthFlowProvider } from '@/contexts/AuthFlowContext';

export default function AuthLayout() {
  return (
    <AuthFlowProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a2e' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="register/hub" />
        <Stack.Screen name="register/email" />
        <Stack.Screen name="register/password" />
        <Stack.Screen name="register/phone" />
        <Stack.Screen name="register/sms-verification" />
        <Stack.Screen name="register/google-selector" />
        <Stack.Screen name="login/hub" />
        <Stack.Screen name="login/email" />
        <Stack.Screen name="profile" />
      </Stack>
    </AuthFlowProvider>
  );
}
