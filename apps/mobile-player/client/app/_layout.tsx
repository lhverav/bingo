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

              {/* Main Tab Navigation */}
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />

              {/* Legacy home screen - redirect to tabs */}
              <Stack.Screen
                name="home"
                options={{
                  headerShown: false,
                }}
              />

              {/* Game Detail - Full screen from Mis Juegos */}
              <Stack.Screen
                name="game-detail"
                options={{
                  headerShown: false,
                }}
              />

              {/* Game Flow Screens */}
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
