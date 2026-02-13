import { Stack } from 'expo-router';
import { AuthFlowProvider } from '../../contexts/AuthFlowContext';

export default function AuthLayout() {
  return (
    <AuthFlowProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#FFD700',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#1a1a2e' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Bingote de Oro', headerShown: false }}
        />
        <Stack.Screen
          name="register/email"
          options={{ title: 'Tu Email' }}
        />
        <Stack.Screen
          name="register/password"
          options={{ title: 'Crear Contraseña' }}
        />
        <Stack.Screen
          name="login/email"
          options={{ title: 'Iniciar Sesión' }}
        />
        <Stack.Screen
          name="phone-input"
          options={{ title: 'Tu Teléfono' }}
        />
        <Stack.Screen
          name="sms-code"
          options={{ title: 'Verificar Código' }}
        />
        <Stack.Screen
          name="birth-date"
          options={{ title: 'Fecha de Nacimiento' }}
        />
        <Stack.Screen
          name="gender"
          options={{ title: 'Tu Género' }}
        />
        <Stack.Screen
          name="name"
          options={{ title: 'Tu Nombre' }}
        />
        <Stack.Screen
          name="terms"
          options={{ title: 'Términos y Condiciones' }}
        />
        <Stack.Screen
          name="notifications"
          options={{ title: 'Notificaciones', headerShown: false }}
        />
      </Stack>
    </AuthFlowProvider>
  );
}
