import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles } from '@/constants/authStyles';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { useRegistration } from '@/contexts/RegistrationContext';
import { validate } from '@/utils/validation';

export default function PhoneInputScreen() {
  const { updateData } = useRegistration();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    // Validate phone
    const validation = validate('phone', phone);
    if (!validation.valid) {
      setError(validation.message || 'Número inválido');
      return;
    }

    // Store in context
    updateData({ phone });

    setLoading(true);
    try {
      // TODO: Send SMS code via API
      // await sendSmsCode(phone);

      // Navigate to verification screen
      router.push('/(auth)/register/sms-verification');
    } catch (err) {
      setError('Error al enviar el código. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={formStyles.container}>
      <View style={formStyles.content}>
        <Text style={formStyles.title}>Ingresa tu número de teléfono</Text>
        <Text style={formStyles.subtitle}>
          Te enviaremos un código de verificación.
        </Text>

        <AuthInput
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            setError('');
          }}
          error={error}
          inputType="phone"
          placeholder="+1234567890"
        />

        <AuthButton onPress={handleNext} disabled={loading}>
          {loading ? 'Enviando...' : 'Siguiente'}
        </AuthButton>
      </View>
    </ScrollView>
  );
}
