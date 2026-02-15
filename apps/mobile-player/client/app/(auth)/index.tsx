import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { entryStyles } from '@/constants/authStyles';

export default function AuthEntryScreen() {
  return (
    <View style={entryStyles.container}>
      {/* Logo Header */}
      <View style={entryStyles.header}>
        <Text style={entryStyles.logo}>BINGOTE</Text>
        <Text style={entryStyles.logoSub}>DE ORO</Text>
      </View>

      {/* Buttons Container */}
      <View style={entryStyles.buttonsContainer}>
        {/* Register Button */}
        <TouchableOpacity
          style={entryStyles.registerButton}
          onPress={() => router.push('/(auth)/register/hub')}
        >
          <Text style={entryStyles.registerButtonText}>Registrarme gratis</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={entryStyles.oauthButton}
          onPress={() => router.push('/(auth)/login/hub')}
        >
          <Text style={entryStyles.oauthButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
