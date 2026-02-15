import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles, spacing } from '@/constants/authStyles';
import AuthButton from '@/components/auth/AuthButton';
import ProgressBar from '@/components/auth/ProgressBar';
import { useRegistration } from '@/contexts/RegistrationContext';

export default function NotificationsScreen() {
  const { clearData } = useRegistration();

  const handleActivate = async () => {
    // TODO: Request notification permissions
    // import * as Notifications from 'expo-notifications';
    // await Notifications.requestPermissionsAsync();

    // Clear registration context
    clearData();

    // Navigate to app home
    router.replace('/');
  };

  const handleSkip = () => {
    // Clear registration context
    clearData();

    // Navigate to app home
    router.replace('/');
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
