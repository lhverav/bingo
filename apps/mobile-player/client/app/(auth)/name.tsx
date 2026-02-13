import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthFlow } from '../../contexts/AuthFlowContext';

export default function NameScreen() {
  const { state, updateData, nextStep, getTotalSteps } = useAuthFlow();
  const steps = getTotalSteps();
  const currentStepNumber = state.currentStep + 1;

  // Suggest name from email (part before @) or use existing
  const suggestName = () => {
    if (state.data.name) return state.data.name;
    if (state.data.email) {
      const emailPart = state.data.email.split('@')[0];
      // Capitalize first letter, remove numbers/special chars
      const cleanName = emailPart.replace(/[0-9_.-]/g, ' ').trim();
      if (cleanName) {
        return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }
    }
    return '';
  };

  const [name, setName] = useState(suggestName());
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!name.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    if (name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    setError(null);
    updateData({ name: name.trim() });
    nextStep();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStepNumber / steps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Paso {currentStepNumber} de {steps}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>¿Cómo te llamas?</Text>
        <Text style={styles.subtitle}>
          Este nombre aparecerá en tu perfil.
        </Text>

        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Tu nombre"
          placeholderTextColor="#888"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          autoFocus
          autoCapitalize="words"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {state.data.email && name === suggestName() && (
          <Text style={styles.hintText}>
            Sugerido desde tu email. Puedes cambiarlo.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.nextButton, !name.trim() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!name.trim()}
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
    flex: 1,
    padding: 20,
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
  input: {
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
  hintText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
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
