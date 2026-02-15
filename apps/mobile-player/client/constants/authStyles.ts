/**
 * Auth Flow Styles
 *
 * Theme: Dark mode with Gold accents
 * - Background: Dark navy (#1a1a2e)
 * - Primary: Gold (#FFD700)
 * - Text: White (#fff)
 */

import { StyleSheet } from 'react-native';

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Backgrounds
  background: '#1a1a2e',           // Dark navy - main background
  backgroundSecondary: '#2a2a4e',  // Slightly lighter - inputs, cards

  // Primary brand
  primary: '#FFD700',              // Gold - buttons, accents, logo

  // Borders
  border: '#3a3a5e',               // Border color for inputs
  borderSelected: '#FFD700',       // Selected state border (gold)

  // Text
  text: '#fff',                    // Primary text (white)
  textSecondary: '#888',           // Secondary text, placeholders
  textDark: '#1a1a2e',             // Text on gold buttons

  // States
  error: '#e74c3c',                // Error red
  disabled: '#555',                // Disabled button background

  // Utility
  transparent: 'transparent',
};

// =============================================================================
// SPACING & SIZING
// =============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 30,
  xxxl: 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 25,  // Pill buttons
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 28,
  logo: 42,
};

// =============================================================================
// SCREEN STYLES
// =============================================================================

export const screenStyles = StyleSheet.create({
  // Main container - dark background
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Content wrapper with padding
  content: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
  },
});

// =============================================================================
// ENTRY SCREEN (Bingote de Oro welcome)
// =============================================================================

export const entryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },

  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },

  logo: {
    fontSize: fontSize.logo,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 4,
  },

  logoSub: {
    fontSize: fontSize.xl,
    fontWeight: '300',
    color: colors.primary,
    letterSpacing: 8,
  },

  welcomeText: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },

  buttonsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },

  // Primary gold button
  registerButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },

  registerButtonText: {
    color: colors.textDark,
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },

  // OAuth buttons (transparent with white border)
  oauthButton: {
    backgroundColor: colors.transparent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.text,
  },

  oauthButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // Login link row
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },

  loginText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },

  loginLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Guest mode link
  guestButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  guestButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textDecorationLine: 'underline',
  },
});

// =============================================================================
// FORM SCREEN STYLES (Email, Password, etc.)
// =============================================================================

export const formStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
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
    marginBottom: spacing.xxl,
  },

  // Input field
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

  // Next button
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },

  nextButtonDisabled: {
    backgroundColor: colors.disabled,
  },

  nextButtonText: {
    color: colors.textDark,
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
});

// =============================================================================
// PROGRESS BAR
// =============================================================================

export const progressStyles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: 10,
  },

  bar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },

  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  text: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});

// =============================================================================
// OPTION BUTTONS (Gender, etc.)
// =============================================================================

export const optionStyles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },

  button: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  buttonSelected: {
    borderColor: colors.primary,
  },

  text: {
    color: colors.text,
    fontSize: fontSize.md,
  },

  textSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  checkmark: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
});
