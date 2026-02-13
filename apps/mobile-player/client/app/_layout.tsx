import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Bingote de Oro',
          }}
        />
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
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
    </>
  );
}
