import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles } from '@/constants/authStyles';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { useRegistration } from '@/contexts/RegistrationContext';
import { validate } from '@/utils/validation';

export default function EmailInputScreen() {
  const { updateData } = useRegistration();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    // Validate email
    const validation = validate('email', email);
    if (!validation.valid) {
      setError(validation.message || 'Email inválido');
      return;
    }

    // Store in context
    updateData({ email });

    // Navigate to password screen (no params needed!)
    router.push('/(auth)/register/password');
  };

  return (
    <ScrollView style={formStyles.container}>
      <View style={formStyles.content}>
        <Text style={formStyles.title}>¿Cuál es tu email?</Text>
        <Text style={formStyles.subtitle}>
          Lo necesitarás para iniciar sesión.
        </Text>

        <AuthInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          error={error}
          inputType="email"
          placeholder="correo@ejemplo.com"
        />

        <AuthButton onPress={handleNext}>Siguiente</AuthButton>
      </View>
    </ScrollView>
  );
}
