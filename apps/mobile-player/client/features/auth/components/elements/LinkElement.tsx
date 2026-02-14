import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { LinkElement as LinkElementType } from '../../types/authflow.types';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { resolvePassParams } from '../../utils/screenResolver';
import { handleGoogleOAuth, handleFacebookOAuth, useGoogleAuth } from '../../handlers/oauthHandler';
import { checkEmailExists } from '../../handlers/authApi';
import { authStyles } from '../../styles/theme';

interface Props extends LinkElementType {
  params?: Record<string, any>;
}

export function LinkElementComponent({
  label,
  screenRef,
  navigateTo,
  action,
  onComplete,
  params = {},
}: Props) {
  const { navigateTo: navigate, goBack, context, setContext, resolveScreenRef } = useAuthFlow();
  const [loading, setLoading] = useState(false);

  // Google auth hook (only used if action is GOOGLE_OAUTH)
  const { promptAsync } = useGoogleAuth();

  const handleOAuthComplete = async (email: string) => {
    if (!onComplete) return;

    // Store email in context
    setContext('oauth_email', email);

    // Check condition
    if (onComplete.condition === 'email_exists_as_email_account') {
      const exists = await checkEmailExists(email);
      const target = exists ? onComplete.true : onComplete.false;

      const targetScreen = resolveScreenRef(target.screenRef);
      if (targetScreen) {
        const resolvedParams = resolvePassParams(target.passParams, { ...context, oauth_email: email });
        navigate(targetScreen, resolvedParams);
      }
    }
  };

  const handlePress = async () => {
    if (loading) return;

    // Handle OAuth actions
    if (action === 'GOOGLE_OAUTH') {
      setLoading(true);
      try {
        const result = await handleGoogleOAuth(promptAsync);
        if (result.success && result.email) {
          await handleOAuthComplete(result.email);
        } else if (result.error) {
          Alert.alert('Error', result.error);
        }
      } catch (error) {
        Alert.alert('Error', 'Error al conectar con Google');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (action === 'FACEBOOK_OAUTH') {
      setLoading(true);
      try {
        const result = await handleFacebookOAuth();
        if (result.success && result.email) {
          await handleOAuthComplete(result.email);
        } else if (result.error) {
          Alert.alert('Error', result.error);
        }
      } catch (error) {
        Alert.alert('Error', 'Error al conectar con Facebook');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Handle navigation
    if (navigateTo === 'BACK') {
      goBack();
      return;
    }

    if (screenRef) {
      const targetScreen = resolveScreenRef(screenRef);
      if (targetScreen) {
        navigate(targetScreen);
      }
    }
  };

  return (
    <TouchableOpacity
      style={authStyles.link}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <Text style={[authStyles.linkText, loading && { opacity: 0.5 }]}>
        {loading ? 'Cargando...' : label}
      </Text>
    </TouchableOpacity>
  );
}
