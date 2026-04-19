import { View, Text, ScrollView, BackHandler } from 'react-native';
import { useEffect } from 'react';
import { formStyles, spacing } from '@/constants/authStyles';
import AuthButton from '@/components/auth/AuthButton';
import ProgressBar from '@/components/auth/ProgressBar';
import { useAuthFlow, useFlowProgress } from '@/contexts/AuthFlowContext';

export default function NotificationsScreen() {
  const { completeFlow } = useAuthFlow();
  const { profileCurrentStep, profileStepCount } = useFlowProgress();

  // Block Android back button - account is already created, no going back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return true to prevent default back behavior
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const handleActivate = async () => {
    console.log("[notifications] Activating notifications");
    // TODO: Request notification permissions
    // import * as Notifications from 'expo-notifications';
    // await Notifications.requestPermissionsAsync();

    completeFlow();
  };

  const handleSkip = () => {
    console.log("[notifications] Skipping notifications");
    completeFlow();
  };

  return (
    <ScrollView style={formStyles.container}>
      <ProgressBar step={profileCurrentStep} total={profileStepCount} />

      {/* No back button - account already created at this point */}

      <View style={[formStyles.content, { paddingTop: spacing.xl }]}>
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
