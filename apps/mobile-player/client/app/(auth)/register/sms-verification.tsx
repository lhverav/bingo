import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthFlow } from '@/contexts/AuthFlowContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthScreenTemplate from '@/components/auth/AuthScreenTemplate';
import OtpInput from '@/components/auth/OtpInput';
import { checkPhoneExists, loginWithPhone } from '@/api/auth';
import { colors, spacing, fontSize } from '@/constants/authStyles';

export default function SmsVerificationScreen() {
  const { data, updateData, nextStep, flow, completeFlow } = useAuthFlow();
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Format phone for display
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    // Simple formatting: +57 300 123 4567
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length > 10) {
      const countryCode = phone.slice(0, phone.length - 10);
      const number = phone.slice(-10);
      return `${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    return phone;
  };

  const handleVerify = useCallback(async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code;

    if (codeToVerify.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Actually verify SMS code via API
      // For now, we accept any 6-digit code
      // await verifySmsCode(data.phone, codeToVerify);

      // Mark phone as verified
      updateData({ phoneVerified: true });

      // SMART DETECTION: Check if phone already exists in database
      console.log('[sms-verification] data.phone value:', data.phone);
      const phoneExists = await checkPhoneExists(data.phone || '');
      console.log('[sms-verification] Phone exists check:', phoneExists);

      if (phoneExists) {
        // Existing user - auto-login (regardless of login/register path)
        console.log('[sms-verification] Phone exists, auto-login');
        const authResult = await loginWithPhone(data.phone || '');
        await login(authResult.user, authResult.token, authResult.expiresAt);
        completeFlow();
      } else {
        // New user - continue to profile completion (regardless of login/register path)
        console.log('[sms-verification] New phone, continuing to profile');
        nextStep();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar. Intenta de nuevo.';
      console.error('[sms-verification] Error:', errorMessage);
      setError(errorMessage);
      setCode(''); // Clear on error
    } finally {
      setLoading(false);
    }
  }, [code, data.phone, updateData, nextStep, completeFlow, login]);

  const handleAutoComplete = useCallback((completedCode: string) => {
    // Auto-verify when code is completed sequentially
    handleVerify(completedCode);
  }, [handleVerify]);

  const handleResend = async () => {
    setError('');
    setCode('');

    try {
      // TODO: Resend SMS code via API
      // await sendSmsCode(data.phone);
      console.log('[sms-verification] Resending code to', data.phone);
    } catch (err) {
      setError('Error al reenviar el código');
    }
  };

  const handleEditPhone = () => {
    router.back();
  };

  return (
    <AuthScreenTemplate
      title="Ingresa el código de verificación"
      subtitle={`Enviamos un código a ${formatPhoneDisplay(data.phone || '')}`}
      buttonText={loading ? 'Verificando...' : 'Verificar'}
      onSubmit={() => handleVerify()}
      buttonDisabled={code.length !== 6 || loading}
      showProgress={false}
      loading={loading}
    >
      <View style={styles.content}>
        <OtpInput
          length={6}
          value={code}
          onChange={setCode}
          onComplete={handleAutoComplete}
          error={error}
          disabled={loading}
        />

        {/* Links */}
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={handleResend} disabled={loading}>
            <Text style={styles.link}>Reenviar el código</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleEditPhone} disabled={loading}>
            <Text style={styles.link}>Editar número de teléfono</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthScreenTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  linksContainer: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  link: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
