import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/constants/authStyles';

interface OAuthConflictModalProps {
  visible: boolean;
  email: string;
  existingMethod: 'email' | 'phone';
  oauthProvider: 'google' | 'facebook' | 'apple';
  oauthProviderId: string;
  onLoginWithEmail: () => void;
  onLinkAccount: (password: string) => Promise<void>;
  onClose: () => void;
}

export default function OAuthConflictModal({
  visible,
  email,
  existingMethod,
  oauthProvider,
  oauthProviderId,
  onLoginWithEmail,
  onLinkAccount,
  onClose,
}: OAuthConflictModalProps) {
  const [mode, setMode] = useState<'choice' | 'link'>('choice');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkAccount = async () => {
    if (!password.trim()) {
      setError('Ingresa tu contraseña');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onLinkAccount(password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al vincular cuenta';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode('choice');
    setPassword('');
    setError(null);
    onClose();
  };

  const providerName = oauthProvider === 'google' ? 'Google' : oauthProvider;

  // If registered with phone, can only login with phone (no password to link)
  const canLinkAccount = existingMethod === 'email';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modal}>
          {mode === 'choice' ? (
            <>
              <Text style={styles.title}>Esta cuenta ya existe</Text>

              <Text style={styles.subtitle}>
                El email <Text style={styles.emailText}>{email}</Text> ya está
                registrado {existingMethod === 'email' ? 'con contraseña' : 'con teléfono'}.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onLoginWithEmail}
              >
                <Text style={styles.primaryButtonText}>
                  Iniciar sesión con {existingMethod === 'email' ? 'email y contraseña' : 'teléfono'}
                </Text>
              </TouchableOpacity>

              {canLinkAccount && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setMode('link')}
                >
                  <Text style={styles.secondaryButtonText}>
                    Vincular cuenta de {providerName}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Vincular {providerName}</Text>

              <Text style={styles.subtitle}>
                Ingresa tu contraseña actual para vincular tu cuenta de {providerName}.
                Luego podrás iniciar sesión con cualquiera de los dos métodos.
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoFocus
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
                </TouchableOpacity>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleLinkAccount}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textDark} />
                ) : (
                  <Text style={styles.primaryButtonText}>Vincular cuenta</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setMode('choice');
                  setPassword('');
                  setError(null);
                }}
                disabled={loading}
              >
                <Text style={styles.closeButtonText}>Volver</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
  },
  eyeButton: {
    padding: spacing.md,
    paddingRight: spacing.lg,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.textDark,
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: spacing.md,
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});
