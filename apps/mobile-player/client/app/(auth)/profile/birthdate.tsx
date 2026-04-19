import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/authStyles';
import { useAuthFlow } from '@/contexts/AuthFlowContext';
import AuthScreenTemplate from '@/components/auth/AuthScreenTemplate';
import DateScrollPicker from '@/components/auth/DateScrollPicker';

export default function BirthdateScreen() {
  const { updateData, nextStep } = useAuthFlow();
  const [dateValue, setDateValue] = useState({ day: 15, month: 6, year: 1995 });
  const [error, setError] = useState('');

  const calculateAge = (day: number, month: number, year: number): number => {
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatForStorage = (day: number, month: number, year: number): string => {
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (newDate: { day: number; month: number; year: number }) => {
    setDateValue(newDate);
    setError('');
  };

  const handleSubmit = () => {
    const age = calculateAge(dateValue.day, dateValue.month, dateValue.year);

    if (age < 18) {
      setError('Debes ser mayor de 18 años para jugar');
      return;
    }

    // Store in context and navigate to next step
    updateData({ birthdate: formatForStorage(dateValue.day, dateValue.month, dateValue.year) });
    nextStep();
  };

  const age = calculateAge(dateValue.day, dateValue.month, dateValue.year);

  return (
    <AuthScreenTemplate
      title="¿Cuál es tu fecha de nacimiento?"
      subtitle="Necesitas tener al menos 18 años para jugar."
      onSubmit={handleSubmit}
      buttonDisabled={false}
    >
      <View style={styles.content}>
        <DateScrollPicker
          value={dateValue}
          onChange={handleDateChange}
        />

        {/* Age display */}
        <View style={styles.ageContainer}>
          <Text style={[styles.ageText, age < 18 && styles.ageTextError]}>
            Edad: {age} años
          </Text>
        </View>

        {/* Error message */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    </AuthScreenTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: spacing.lg,
  },
  ageContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  ageText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  ageTextError: {
    color: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
