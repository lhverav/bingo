import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { ButtonElement as ButtonElementType } from '../../types/authflow.types';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { resolvePassParams } from '../../utils/screenResolver';
import { authStyles, colors } from '../../styles/theme';

interface Props extends ButtonElementType {
  params?: Record<string, any>;
  onBeforeNavigate?: () => Promise<boolean>;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function ButtonElementComponent({
  label,
  screen,
  screenRef,
  navigateTo,
  passParams,
  params = {},
  onBeforeNavigate,
  loading = false,
  disabled = false,
  variant = 'primary',
}: Props) {
  const { navigateTo: navigate, goBack, exitToHome, context, resolveScreenRef } = useAuthFlow();

  const handlePress = async () => {
    if (loading || disabled) return;

    // Call before navigate hook if provided
    if (onBeforeNavigate) {
      const shouldContinue = await onBeforeNavigate();
      if (!shouldContinue) return;
    }

    // Handle navigation
    if (navigateTo === 'APP_HOME') {
      exitToHome();
      return;
    }

    if (navigateTo === 'BACK') {
      goBack();
      return;
    }

    if (screenRef) {
      const targetScreen = resolveScreenRef(screenRef);
      if (targetScreen) {
        const resolvedParams = resolvePassParams(passParams, context);
        navigate(targetScreen, resolvedParams);
      }
      return;
    }

    if (screen) {
      const resolvedParams = resolvePassParams(passParams, context);
      navigate(screen, resolvedParams);
    }
  };

  const buttonStyle = [
    authStyles.button,
    variant === 'secondary' && authStyles.buttonSecondary,
    disabled && { opacity: 0.5 },
  ];

  const textStyle = [
    authStyles.buttonText,
    variant === 'secondary' && authStyles.buttonSecondaryText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={loading || disabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.text : colors.textSecondary} />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
