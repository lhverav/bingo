import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack>
        {/* Auth Screens */}
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />

        {/* App Screens */}
        <Stack.Screen
          name="index"
          options={{
            title: 'Bingote de Oro',
          }}
        />
        <Stack.Screen
          name="join-round"
          options={{
            title: 'Unirse a Ronda',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="card-selection"
          options={{
            title: 'Seleccionar Cartones',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="game"
          options={{
            title: 'Juego',
            headerBackVisible: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
