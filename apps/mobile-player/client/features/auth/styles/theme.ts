import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#FFD700',
  primaryDark: '#FFA500',
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#E0E0E0',
  error: '#FF4444',
  success: '#44BB44',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 25,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const authStyles = StyleSheet.create({
  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },

  // Screen title
  screenTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },

  // Elements container
  elementsContainer: {
    flex: 1,
    gap: spacing.md,
  },

  // Button styles
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  buttonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },

  buttonSecondary: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonSecondaryText: {
    color: colors.textSecondary,
  },

  // Input styles
  inputContainer: {
    marginBottom: spacing.sm,
  },

  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  input: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },

  inputFocused: {
    borderColor: colors.primary,
  },

  inputError: {
    borderColor: colors.error,
  },

  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },

  // Radio styles
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  radioOuterSelected: {
    borderColor: colors.primary,
  },

  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  radioLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },

  // Checkbox styles
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  checkboxCheck: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
  },

  checkboxLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },

  // Link styles
  link: {
    paddingVertical: spacing.sm,
  },

  linkText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Text styles
  text: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },

  // List styles
  listContainer: {
    marginVertical: spacing.sm,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },

  listItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  listItemAvatarText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },

  listItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
