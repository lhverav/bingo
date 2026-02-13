import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useState } from 'react';
import { useAuthFlow } from '../../contexts/AuthFlowContext';

export default function TermsScreen() {
  const { state, updateData, nextStep, setLoading, getTotalSteps } = useAuthFlow();
  const steps = getTotalSteps();
  const currentStepNumber = state.currentStep + 1;

  const [acceptTerms, setAcceptTerms] = useState(state.data.acceptTerms || false);
  const [noAdsPreference, setNoAdsPreference] = useState(state.data.noAdsPreference || false);
  const [shareDataConsent, setShareDataConsent] = useState(state.data.shareDataConsent || false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenTerms = () => {
    Linking.openURL('https://example.com/terms');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://example.com/privacy');
  };

  const handleCreateAccount = async () => {
    if (!acceptTerms) {
      setError('Debes aceptar los términos de uso para continuar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Save consent preferences
      updateData({
        acceptTerms,
        noAdsPreference,
        shareDataConsent,
      });

      // TODO: Call API to create account
      console.log('Creating account with data:', {
        ...state.data,
        acceptTerms,
        noAdsPreference,
        shareDataConsent,
      });

      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1500));

      // Continue to notifications screen
      nextStep();
    } catch (error) {
      setError('Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStepNumber / steps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Paso {currentStepNumber} de {steps}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Términos y condiciones</Text>

        {/* Terms of Use Link */}
        <TouchableOpacity style={styles.linkButton} onPress={handleOpenTerms}>
          <Text style={styles.linkText}>Términos de uso</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        {/* Privacy Policy Link */}
        <TouchableOpacity style={styles.linkButton} onPress={handleOpenPrivacy}>
          <Text style={styles.linkText}>Política de privacidad</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Required: Accept Terms */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => {
            setAcceptTerms(!acceptTerms);
            setError(null);
          }}
        >
          <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
            {acceptTerms && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            He leído y acepto los Términos de uso y la Política de privacidad
            <Text style={styles.required}> *</Text>
          </Text>
        </TouchableOpacity>

        {/* Optional: No Ads */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setNoAdsPreference(!noAdsPreference)}
        >
          <View style={[styles.checkbox, noAdsPreference && styles.checkboxChecked]}>
            {noAdsPreference && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            Prefiero no recibir publicidad de Bingote de Oro
          </Text>
        </TouchableOpacity>

        {/* Optional: Share Data */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setShareDataConsent(!shareDataConsent)}
        >
          <View style={[styles.checkbox, shareDataConsent && styles.checkboxChecked]}>
            {shareDataConsent && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            Acepto compartir mis datos de registro con los proveedores de contenido para fines publicitarios
          </Text>
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.createButton, !acceptTerms && styles.createButtonDisabled]}
          onPress={handleCreateAccount}
          disabled={!acceptTerms || state.isLoading}
        >
          <Text style={styles.createButtonText}>
            {state.isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Al crear una cuenta, confirmas que tienes al menos 13 años.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  progressContainer: {
    padding: 20,
    paddingTop: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#3a3a5e',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  linkButton: {
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
  },
  linkArrow: {
    color: '#FFD700',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#3a3a5e',
    marginVertical: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3a3a5e',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  checkboxMark: {
    color: '#1a1a2e',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  required: {
    color: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonDisabled: {
    backgroundColor: '#555',
  },
  createButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
