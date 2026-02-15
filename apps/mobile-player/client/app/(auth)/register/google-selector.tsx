import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles, spacing } from '@/constants/authStyles';
import AuthButton from '@/components/auth/AuthButton';
import { useRegistration } from '@/contexts/RegistrationContext';
import { performGoogleOAuth } from '@/utils/oauthHandler';

export default function GoogleAccountSelectorScreen() {
  const { updateData } = useRegistration();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleOAuth = async () => {
    setLoading(true);
    setError('');

    try {
      // Perform Google OAuth
      const oauthResult = await performGoogleOAuth();

      // Store OAuth data in context
      updateData({
        oauthEmail: oauthResult.email,
        oauthProvider: oauthResult.provider,
        oauthId: oauthResult.oauthId,
        suggestedName: oauthResult.name,
      });

      // TODO: Check if email exists as email/password account
      // const emailExists = await checkEmailExists(oauthResult.email);

      const emailExists = false; // Placeholder

      if (emailExists) {
        // OAuth collision - redirect to email login with prefilled email
        updateData({ email: oauthResult.email });
        router.push('/(auth)/login/email');
      } else {
        // New user - go to profile completion
        router.push('/(auth)/profile/birthdate');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={formStyles.container}>
      <View style={formStyles.content}>
        <Text style={formStyles.title}>Seleccionar cuenta de Google</Text>
        <Text style={formStyles.subtitle}>
          Conecta tu cuenta de Google para continuar
        </Text>

        {error && (
          <Text style={[formStyles.subtitle, { color: '#e74c3c', marginTop: spacing.md }]}>
            {error}
          </Text>
        )}

        <View style={{ marginTop: spacing.xl }}>
          <AuthButton
            variant="primary"
            onPress={handleGoogleOAuth}
            disabled={loading}
          >
            {loading ? 'Conectando...' : 'Agregar cuenta de Google'}
          </AuthButton>
        </View>
      </View>
    </ScrollView>
  );
}
