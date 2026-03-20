import { Redirect } from 'expo-router';

/**
 * Default tab redirect - go to Proximos Juegos
 */
export default function TabsIndex() {
  return <Redirect href="/(tabs)/proximos-juegos" />;
}
