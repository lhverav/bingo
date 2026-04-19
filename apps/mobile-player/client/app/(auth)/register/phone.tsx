import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuthFlow } from '@/contexts/AuthFlowContext';
import AuthInput from '@/components/auth/AuthInput';
import AuthScreenTemplate from '@/components/auth/AuthScreenTemplate';
import CountryCodePicker from '@/components/auth/CountryCodePicker';
import { validate } from '@/utils/validation';
import { spacing } from '@/constants/authStyles';

export default function PhoneInputScreen() {
  const { updateData, nextStep } = useAuthFlow();
  const [countryCode, setCountryCode] = useState('+57');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
  const isValid = phoneNumber.replace(/\D/g, '').length >= 10;

  const handleSubmit = async () => {
    // Validate phone
    const validation = validate('phone', fullPhone);
    if (!validation.valid) {
      setError(validation.message || 'Número inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Send SMS code via API
      // await sendSmsCode(fullPhone);

      // Store in context and navigate to SMS verification
      updateData({ phone: fullPhone });
      nextStep();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar el código. Intenta de nuevo.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenTemplate
      title="Ingresa tu número de teléfono"
      subtitle="Te enviaremos un código de verificación por SMS."
      onSubmit={handleSubmit}
      buttonDisabled={!isValid || loading}
      showProgress={false}
      loading={loading}
    >
      <View style={styles.phoneContainer}>
        <CountryCodePicker value={countryCode} onChange={setCountryCode} />

        <View style={styles.phoneInputWrapper}>
          <AuthInput
            value={phoneNumber}
            onChangeText={(text) => {
              // Only allow numbers
              const cleaned = text.replace(/\D/g, '');
              setPhoneNumber(cleaned);
              setError('');
            }}
            error={error}
            inputType="phone"
            placeholder="300 123 4567"
          />
        </View>
      </View>
    </AuthScreenTemplate>
  );
}

const styles = StyleSheet.create({
  phoneContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  phoneInputWrapper: {
    flex: 1,
  },
});
