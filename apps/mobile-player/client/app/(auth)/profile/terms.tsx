import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { formStyles, entryStyles, spacing, colors } from '@/constants/authStyles';
import AuthButton from '@/components/auth/AuthButton';
import ProgressBar from '@/components/auth/ProgressBar';
import { useRegistration } from '@/contexts/RegistrationContext';
import { useAuth } from '@/contexts/AuthContext';

export default function TermsScreen() {
  const { data, updateData } = useRegistration();
  const { login } = useAuth();
  const [noAds, setNoAds] = useState(false);
  const [shareData, setShareData] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    // Store preferences in context
    updateData({ noAds, shareData });

    setLoading(true);
    try {
      // TODO: Create account with all data from context via API
      // const response = await registerUser({
      //   email: data.email,
      //   password: data.password,
      //   phone: data.phone,
      //   oauthEmail: data.oauthEmail,
      //   oauthId: data.oauthId,
      //   oauthProvider: data.oauthProvider,
      //   birthdate: data.birthdate,
      //   gender: data.gender,
      //   name: data.name,
      //   noAds,
      //   shareData,
      // });

      console.log('Creating account with data:', {
        ...data,
        noAds,
        shareData,
      });

      // Create user object from registration data
      const user = {
        id: data.oauthId || `temp-${Date.now()}`,
        email: data.oauthEmail || data.email,
        name: data.name || data.suggestedName || '',
        birthdate: data.birthdate || '',
        gender: data.gender || '',
        createdAt: new Date().toISOString(),
      };

      // TODO: Get real token from backend response
      const mockToken = `mock-token-${Date.now()}`;

      // Log the user in
      await login(user, mockToken);
      console.log('✅ User logged in after registration');

      // Navigate to notifications screen
      router.push('/(auth)/profile/notifications');
    } catch (err) {
      console.error('Error creating account:', err);
      // TODO: Show error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={formStyles.container}>
      <ProgressBar step={4} total={5} />
      <View style={formStyles.content}>
        <Text style={formStyles.title}>Términos y preferencias</Text>
        <Text style={formStyles.subtitle}>
          Revisa y acepta nuestros términos para continuar.
        </Text>

        {/* Terms Links */}
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <TouchableOpacity>
            <Text style={entryStyles.loginLink}>Ver Términos de Uso</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={entryStyles.loginLink}>Ver Política de Privacidad</Text>
          </TouchableOpacity>
        </View>

        {/* Checkboxes */}
        <View style={{ marginTop: spacing.xxl, gap: spacing.lg }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
            }}
            onPress={() => setNoAds(!noAds)}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderWidth: 2,
                borderColor: colors.primary,
                borderRadius: 4,
                backgroundColor: noAds ? colors.primary : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {noAds && <Text style={{ color: colors.textDark }}>✓</Text>}
            </View>
            <Text style={{ color: colors.text, flex: 1 }}>
              Prefiero no recibir publicidad de Bingote de Oro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
            }}
            onPress={() => setShareData(!shareData)}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderWidth: 2,
                borderColor: colors.primary,
                borderRadius: 4,
                backgroundColor: shareData ? colors.primary : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {shareData && <Text style={{ color: colors.textDark }}>✓</Text>}
            </View>
            <Text style={{ color: colors.text, flex: 1 }}>
              Acepto compartir mis datos con terceros
            </Text>
          </TouchableOpacity>
        </View>

        <AuthButton onPress={handleCreateAccount} disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </AuthButton>
      </View>
    </ScrollView>
  );
}
