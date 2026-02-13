import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useAuthFlow } from '../../../contexts/AuthFlowContext';

export default function RegisterPasswordScreen() {
  const { state, updateData, nextStep } = useAuthFlow();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Za-z]/.test(pwd)) return 'La contraseña debe contener al menos una letra';
    if (!/[0-9]/.test(pwd)) return 'La contraseña debe contener al menos un número';
    return null;
  };

  const handleNext = () => {
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    updateData({ password });
    nextStep();
  };

  const passwordStrength = () => {
    if (password.length === 0) return null;
    if (password.length < 6) return { text: 'Débil', color: '#e74c3c' };
    if (password.length < 10) return { text: 'Media', color: '#f39c12' };
    return { text: 'Fuerte', color: '#2ecc71' };
  };

  const strength = passwordStrength();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Crea una contraseña</Text>
        <Text style={styles.subtitle}>
          Usa al menos 8 caracteres, incluyendo letras y números.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="Contraseña"
            placeholderTextColor="#888"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry={!showPassword}
            autoFocus
          />
          <TouchableOpacity
            style={styles.showButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.showButtonText}>
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </Text>
          </TouchableOpacity>
        </View>

        {strength && (
          <View style={styles.strengthContainer}>
            <View style={[styles.strengthBar, { backgroundColor: strength.color, width: `${Math.min(password.length * 10, 100)}%` }]} />
            <Text style={[styles.strengthText, { color: strength.color }]}>{strength.text}</Text>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.nextButton, password.length < 8 && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={password.length < 8}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  showButton: {
    padding: 16,
  },
  showButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  strengthContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    backgroundColor: '#333',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 8,
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
