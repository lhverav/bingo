import { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '@/constants/authStyles';

interface AuthInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  inputType?: 'email' | 'password' | 'phone' | 'text';
  showPasswordToggle?: boolean;
}

export default function AuthInput({
  value,
  onChangeText,
  error,
  inputType = 'text',
  showPasswordToggle = true,
  ...rest
}: AuthInputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = inputType === 'password';

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
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            isPassword && showPasswordToggle && styles.inputWithToggle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isPassword && !passwordVisible}
          keyboardType={getKeyboardType()}
          autoCapitalize={inputType === 'email' ? 'none' : 'sentences'}
          {...rest}
        />
        {isPassword && showPasswordToggle && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setPasswordVisible(!passwordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.toggleIcon}>
              {passwordVisible ? '👁' : '👁‍🗨'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },

  inputWrapper: {
    position: 'relative',
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

  inputWithToggle: {
    paddingRight: 50,
  },

  inputError: {
    borderColor: colors.error,
  },

  toggleButton: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  toggleIcon: {
    fontSize: 20,
  },

  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
  },
});
