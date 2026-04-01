import { Redirect } from "expo-router";

/**
 * Legacy home screen - redirects to root navigation guard
 * The root index.tsx will handle auth state and redirect appropriately
 */
export default function HomeScreen() {
  return <Redirect href="/" />;
}
