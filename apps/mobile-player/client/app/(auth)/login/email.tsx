import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { spacing } from '@/constants/authStyles';
import { useAuthFlow } from '@/contexts/AuthFlowContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthInput from '@/components/auth/AuthInput';
import AuthScreenTemplate from '@/components/auth/AuthScreenTemplate';
import { validate } from '@/utils/validation';
import { loginUser } from '@/api/auth';

export default function EmailLoginScreen() {
  const { prefillEmail } = useLocalSearchParams<{ prefillEmail?: string }>();
  const { data, completeFlow } = useAuthFlow();
  const { login } = useAuth();
  // Priority: URL param (from OAuth conflict) > AuthFlow data > empty
  const [email, setEmail] = useState(prefillEmail || data.email || '');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const emailValidation = validate('email', email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message || 'Email inválido');
      return;
    }

    // For login, only check if password is provided (no format validation)
    if (!password.trim()) {
      setPasswordError('Contraseña requerida');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(email, password);
      await login(response.user, response.token, response.expiresAt);
      console.log('[login/email] User logged in successfully');
      completeFlow();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Email o contraseña incorrectos';
      setPasswordError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenTemplate
      title="Ingresar con email"
      subtitle="Inicia sesión con tu email y contraseña."
      buttonText={loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      onSubmit={handleLogin}
      buttonDisabled={loading || !email || !password}
      showProgress={false}
      loading={loading}
    >
      <View style={{ gap: spacing.md }}>
        <AuthInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
          }}
          error={emailError}
          inputType="email"
          placeholder="correo@ejemplo.com"
        />

        <AuthInput
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
          }}
          error={passwordError}
          inputType="password"
          placeholder="Contraseña"
        />
      </View>
    </AuthScreenTemplate>
  );
}
