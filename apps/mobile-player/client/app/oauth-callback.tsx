/**
 * OAuth Callback Screen
 *
 * This screen is opened when the deep link bingo-player://oauth-callback is triggered
 * after successful Google OAuth authentication
 */

import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function OAuthCallbackScreen() {
  const { email, name, googleId, error } = useLocalSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    console.log("🎯 OAuth Callback Screen Mounted");
    console.log("Parameters:", { email, name, googleId, error });

    if (error) {
      console.error("OAuth Error:", error);
      // TODO: Show error message and redirect to login
      setTimeout(() => {
        router.replace("/");
      }, 3000);
      return;
    }

    if (email && name && googleId) {
      console.log("✅ OAuth Success - User data received");

      // TODO: Send this data to your backend to create/login user
      // For now, we'll just create a mock user object
      const user = {
        id: String(googleId),
        email: String(email),
        name: String(name),
        // Add other required User fields
        birthdate: "", // These would come from your backend
        gender: "",
        createdAt: new Date().toISOString(),
      };

      const mockToken = "mock-jwt-token"; // This should come from your backend

      // Log the user in
      login(user, mockToken)
        .then(() => {
          console.log("✅ User logged in with OAuth");
          // Redirect to home screen
          setTimeout(() => {
            router.replace("/");
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to login:", err);
        });
    } else {
      console.warn("Missing OAuth parameters");
      setTimeout(() => {
        router.replace("/");
      }, 3000);
    }
  }, [email, name, googleId, error]);

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
          <Text style={styles.subtext}>Redirigiendo a la aplicación...</Text>
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
