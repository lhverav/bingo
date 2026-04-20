/**
 * OAuth Callback Screen
 *
 * This screen is opened when the deep link bingo-player://oauth-callback is triggered
 * after successful Google OAuth authentication.
 *
 * Integration with auth flow:
 * - For NEW users: Initialize AuthFlowContext at birthdate step and continue profile flow
 * - For RETURNING users: Log them in directly with AuthContext
 * - For EMAIL CONFLICT: Show modal to login or link accounts
 */

import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthFlow } from "@/contexts/AuthFlowContext";
import { checkOAuthUser, linkOAuthToAccount } from "@/api/auth";
import OAuthConflictModal from "@/components/auth/OAuthConflictModal";

type ScreenState = 'loading' | 'error' | 'conflict' | 'success';

interface ConflictData {
  email: string;
  existingMethod: 'email' | 'phone';
  googleId: string;
}

export default function OAuthCallbackScreen() {
  const { email, name, googleId, error } = useLocalSearchParams();
  const { login } = useAuth();
  const { initializeFlowAt } = useAuthFlow();

  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);

  useEffect(() => {
    console.log("OAuth Callback Screen Mounted");
    console.log("Parameters:", { email, name, googleId, error });

    if (error) {
      console.error("OAuth Error:", error);
      setScreenState('error');
      setTimeout(() => {
        router.replace("/(auth)/register/hub");
      }, 3000);
      return;
    }

    if (email && name && googleId) {
      console.log("OAuth Success - User data received");
      handleOAuthSuccess(
        String(email),
        String(name),
        String(googleId)
      );
    } else {
      console.warn("Missing OAuth parameters");
      setScreenState('error');
      setTimeout(() => {
        router.replace("/(auth)/register/hub");
      }, 3000);
    }
  }, [email, name, googleId, error]);

  const handleOAuthSuccess = async (
    emailStr: string,
    nameStr: string,
    googleIdStr: string
  ) => {
    try {
      // Check if user exists in backend
      const result = await checkOAuthUser('google', googleIdStr, emailStr, nameStr);

      if (result.user) {
        // Returning OAuth user - log them in directly
        setScreenState('success');
        await login(result.user.user, result.user.token, result.user.expiresAt);
        console.log("User logged in with OAuth");
        setTimeout(() => {
          router.replace("/");
        }, 1500);
      } else if (result.emailExistsWithDifferentMethod) {
        // Email exists but registered via different method (email/password or phone)
        console.log("Email conflict detected:", result.existingMethod);
        setConflictData({
          email: result.email || emailStr,
          existingMethod: result.existingMethod || 'email',
          googleId: googleIdStr,
        });
        setScreenState('conflict');
      } else if (result.isNewUser) {
        // New user - initialize AuthFlow at birthdate step
        setScreenState('success');
        initializeFlowAt('register', 'google', 0, {
          oauthEmail: emailStr,
          oauthProvider: "google",
          oauthId: googleIdStr,
          suggestedName: nameStr,
        });

        console.log("New user - redirecting to profile completion");
        setTimeout(() => {
          router.replace("/(auth)/profile/birthdate");
        }, 1500);
      }
    } catch (err) {
      console.error("OAuth check failed:", err);
      setScreenState('error');
      setTimeout(() => {
        router.replace("/(auth)/register/hub");
      }, 2000);
    }
  };

  const handleLoginWithEmail = () => {
    // Redirect to email login screen with pre-filled email
    if (conflictData?.email) {
      router.replace(`/(auth)/login/email?prefillEmail=${encodeURIComponent(conflictData.email)}`);
    } else {
      router.replace("/(auth)/login/email");
    }
  };

  const handleLinkAccount = async (password: string) => {
    if (!conflictData) return;

    // Link Google OAuth to existing account
    const result = await linkOAuthToAccount(
      conflictData.email,
      password,
      'google',
      conflictData.googleId
    );

    // Login with the linked account
    await login(result.user, result.token, result.expiresAt);
    console.log("Account linked and logged in");
    router.replace("/");
  };

  const handleCloseConflict = () => {
    // Go back to register hub
    router.replace("/(auth)/register/hub");
  };

  return (
    <View style={styles.container}>
      {screenState === 'error' ? (
        <>
          <Text style={styles.errorIcon}>X</Text>
          <Text style={styles.title}>Error de Autenticacion</Text>
          <Text style={styles.message}>{String(error || 'Error desconocido')}</Text>
          <Text style={styles.subtext}>Redirigiendo...</Text>
        </>
      ) : screenState === 'conflict' && conflictData ? (
        <>
          <Text style={styles.title}>Cuenta Encontrada</Text>
          <Text style={styles.message}>{conflictData.email}</Text>
          <OAuthConflictModal
            visible={true}
            email={conflictData.email}
            existingMethod={conflictData.existingMethod}
            oauthProvider="google"
            oauthProviderId={conflictData.googleId}
            onLoginWithEmail={handleLoginWithEmail}
            onLinkAccount={handleLinkAccount}
            onClose={handleCloseConflict}
          />
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.title}>
            {screenState === 'success' ? 'Autenticacion Exitosa!' : 'Procesando...'}
          </Text>
          <Text style={styles.message}>Bienvenido, {name}</Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.subtext}>
            {screenState === 'success' ? 'Redirigiendo...' : 'Verificando cuenta...'}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    padding: 20,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
    color: '#ff4444',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 18,
    color: "#FFD700",
    marginBottom: 10,
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 20,
  },
  subtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 20,
  },
});
