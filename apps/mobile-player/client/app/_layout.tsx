import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, RegistrationProvider, SocketProvider, GameProvider } from '@/contexts';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RegistrationProvider>
        <SocketProvider>
          <GameProvider>
            <StatusBar style="auto" />
            <Stack>
        {/* Auth Screens */}
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />

        {/* OAuth Callback */}
        <Stack.Screen
          name="oauth-callback"
          options={{
            title: 'Autenticando...',
            headerShown: false,
          }}
        />

        {/* App Screens */}
        <Stack.Screen
          name="home"
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
          </GameProvider>
        </SocketProvider>
      </RegistrationProvider>
    </AuthProvider>
  );
}
