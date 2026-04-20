import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/constants/authStyles';
import { AuthMethod } from '@/api/auth';

interface EmailExistsModalProps {
  visible: boolean;
  email: string;
  authMethod: AuthMethod;
  onLogin: () => void;
  onClose: () => void;
}

// Get display text for auth method
function getAuthMethodText(method: AuthMethod): string {
  switch (method) {
    case 'google':
      return 'Google';
    case 'facebook':
      return 'Facebook';
    case 'apple':
      return 'Apple';
    case 'phone':
      return 'telefono';
    case 'email':
    default:
      return 'email y contrasena';
  }
}

// Get button text for auth method
function getLoginButtonText(method: AuthMethod): string {
  switch (method) {
    case 'google':
      return 'Continuar con Google';
    case 'facebook':
      return 'Continuar con Facebook';
    case 'apple':
      return 'Continuar con Apple';
    case 'phone':
      return 'Iniciar sesion con telefono';
    case 'email':
    default:
      return 'Iniciar sesion con email';
  }
}

export default function EmailExistsModal({
  visible,
  email,
  authMethod,
  onLogin,
  onClose,
}: EmailExistsModalProps) {
  const methodText = getAuthMethodText(authMethod);
  const buttonText = getLoginButtonText(authMethod);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Esta cuenta ya existe</Text>

          <Text style={styles.subtitle}>
            El email <Text style={styles.emailText}>{email}</Text> ya esta registrado con {methodText}.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={onLogin}>
            <Text style={styles.primaryButtonText}>{buttonText}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Usar otro email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  emailText: {
    color: colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    color: colors.textDark,
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});
