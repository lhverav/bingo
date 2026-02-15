import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { formStyles, entryStyles, spacing } from '@/constants/authStyles';
import AuthButton from '@/components/auth/AuthButton';

export default function LoginHubScreen() {
  return (
    <ScrollView style={formStyles.container}>
      <View style={formStyles.content}>
        <Text style={formStyles.title}>Iniciar sesión en Bingote de Oro</Text>
        <Text style={formStyles.subtitle}>
          Elige tu método de inicio de sesión
        </Text>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {/* Email Login */}
          <AuthButton
            variant="primary"
            onPress={() => router.push('/(auth)/login/email')}
          >
            Continuar con tu email
          </AuthButton>

          {/* Phone Login */}
          <AuthButton
            variant="outline"
            onPress={() => router.push('/(auth)/register/phone')}
          >
            Continuar con número de teléfono
          </AuthButton>

          {/* Google OAuth Login */}
          <AuthButton
            variant="outline"
            onPress={() => router.push('/(auth)/register/google-selector')}
          >
            Continuar con Google
          </AuthButton>
        </View>

        {/* Link to Register */}
        <View style={[entryStyles.loginContainer, { marginTop: spacing.xxxl }]}>
          <Text style={entryStyles.loginText}>¿No tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register/hub')}>
            <Text style={entryStyles.loginLink}>Registrarte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
