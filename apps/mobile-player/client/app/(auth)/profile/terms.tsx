import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, BackHandler } from 'react-native';
import { entryStyles, spacing, colors, formStyles, fontSize } from '@/constants/authStyles';
import { useAuthFlow, useFlowProgress } from '@/contexts/AuthFlowContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthScreenTemplate from '@/components/auth/AuthScreenTemplate';
import { registerUser } from '@/api/auth';

export default function TermsScreen() {
  const { data, updateData, nextStep, prevStep, setLoading, setError, loading } = useAuthFlow();
  const { login } = useAuth();
  const [noAds, setNoAds] = useState(false);
  const [shareData, setShareData] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    updateData({ noAds, shareData });
    setLocalError(null);
    setLoading(true);

    try {
      const response = await registerUser({
        email: data.oauthEmail || data.email,
        password: data.password,
        phone: data.phone,
        oauthEmail: data.oauthEmail,
        oauthProviderId: data.oauthId,
        oauthProvider: data.oauthProvider as 'google' | 'facebook' | 'apple' | undefined,
        birthdate: data.birthdate || '',
        gender: (data.gender as 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir') || 'prefiero_no_decir',
        name: data.name || data.suggestedName || '',
        noAds,
        shareData,
      });

      await login(response.user, response.token, response.expiresAt);
      console.log('[terms] User registered and logged in');

      setLoading(false);
      nextStep(); // Go to notifications
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la cuenta';
      console.error('[terms] Error creating account:', errorMessage);
      setLocalError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <AuthScreenTemplate
      title="Terminos y preferencias"
      subtitle="Revisa y acepta nuestros terminos para continuar."
      buttonText={loading ? 'Creando cuenta...' : 'Crear cuenta'}
      onSubmit={handleCreateAccount}
      buttonDisabled={loading}
      loading={loading}
    >
      {localError && (
        <View style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: 'rgba(231, 76, 60, 0.2)', borderRadius: 8 }}>
          <Text style={{ color: colors.error }}>{localError}</Text>
        </View>
      )}

      {/* Terms Links */}
      <View style={{ gap: spacing.md }}>
        <TouchableOpacity>
          <Text style={entryStyles.loginLink}>Ver Terminos de Uso</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={entryStyles.loginLink}>Ver Politica de Privacidad</Text>
        </TouchableOpacity>
      </View>

      {/* Checkboxes */}
      <View style={{ marginTop: spacing.xxl, gap: spacing.lg }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
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
            {noAds && <Text style={{ color: colors.textDark }}>v</Text>}
          </View>
          <Text style={{ color: colors.text, flex: 1 }}>
            Prefiero no recibir publicidad de Bingote de Oro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
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
            {shareData && <Text style={{ color: colors.textDark }}>v</Text>}
          </View>
          <Text style={{ color: colors.text, flex: 1 }}>
            Acepto compartir mis datos con terceros
          </Text>
        </TouchableOpacity>
      </View>
    </AuthScreenTemplate>
  );
}
