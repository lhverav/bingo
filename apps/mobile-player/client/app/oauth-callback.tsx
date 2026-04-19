/**
 * OAuth Callback Screen
 *
 * This screen is opened when the deep link bingo-player://oauth-callback is triggered
 * after successful Google OAuth authentication.
 *
 * Integration with auth flow:
 * - For NEW users: Initialize AuthFlowContext at birthdate step and continue profile flow
 * - For RETURNING users: Log them in directly with AuthContext
 */

import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthFlow } from "@/contexts/AuthFlowContext";
import { checkOAuthUser } from "@/api/auth";

export default function OAuthCallbackScreen() {
  const { email, name, googleId, error } = useLocalSearchParams();
  const { login } = useAuth();
  const { initializeFlowAt } = useAuthFlow();

  useEffect(() => {
    console.log("🎯 OAuth Callback Screen Mounted");
    console.log("Parameters:", { email, name, googleId, error });

    if (error) {
      console.error("OAuth Error:", error);
      setTimeout(() => {
        router.replace("/(auth)/register/hub");
      }, 3000);
      return;
    }

    if (email && name && googleId) {
      console.log("✅ OAuth Success - User data received");

      handleOAuthSuccess(
        String(email),
        String(name),
        String(googleId)
      );
    } else {
      console.warn("Missing OAuth parameters");
      setTimeout(() => {
        router.replace("/(auth)/register/hub");
      }, 3000);
    }
  }, [email, name, googleId, error]);

  const handleOAuthSuccess = async (
    email: string,
    name: string,
    googleId: string
  ) => {
    try {
      // Check if user exists in backend
      const result = await checkOAuthUser('google', googleId, email, name);

      if (result.user) {
        // Returning user - log them in directly
        await login(result.user.user, result.user.token, result.user.expiresAt);
        console.log("✅ User logged in with OAuth");
        setTimeout(() => {
          // Navigate to root - auth guard will redirect to tabs with clean stack
          router.replace("/");
        }, 1500);
      } else if (result.isNewUser) {
        // New user - initialize AuthFlow at birthdate step (index 1 in register:google)
        // This allows profile screens to use nextStep() properly
        initializeFlowAt('register', 'google', 1, {
          oauthEmail: email,
          oauthProvider: "google",
          oauthId: googleId,
          suggestedName: name,
        });

        console.log("📝 New user - redirecting to profile completion");
        setTimeout(() => {
          router.replace("/(auth)/profile/birthdate");
        }, 1500);
      }
    } catch (err) {
      console.error("OAuth check failed:", err);
      setTimeout(() => {
        router.replace("/(auth)/register/hub");
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.title}>Error de Autenticación</Text>
          <Text style={styles.message}>{String(error)}</Text>
          <Text style={styles.subtext}>Redirigiendo...</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.title}>¡Autenticación Exitosa!</Text>
          <Text style={styles.message}>Bienvenido, {name}</Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.subtext}>Procesando...</Text>
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
