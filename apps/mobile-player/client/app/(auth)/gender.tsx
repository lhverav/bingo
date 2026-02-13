import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useAuthFlow } from '../../contexts/AuthFlowContext';

type GenderOption = 'femenino' | 'masculino' | 'no_binario' | 'otro' | 'prefiero_no_decir';

interface GenderChoice {
  value: GenderOption;
  label: string;
}

const GENDER_OPTIONS: GenderChoice[] = [
  { value: 'femenino', label: 'Femenino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'no_binario', label: 'No binario' },
  { value: 'otro', label: 'Otro' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
];

export default function GenderScreen() {
  const { state, updateData, nextStep, getTotalSteps } = useAuthFlow();
  const steps = getTotalSteps();
  const currentStepNumber = state.currentStep + 1;

  const [selected, setSelected] = useState<GenderOption | null>(
    (state.data.gender as GenderOption) || null
  );

  const handleSelect = (value: GenderOption) => {
    setSelected(value);
  };

  const handleNext = () => {
    if (!selected) return;
    updateData({ gender: selected });
    nextStep();
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStepNumber / steps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Paso {currentStepNumber} de {steps}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>¿Cuál es tu género?</Text>
        <Text style={styles.subtitle}>
          Esto nos ayuda a personalizar tu experiencia.
        </Text>

        <View style={styles.optionsContainer}>
          {GENDER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                selected === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => handleSelect(option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  selected === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
              {selected === option.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, !selected && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selected}
        >
          <Text style={styles.nextButtonText}>Siguiente</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a5e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#2a2a4e',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#FFD700',
    fontWeight: '600',
  },
  checkmark: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
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
