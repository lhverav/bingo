import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '@/constants/authStyles';

interface AuthInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  inputType?: 'email' | 'password' | 'phone' | 'text';
}

export default function AuthInput({
  value,
  onChangeText,
  error,
  inputType = 'text',
  ...rest
}: AuthInputProps) {
  const getKeyboardType = () => {
    switch (inputType) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={inputType === 'password'}
        keyboardType={getKeyboardType()}
        autoCapitalize={inputType === 'email' ? 'none' : 'sentences'}
        {...rest}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },

  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },

  inputError: {
    borderColor: colors.error,
  },

  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
  },
});
