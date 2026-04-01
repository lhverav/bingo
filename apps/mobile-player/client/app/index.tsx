import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts';

/**
 * Root Navigation Guard
 *
 * This is the entry point of the app. It checks authentication state
 * and redirects to the appropriate flow:
 * - Authenticated users -> Main app (tabs)
 * - Non-authenticated users -> Auth flow
 *
 * This ensures auth and app flows are completely isolated.
 */
export default function RootIndex() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/proximos-juegos" />;
  }

  return <Redirect href="/(auth)" />;
}
