import { Stack } from 'expo-router';
import { RegistrationProvider } from '@/contexts/RegistrationContext';

export default function AuthLayout() {
  return (
    <RegistrationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a2e' },
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
        <Stack.Screen name="profile/birthdate" />
        <Stack.Screen name="profile/gender" />
        <Stack.Screen name="profile/name" />
        <Stack.Screen name="profile/terms" />
        <Stack.Screen name="profile/notifications" />
      </Stack>
    </RegistrationProvider>
  );
}
