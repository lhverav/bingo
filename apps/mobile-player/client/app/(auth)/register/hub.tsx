import { View, Text, TouchableOpacity, BackHandler } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hubStyles, entryStyles, spacing } from '@/constants/authStyles';
import { useAuthFlow } from '@/contexts/AuthFlowContext';
import AuthButton from '@/components/auth/AuthButton';
import BackButton from '@/components/auth/BackButton';

export default function RegisterHubScreen() {
  const { startFlow } = useAuthFlow();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.replace('/(auth)');
  };

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const handleEmailRegister = () => {
    startFlow('register', 'email');
  };

  const handlePhoneRegister = () => {
    startFlow('register', 'phone');
  };

  const handleGoogleRegister = () => {
    startFlow('register', 'google');
  };

  return (
    <View style={hubStyles.container}>
      {/* Back Button */}
      <BackButton onPress={handleBack} />

      {/* Center Content - Logo, Title & Buttons */}
      <View style={hubStyles.centerContent}>
        {/* Logo */}
        <View style={hubStyles.logoContainer}>
          <Text style={entryStyles.logo}>BINGOTE</Text>
          <Text style={entryStyles.logoSub}>DE ORO</Text>
        </View>

        {/* Title */}
        <Text style={hubStyles.title}>Regístrate para{'\n'}empezar a jugar</Text>

        {/* Auth Buttons */}
        <View style={hubStyles.buttonsContainer}>
          <AuthButton variant="primary" onPress={handleEmailRegister}>
            Continuar con tu email
          </AuthButton>

          <AuthButton variant="outline" onPress={handlePhoneRegister}>
            Continuar con número de teléfono
          </AuthButton>

          <AuthButton variant="outline" onPress={handleGoogleRegister}>
            Continuar con Google
          </AuthButton>
        </View>
      </View>

      {/* Bottom Link */}
      <View style={[hubStyles.bottomLink, { paddingBottom: insets.bottom + spacing.xxxl }]}>
        <Text style={entryStyles.loginText}>¿Ya tienes cuenta? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login/hub')}>
          <Text style={entryStyles.loginLink}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
