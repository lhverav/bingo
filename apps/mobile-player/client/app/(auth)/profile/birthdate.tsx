import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formStyles, colors, spacing } from '@/constants/authStyles';
import AuthButton from '@/components/auth/AuthButton';
import ProgressBar from '@/components/auth/ProgressBar';
import { useRegistration } from '@/contexts/RegistrationContext';

export default function BirthdateScreen() {
  const { updateData } = useRegistration();
  const [date, setDate] = useState<Date>(new Date(2000, 0, 1)); // Default to Jan 1, 2000
  const [showPicker, setShowPicker] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (d: Date): string => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatForStorage = (d: Date): string => {
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      setHasSelected(true);
      setError('');
    }
  };

  const handleNext = () => {
    if (!hasSelected) {
      setError('Por favor selecciona tu fecha de nacimiento');
      return;
    }

    const age = calculateAge(date);
    if (age < 18) {
      setError('Debes ser mayor de 18 años para jugar');
      return;
    }

    // Store in context
    updateData({ birthdate: formatForStorage(date) });

    // Navigate to gender screen
    router.push('/(auth)/profile/gender');
  };

  // Calculate min and max dates
  const maxDate = new Date(); // Today (can't be born in the future)
  const minDate = new Date(1920, 0, 1); // Allow dates from 1920

  return (
    <ScrollView style={formStyles.container}>
      <ProgressBar step={1} total={5} />
      <View style={formStyles.content}>
        <Text style={formStyles.title}>¿Cuál es tu fecha de nacimiento?</Text>
        <Text style={formStyles.subtitle}>
          Necesitas tener al menos 18 años para jugar.
        </Text>

        {/* Date Display Button */}
        <TouchableOpacity
          style={[styles.dateButton, error ? styles.dateButtonError : null]}
          onPress={() => setShowPicker(true)}
        >
          <Text style={[styles.dateButtonText, !hasSelected && styles.dateButtonPlaceholder]}>
            {hasSelected ? formatDate(date) : 'Seleccionar fecha'}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {hasSelected && (
          <Text style={styles.ageText}>
            Edad: {calculateAge(date)} años
          </Text>
        )}

        {/* Date Picker */}
        {showPicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={maxDate}
              minimumDate={minDate}
              locale="es"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.doneButtonText}>Listo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <AuthButton onPress={handleNext}>Siguiente</AuthButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  dateButtonError: {
    borderColor: '#e74c3c',
  },
  dateButtonText: {
    fontSize: 18,
    color: colors.text,
  },
  dateButtonPlaceholder: {
    color: colors.textMuted,
  },
  calendarIcon: {
    fontSize: 24,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: spacing.sm,
  },
  ageText: {
    color: colors.primary,
    fontSize: 16,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  pickerContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  doneButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
