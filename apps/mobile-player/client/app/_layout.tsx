import { ReactNode } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AuthProvider,
  RegistrationProvider,
  SocketProvider,
  GameProvider,
} from "@/contexts";
import { AuthFlowProvider } from "@/contexts/AuthFlowContext";
import { useRoundStartNotification } from "@/hooks";

/**
 * Root Layout - Navigation Architecture
 *
 * The navigation is organized into two isolated flows:
 *
 * 1. AUTH FLOW (unauthenticated users):
 *    - index -> (auth)/* screens
 *    - Screens: login, register, profile setup
 *
 * 2. APP FLOW (authenticated users):
 *    - index -> /main screen (with Chrome-style internal tabs)
 *    - Main tabs: "Proximos Juegos" and "Juegos en Curso"
 *    - Game screens: game-detail, join-round, card-selection, game
 *
 * The root index.tsx acts as a navigation guard, checking auth state
 * and redirecting to the appropriate flow. Using router.replace()
 * ensures no back-navigation between flows.
 */

/**
 * Wrapper component that enables hooks inside the layout.
 * Used to listen for round notifications.
 */
function AppContent({ children }: { children: ReactNode }) {
  // Listen for round start notifications and auto-navigate
  useRoundStartNotification();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RegistrationProvider>
        <AuthFlowProvider>
          <SocketProvider>
            <GameProvider>
              <AppContent>
              <StatusBar style="auto" />
              <Stack
                screenOptions={{
                  headerShown: true,
                  // Disable gestures to prevent swipe-back between flows
                  gestureEnabled: false,
                }}
              >
                {/* Root Navigation Guard */}
                <Stack.Screen
                  name="index"
                  options={{
                    headerShown: false,
                  }}
                />

                {/* ============================================== */}
                {/* AUTH FLOW - Only for unauthenticated users    */}
                {/* ============================================== */}
                <Stack.Screen
                  name="(auth)"
                  options={{
                    headerShown: false,
                    // Prevent back gesture to app screens
                    gestureEnabled: false,
                  }}
                />

                {/* OAuth Callback - Bridge between auth flows */}
                <Stack.Screen
                  name="oauth-callback"
                  options={{
                    title: "Autenticando...",
                    headerShown: false,
                  }}
                />

                {/* ============================================== */}
                {/* APP FLOW - Only for authenticated users       */}
                {/* ============================================== */}

                {/* Main Screen with internal tabs */}
                <Stack.Screen
                  name="main"
                  options={{
                    headerShown: false,
                    // Prevent back gesture to auth screens
                    gestureEnabled: false,
                  }}
                />

                {/* Legacy screens - kept for backwards compatibility */}
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                    gestureEnabled: false,
                  }}
                />
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

                {/* Game List - Browse and join games */}
                <Stack.Screen
                  name="games"
                  options={{
                    headerShown: false,
                  }}
                />

                {/* Game Lobby - Wait for round to start */}
                <Stack.Screen
                  name="game-lobby"
                  options={{
                    headerShown: false,
                  }}
                />

                {/* Game Flow Screens */}
                <Stack.Screen
                  name="join-round"
                  options={{
                    title: "Unirse a Ronda",
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="card-selection"
                  options={{
                    title: "Seleccionar Cartones",
                    headerBackVisible: false,
                  }}
                />
                <Stack.Screen
                  name="game"
                  options={{
                    title: "Juego",
                    headerBackVisible: false,
                  }}
                />

                {/* Join Game - Game-level join flow */}
                <Stack.Screen
                  name="join-game"
                  options={{
                    title: "Unirse a Juego",
                    headerShown: false,
                  }}
                />
              </Stack>
              </AppContent>
            </GameProvider>
          </SocketProvider>
        </AuthFlowProvider>
      </RegistrationProvider>
    </AuthProvider>
  );
}
