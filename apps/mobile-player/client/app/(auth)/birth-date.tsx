import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { useState } from 'react';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BirthDateScreen() {
  const { state, updateData, nextStep, getTotalSteps } = useAuthFlow();
  const steps = getTotalSteps();
  const currentStepNumber = state.currentStep + 1;

  const [date, setDate] = useState<Date>(() => {
    if (state.data.birthDate) {
      return new Date(state.data.birthDate);
    }
    // Default to 18 years ago
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 18);
    return defaultDate;
  });
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [error, setError] = useState<string | null>(null);

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      setError(null);
    }
  };

  const handleNext = () => {
    const age = calculateAge(date);
    if (age < 13) {
      setError('Debes tener al menos 13 años para registrarte');
      return;
    }
    if (age > 120) {
      setError('Por favor ingresa una fecha válida');
      return;
    }

    setError(null);
    updateData({ birthDate: date.toISOString() });
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
        <Text style={styles.title}>¿Cuál es tu fecha de nacimiento?</Text>
        <Text style={styles.subtitle}>
          Esto no será visible para otros usuarios.
        </Text>

        {Platform.OS === 'android' && (
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
          </TouchableOpacity>
        )}

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            textColor="#fff"
            style={styles.datePicker}
          />
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.ageText}>
          Tendrás {calculateAge(date)} años
        </Text>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
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
  dateButton: {
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a5e',
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  datePicker: {
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 12,
  },
  ageText: {
    color: '#888',
    fontSize: 14,
    marginTop: 15,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
  },
  nextButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
