import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles, entryStyles, spacing } from '@/constants/authStyles';
import AuthButton from '@/components/auth/AuthButton';

export default function RegisterHubScreen() {
  return (
    <ScrollView style={formStyles.container}>
      <View style={formStyles.content}>
        <Text style={formStyles.title}>Regístrate para empezar a jugar</Text>
        <Text style={formStyles.subtitle}>
          Elige tu método de registro preferido
        </Text>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {/* Email Registration */}
          <AuthButton
            variant="primary"
            onPress={() => router.push('/(auth)/register/email')}
          >
            Continuar con tu email
          </AuthButton>

          {/* Phone Registration */}
          <AuthButton
            variant="outline"
            onPress={() => router.push('/(auth)/register/phone')}
          >
            Continuar con número de teléfono
          </AuthButton>

          {/* Google OAuth Registration */}
          <AuthButton
            variant="outline"
            onPress={() => router.push('/(auth)/register/google-selector')}
          >
            Continuar con Google
          </AuthButton>
        </View>

        {/* Link to Login */}
        <View style={[entryStyles.loginContainer, { marginTop: spacing.xxxl }]}>
          <Text style={entryStyles.loginText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login/hub')}>
            <Text style={entryStyles.loginLink}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
