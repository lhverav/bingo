import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles } from '@/constants/authStyles';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { useRegistration } from '@/contexts/RegistrationContext';
import { validate } from '@/utils/validation';

export default function EmailLoginScreen() {
  const { data } = useRegistration();
  // Can prefill email from context (OAuth collision case)
  const [email, setEmail] = useState(data.email || '');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validate email
    const emailValidation = validate('email', email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message || 'Email inválido');
      return;
    }

    // Validate password
    const passwordValidation = validate('password', password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message || 'Contraseña requerida');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call login API
      // await loginUser(email, password);

      console.log('Logging in with:', { email, password });

      // Navigate to app home
      router.replace('/');
    } catch (err) {
      setPasswordError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={formStyles.container}>
      <View style={formStyles.content}>
        <Text style={formStyles.title}>Ingresa tu contraseña</Text>
        <Text style={formStyles.subtitle}>
          Inicia sesión con tu email y contraseña.
        </Text>

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

        <AuthButton onPress={handleLogin} disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </AuthButton>
      </View>
    </ScrollView>
  );
}
