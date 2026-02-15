import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '@/constants/authStyles';

interface AuthButtonProps {
  children: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

export default function AuthButton({
  children,
  onPress,
  variant = 'primary',
  disabled = false
}: AuthButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' && styles.primaryText,
          variant === 'secondary' && styles.secondaryText,
          variant === 'outline' && styles.outlineText,
          disabled && styles.disabledText,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primary: {
    backgroundColor: colors.primary,
  },

  secondary: {
    backgroundColor: colors.backgroundSecondary,
  },

  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.text,
  },

  disabled: {
    backgroundColor: colors.disabled,
  },

  text: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },

  primaryText: {
    color: colors.textDark,
  },

  secondaryText: {
    color: colors.text,
  },

  outlineText: {
    color: colors.text,
    fontWeight: '600',
  },

  disabledText: {
    color: colors.textSecondary,
  },
});
