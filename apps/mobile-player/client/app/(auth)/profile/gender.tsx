import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles } from '@/constants/authStyles';
import AuthButton from '@/components/auth/AuthButton';
import ProgressBar from '@/components/auth/ProgressBar';
import RadioGroup from '@/components/auth/RadioGroup';
import { useRegistration } from '@/contexts/RegistrationContext';

const GENDER_OPTIONS = [
  { value: 'femenino', label: 'Femenino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'no_binario', label: 'No binario' },
  { value: 'otro', label: 'Otro' },
  { value: 'no_decir', label: 'Prefiero no compartirlo' },
];

export default function GenderScreen() {
  const { updateData } = useRegistration();
  const [gender, setGender] = useState('');

  const handleNext = () => {
    if (!gender) {
      return;
    }

    // Store in context
    updateData({ gender });

    // Navigate to name screen
    router.push('/(auth)/profile/name');
  };

  return (
    <ScrollView style={formStyles.container}>
      <ProgressBar step={2} total={5} />
      <View style={formStyles.content}>
        <Text style={formStyles.title}>¿Cuál es tu género?</Text>
        <Text style={formStyles.subtitle}>
          Esta información nos ayuda a personalizar tu experiencia.
        </Text>

        <RadioGroup
          options={GENDER_OPTIONS}
          value={gender}
          onChange={setGender}
        />

        <AuthButton onPress={handleNext} disabled={!gender}>
          Siguiente
        </AuthButton>
      </View>
    </ScrollView>
  );
}
