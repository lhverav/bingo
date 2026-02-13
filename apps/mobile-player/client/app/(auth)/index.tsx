import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { router } from 'expo-router';

export default function AuthEntryScreen() {
  const { startRegister, startLogin } = useAuthFlow();

  const handleGuestPlay = () => {
    // Go back to main app as guest
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>BINGOTE</Text>
        <Text style={styles.logoSub}>DE ORO</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Millones de canciones gratis. Solo en Bingote.
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        {/* Register Button */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => startRegister('email')}
        >
          <Text style={styles.registerButtonText}>Registrarme gratis</Text>
        </TouchableOpacity>

        {/* OAuth Buttons */}
        <TouchableOpacity
          style={styles.oauthButton}
          onPress={() => startRegister('google')}
        >
          <Text style={styles.oauthButtonText}>Continuar con Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.oauthButton}
          onPress={() => startRegister('facebook')}
        >
          <Text style={styles.oauthButtonText}>Continuar con Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.oauthButton}
          onPress={() => startRegister('phone')}
        >
          <Text style={styles.oauthButtonText}>Continuar con teléfono</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => startLogin('email')}>
            <Text style={styles.loginLink}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Guest Mode */}
        <TouchableOpacity style={styles.guestButton} onPress={handleGuestPlay}>
          <Text style={styles.guestButtonText}>Continuar como invitado</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 4,
  },
  logoSub: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFD700',
    letterSpacing: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 40,
  },
  registerButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  oauthButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  oauthButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#888',
    fontSize: 14,
  },
  loginLink: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
