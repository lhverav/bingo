import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles, spacing } from '@/constants/authStyles';
import AuthButton from '@/components/auth/AuthButton';
import { useRegistration } from '@/contexts/RegistrationContext';
import { initiateGoogleLogin } from '@/utils/googleOAuth';

export default function GoogleAccountSelectorScreen() {
  const { updateData } = useRegistration();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleOAuth = async () => {
    setLoading(true);
    setError('');

    try {
      // Initiate Google OAuth - opens browser
      await initiateGoogleLogin();
      // Note: The oauth-callback screen will handle the result
      // and either complete registration or continue to profile flow
    } catch (err: any) {
      setError(err.message || 'Error al conectar con Google');
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
