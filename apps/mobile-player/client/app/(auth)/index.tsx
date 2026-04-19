import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { entryStyles, colors, spacing } from '@/constants/authStyles';

export default function AuthEntryScreen() {
  const insets = useSafeAreaInsets();

  console.log("🔐 AuthEntryScreen ((auth)/index.tsx) MOUNTED");

  
  return (
    <View style={entryStyles.container}>
      {/* Center Content Area - Logo & Tagline */}
      <View style={entryStyles.centerContent}>
        <View style={entryStyles.logoContainer}>
          <Text style={entryStyles.logo}>BINGOTE</Text>
          <Text style={entryStyles.logoSub}>DE ORO</Text>
        </View>
        <Text style={entryStyles.tagline}>
          Juega bingo en vivo.{'\n'}Gana premios reales.
        </Text>
      </View>

      {/* Bottom Buttons - Fixed at bottom */}
      <View style={[entryStyles.bottomButtons, { paddingBottom: insets.bottom + spacing.xxxl }]}>
        {/* Register Button */}
        <TouchableOpacity
          style={entryStyles.registerButton}
          onPress={() => router.push('/(auth)/register/hub')}
        >
          <Text style={entryStyles.registerButtonText}>Registrarme gratis</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity
          style={entryStyles.loginButton}
          onPress={() => router.push('/(auth)/login/hub')}
        >
          <Text style={entryStyles.loginButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
