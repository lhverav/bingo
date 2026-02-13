import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useAuthFlow } from '../../contexts/AuthFlowContext';

export default function PhoneInputScreen() {
  const { state, updateData, nextStep } = useAuthFlow();
  const [countryCode, setCountryCode] = useState('+57');
  const [phone, setPhone] = useState(state.data.phone || '');
  const [error, setError] = useState<string | null>(null);

  const validatePhone = (phoneNumber: string) => {
    // Basic validation - at least 10 digits
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  };

  const handleNext = () => {
    if (!phone.trim()) {
      setError('Por favor ingresa tu número de teléfono');
      return;
    }
    if (!validatePhone(phone)) {
      setError('Por favor ingresa un número válido');
      return;
    }

    setError(null);
    updateData({ phone: phone.trim(), countryCode });
    nextStep();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Ingresa tu número de teléfono</Text>
        <Text style={styles.subtitle}>
          Te enviaremos un código de verificación por SMS.
        </Text>

        <View style={styles.phoneContainer}>
          <TouchableOpacity style={styles.countrySelector}>
            <Text style={styles.countryCode}>{countryCode}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.phoneInput, error && styles.inputError]}
            placeholder="Número de teléfono"
            placeholderTextColor="#888"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setError(null);
            }}
            keyboardType="phone-pad"
            autoFocus
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.disclaimer}>
          Al continuar, confirmas que estás autorizado a usar este número de teléfono y aceptas recibir mensajes SMS.
        </Text>

        <TouchableOpacity
          style={[styles.nextButton, !phone.trim() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!phone.trim()}
        >
          <Text style={styles.nextButtonText}>Siguiente</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 30,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  countrySelector: {
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  countryCode: {
    color: '#fff',
    fontSize: 16,
  },
  dropdownArrow: {
    color: '#888',
    fontSize: 10,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 8,
  },
  disclaimer: {
    color: '#666',
    fontSize: 12,
    marginTop: 20,
    lineHeight: 18,
  },
  nextButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
  },
  nextButtonDisabled: {
    backgroundColor: '#555',
  },
  nextButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
