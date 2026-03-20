import { useEffect } from "react";
import { router } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Legacy home screen - redirects to the new tab navigation
 */
export default function HomeScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        // Redirect to tabs
        router.replace("/(tabs)/proximos-juegos");
      } else {
        // Redirect to auth
        router.replace("/(auth)");
      }
    }
  }, [isAuthenticated, authLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFD700" />
      <Text style={styles.text}>Cargando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
