import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { formStyles, entryStyles, spacing } from '@/constants/authStyles';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { useRegistration } from '@/contexts/RegistrationContext';
import { validate } from '@/utils/validation';

export default function SmsVerificationScreen() {
  const { data, updateData } = useRegistration();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    // Validate code
    const validation = validate('verificationCode', code);
    if (!validation.valid) {
      setError(validation.message || 'Código inválido');
      return;
    }

    setLoading(true);
    try {
      // TODO: Verify SMS code via API
      // await verifySmsCode(data.phone, code);

      // Mark phone as verified in context
      updateData({ phoneVerified: true });

      // Navigate to profile completion
      router.push('/(auth)/profile/birthdate');
    } catch (err) {
      setError('Código incorrecto. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // TODO: Resend SMS code
    // await sendSmsCode(data.phone);
  };

  return (
    <ScrollView style={formStyles.container}>
      <View style={formStyles.content}>
        <Text style={formStyles.title}>Ingresa el código de verificación</Text>
        <Text style={formStyles.subtitle}>
          Enviamos un código a {data.phone}
        </Text>

        <AuthInput
          value={code}
          onChangeText={(text) => {
            setCode(text);
            setError('');
          }}
          error={error}
          inputType="phone"
          placeholder="123456"
          maxLength={6}
        />

        <AuthButton onPress={handleVerify} disabled={loading}>
          {loading ? 'Verificando...' : 'Verificar'}
        </AuthButton>

        {/* Resend Code Link */}
        <View style={[entryStyles.loginContainer, { marginTop: spacing.xl }]}>
          <TouchableOpacity onPress={handleResend}>
            <Text style={entryStyles.loginLink}>Reenviar el código</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Phone Link */}
        <View style={[entryStyles.loginContainer, { marginTop: spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={entryStyles.loginLink}>Editar número de teléfono</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
