import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles } from '@/constants/authStyles';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import ProgressBar from '@/components/auth/ProgressBar';
import { useRegistration } from '@/contexts/RegistrationContext';
import { validate } from '@/utils/validation';

export default function NameScreen() {
  const { data, updateData } = useRegistration();
  // Prefill from OAuth data if available
  const [name, setName] = useState(data.suggestedName || '');
  const [error, setError] = useState('');

  const handleNext = () => {
    // Validate name
    const validation = validate('name', name);
    if (!validation.valid) {
      setError(validation.message || 'Nombre requerido');
      return;
    }

    // Store in context
    updateData({ name });

    // Navigate to terms screen
    router.push('/(auth)/profile/terms');
  };

  return (
    <ScrollView style={formStyles.container}>
      <ProgressBar step={3} total={5} />
      <View style={formStyles.content}>
        <Text style={formStyles.title}>¿Cómo te llamas?</Text>
        <Text style={formStyles.subtitle}>
          Este nombre aparecerá en tu perfil.
        </Text>

        <AuthInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
          }}
          error={error}
          placeholder="Tu nombre"
        />

        <AuthButton onPress={handleNext}>Siguiente</AuthButton>
      </View>
    </ScrollView>
  );
}
