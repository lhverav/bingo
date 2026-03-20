import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles, spacing } from '@/constants/authStyles';
import AuthButton from '@/components/auth/AuthButton';
import ProgressBar from '@/components/auth/ProgressBar';
import { useRegistration } from '@/contexts/RegistrationContext';

export default function NotificationsScreen() {
  const { clearData } = useRegistration();

  const handleActivate = async () => {
    console.log("📱 handleActivate called");
    // TODO: Request notification permissions
    // import * as Notifications from 'expo-notifications';
    // await Notifications.requestPermissionsAsync();

    // Clear registration context
    clearData();
    console.log("📱 clearData done, navigating to tabs");

    // Navigate to app tabs
    router.replace('/(tabs)/proximos-juegos');
    console.log("📱 Navigation to tabs executed");
  };

  const handleSkip = () => {
    console.log("📱 handleSkip called");
    // Clear registration context
    clearData();
    console.log("📱 clearData done, navigating to tabs");

    // Navigate to app tabs
    router.replace('/(tabs)/proximos-juegos');
    console.log("📱 Navigation to tabs executed");
  };

  return (
    <ScrollView style={formStyles.container}>
      <ProgressBar step={5} total={5} />
      <View style={formStyles.content}>
        <Text style={formStyles.title}>Activar las notificaciones</Text>
        <Text style={formStyles.subtitle}>
          Recibe alertas cuando haya nuevas rondas disponibles.
        </Text>

        <View style={{ marginTop: spacing.xxxl, gap: spacing.md }}>
          <AuthButton variant="primary" onPress={handleActivate}>
            Activar las notificaciones
          </AuthButton>

          <AuthButton variant="secondary" onPress={handleSkip}>
            Ahora no
          </AuthButton>
        </View>
      </View>
    </ScrollView>
  );
}
