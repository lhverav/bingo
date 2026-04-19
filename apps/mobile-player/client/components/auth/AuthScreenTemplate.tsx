import { ReactNode, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthFlow, useFlowProgress } from '@/contexts/AuthFlowContext';
import { colors, spacing, fontSize, borderRadius } from '@/constants/authStyles';
import AuthButton from './AuthButton';
import ProgressBar from './ProgressBar';

interface AuthScreenTemplateProps {
  // Content
  title: string;
  subtitle?: string;
  children: ReactNode;

  // Button
  buttonText?: string;
  onSubmit: () => void;
  buttonDisabled?: boolean;
  buttonVariant?: 'primary' | 'secondary' | 'outline';

  // Options
  showProgress?: boolean;
  showBackButton?: boolean;
  loading?: boolean;
  keyboardAvoiding?: boolean;
}

export default function AuthScreenTemplate({
  title,
  subtitle,
  children,
  buttonText = 'Siguiente',
  onSubmit,
  buttonDisabled = false,
  buttonVariant = 'primary',
  showProgress = true,
  showBackButton = true,
  loading = false,
  keyboardAvoiding = true,
}: AuthScreenTemplateProps) {
  const { prevStep, error, setError } = useAuthFlow();
  const { profileCurrentStep, profileStepCount, isProfileStep } = useFlowProgress();
  const insets = useSafeAreaInsets();

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showBackButton) {
        prevStep();
        return true; // Handled
      }
      return false; // Let system handle
    });

    return () => backHandler.remove();
  }, [prevStep, showBackButton]);

  const content = (
    <View style={styles.container}>
      {/* Back button - Fixed position at top */}
      {showBackButton && (
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + spacing.md }]}
          onPress={prevStep}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xxxl + spacing.xl }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress bar - only show for profile steps */}
        {showProgress && isProfileStep && (
          <ProgressBar step={profileCurrentStep} total={profileStepCount} />
        )}

        {/* Content area */}
        <View style={styles.content}>
          {/* Title & Subtitle */}
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => setError(null)}>
                <Text style={styles.errorDismiss}>x</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Screen-specific content */}
          <View style={styles.childrenContainer}>{children}</View>

          {/* Submit button - directly below content */}
          <View style={styles.buttonContainer}>
            <AuthButton
              variant={buttonVariant}
              onPress={onSubmit}
              disabled={buttonDisabled || loading}
            >
              {loading ? 'Cargando...' : buttonText}
            </AuthButton>
          </View>
        </View>
      </ScrollView>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    left: spacing.xl,
    zIndex: 10,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  errorBanner: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    flex: 1,
  },
  errorDismiss: {
    color: colors.error,
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    paddingLeft: spacing.md,
  },
  childrenContainer: {
    // No flex: 1 - button stays directly below content
  },
  buttonContainer: {
    marginTop: spacing.xl,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
