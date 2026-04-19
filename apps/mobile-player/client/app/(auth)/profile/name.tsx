import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useAuthFlow } from '@/contexts/AuthFlowContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthInput from '@/components/auth/AuthInput';
import AuthScreenTemplate from '@/components/auth/AuthScreenTemplate';
import { validate } from '@/utils/validation';
import { colors, spacing, fontSize } from '@/constants/authStyles';
import { registerUser } from '@/api/auth';

export default function NameAndTermsScreen() {
  const { data, updateData, nextStep, setLoading, loading } = useAuthFlow();
  const { login } = useAuth();

  // Prefill from OAuth data if available
  const [name, setName] = useState(data.suggestedName || '');
  const [error, setError] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Checkboxes
  const [noAds, setNoAds] = useState(false);
  const [shareData, setShareData] = useState(false);

  const handleCreateAccount = async () => {
    // Validate name
    const validation = validate('name', name);
    if (!validation.valid) {
      setError(validation.message || 'Nombre requerido');
      return;
    }

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
        name: name,
        noAds,
        shareData,
      });

      await login(response.user, response.token, response.expiresAt);
      console.log('[name-terms] User registered and logged in');

      // Update data and go to notifications
      updateData({ name, noAds, shareData });
      setLoading(false);
      nextStep();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la cuenta';
      console.error('[name-terms] Error creating account:', errorMessage);
      setLocalError(errorMessage);
      setLoading(false);
    }
  };

  const openTerms = () => {
    Linking.openURL('https://bingotedeoro.com/terminos');
  };

  const openPrivacy = () => {
    Linking.openURL('https://bingotedeoro.com/privacidad');
  };

  return (
    <AuthScreenTemplate
      title="¿Cómo te llamas?"
      subtitle="Este nombre aparecerá en tu perfil."
      buttonText={loading ? 'Creando cuenta...' : 'Crear cuenta'}
      onSubmit={handleCreateAccount}
      buttonDisabled={!name.trim() || loading}
      loading={loading}
    >
      {/* Error banner */}
      {localError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{localError}</Text>
        </View>
      )}

      {/* Name input */}
      <AuthInput
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError('');
        }}
        error={error}
        placeholder="Tu nombre"
      />

      {/* Terms section */}
      <View style={styles.termsSection}>
        <Text style={styles.termsSectionTitle}>Términos y preferencias</Text>

        {/* Terms Links */}
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={openTerms}>
            <Text style={styles.link}>Ver Términos de Uso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openPrivacy}>
            <Text style={styles.link}>Ver Política de Privacidad</Text>
          </TouchableOpacity>
        </View>

        {/* Checkboxes */}
        <View style={styles.checkboxesContainer}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setNoAds(!noAds)}
          >
            <View style={[styles.checkbox, noAds && styles.checkboxChecked]}>
              {noAds && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Prefiero no recibir publicidad de Bingote de Oro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setShareData(!shareData)}
          >
            <View style={[styles.checkbox, shareData && styles.checkboxChecked]}>
              {shareData && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Acepto compartir mis datos con terceros
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthScreenTemplate>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  termsSection: {
    marginTop: spacing.xxl,
  },
  termsSectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  linksContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  link: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  checkboxesContainer: {
    gap: spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
});
