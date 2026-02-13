import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { router } from 'expo-router';

export default function NotificationsScreen() {
  const { state, getTotalSteps } = useAuthFlow();
  const steps = getTotalSteps();
  const currentStepNumber = state.currentStep + 1;

  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);

    try {
      // TODO: Request actual push notification permissions
      // For Expo, use expo-notifications:
      // import * as Notifications from 'expo-notifications';
      // const { status } = await Notifications.requestPermissionsAsync();

      console.log('Requesting notification permissions...');

      // Simulate permission request
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Navigate to home after enabling
      completeRegistration();
    } catch (error) {
      console.error('Error requesting notifications:', error);
      // Still navigate to home even if permissions fail
      completeRegistration();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    completeRegistration();
  };

  const completeRegistration = () => {
    console.log('Registration complete with data:', state.data);
    // Navigate to home - the context will be reset when entering auth flow again
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStepNumber / steps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Paso {currentStepNumber} de {steps}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.bellIcon}>🔔</Text>
        </View>

        <Text style={styles.title}>Activa las notificaciones</Text>
        <Text style={styles.subtitle}>
          Recibe alertas cuando comience una nueva ronda de bingo, cuando ganes premios y más.
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>🎯</Text>
            <Text style={styles.benefitText}>
              Sé el primero en unirte a nuevas rondas
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>🏆</Text>
            <Text style={styles.benefitText}>
              Recibe alertas de premios y promociones
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>📢</Text>
            <Text style={styles.benefitText}>
              Entérate cuando extraigan números
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.enableButton}
          onPress={handleEnableNotifications}
          disabled={isRequesting}
        >
          <Text style={styles.enableButtonText}>
            {isRequesting ? 'Activando...' : 'Activar notificaciones'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isRequesting}
        >
          <Text style={styles.skipButtonText}>Ahora no</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Puedes cambiar esto más tarde en la configuración de tu dispositivo.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  progressContainer: {
    padding: 20,
    paddingTop: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#3a3a5e',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a4e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  bellIcon: {
    fontSize: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 30,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2a2a4e',
    padding: 16,
    borderRadius: 8,
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  enableButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
  },
  enableButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  skipButtonText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
});
