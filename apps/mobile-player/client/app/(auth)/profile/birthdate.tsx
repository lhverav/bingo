import { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { formStyles } from '@/constants/authStyles';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import ProgressBar from '@/components/auth/ProgressBar';
import { useRegistration } from '@/contexts/RegistrationContext';
import { validate } from '@/utils/validation';

export default function BirthdateScreen() {
  const { updateData } = useRegistration();
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    // Validate age (18+)
    const validation = validate('birthdate', birthdate);
    if (!validation.valid) {
      setError(validation.message || 'Debes ser mayor de 18 años');
      return;
    }

    // Store in context
    updateData({ birthdate });

    // Navigate to gender screen
    router.push('/(auth)/profile/gender');
  };

  return (
    <ScrollView style={formStyles.container}>
      <ProgressBar step={1} total={5} />
      <View style={formStyles.content}>
        <Text style={formStyles.title}>¿Cuál es tu fecha de nacimiento?</Text>
        <Text style={formStyles.subtitle}>
          Necesitas tener al menos 18 años para jugar.
        </Text>

        <AuthInput
          value={birthdate}
          onChangeText={(text) => {
            setBirthdate(text);
            setError('');
          }}
          error={error}
          placeholder="YYYY-MM-DD"
        />

        <Text style={formStyles.subtitle}>
          Formato: Año-Mes-Día (ej: 1990-01-15)
        </Text>

        <AuthButton onPress={handleNext}>Siguiente</AuthButton>
      </View>
    </ScrollView>
  );
}
