import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles } from '@/constants/authStyles';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { useRegistration } from '@/contexts/RegistrationContext';
import { validate } from '@/utils/validation';

export default function CreatePasswordScreen() {
  const { data, updateData } = useRegistration();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    // Validate password
    const validation = validate('password', password);
    if (!validation.valid) {
      setError(validation.message || 'Contraseña inválida');
      return;
    }

    // Store in context
    updateData({ password });

    // Navigate to profile completion
    router.push('/(auth)/profile/birthdate');
  };

  return (
    <ScrollView style={formStyles.container}>
      <View style={formStyles.content}>
        <Text style={formStyles.title}>Crea una contraseña</Text>
        <Text style={formStyles.subtitle}>
          Usa al menos 6 caracteres.
        </Text>

        <AuthInput
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          error={error}
          inputType="password"
          placeholder="Contraseña"
        />

        <AuthButton onPress={handleNext}>Siguiente</AuthButton>
      </View>
    </ScrollView>
  );
}
