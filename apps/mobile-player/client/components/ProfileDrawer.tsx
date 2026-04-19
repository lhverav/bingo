import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.85;

interface ProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  rightText?: string;
}

function MenuItem({ icon, label, onPress, destructive, rightText }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={icon}
        size={22}
        color={destructive ? '#D32F2F' : '#666'}
        style={styles.menuIcon}
      />
      <Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}>
        {label}
      </Text>
      {rightText && (
        <Text style={styles.menuRightText}>{rightText}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileDrawer({ visible, onClose }: ProfileDrawerProps) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleViewProfile = () => {
    onClose();
    router.push('/(tabs)/perfil');
  };

  const handleGameHistory = () => {
    onClose();
    // TODO: Navigate to game history screen
    Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
  };

  const handleMyCards = () => {
    onClose();
    // TODO: Navigate to my cards screen
    Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
  };

  const handleNotifications = () => {
    onClose();
    // TODO: Navigate to notifications settings
    Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
  };

  const handleSettings = () => {
    onClose();
    // TODO: Navigate to settings screen
    Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
  };

  const handleHelp = () => {
    onClose();
    // TODO: Navigate to help screen
    Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            onClose();
            try {
              await logout();
              router.replace('/');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  // Get user initial
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <TouchableOpacity style={styles.profileHeader} onPress={handleViewProfile}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Usuario'}</Text>
              <Text style={styles.profileLink}>Ver perfil →</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <MenuItem
              icon="game-controller-outline"
              label="Historial de juegos"
              onPress={handleGameHistory}
            />
            <MenuItem
              icon="grid-outline"
              label="Mis cartones"
              onPress={handleMyCards}
            />
            <MenuItem
              icon="notifications-outline"
              label="Notificaciones"
              onPress={handleNotifications}
              rightText={user?.notificationsEnabled ? 'Activadas' : 'Desactivadas'}
            />
            <MenuItem
              icon="settings-outline"
              label="Configuración"
              onPress={handleSettings}
            />
            <MenuItem
              icon="help-circle-outline"
              label="Ayuda y soporte"
              onPress={handleHelp}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Logout */}
          <View style={styles.menuSection}>
            <MenuItem
              icon="log-out-outline"
              label="Cerrar sesión"
              onPress={handleLogout}
              destructive
            />
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileLink: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  menuSection: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuIcon: {
    width: 28,
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  menuLabelDestructive: {
    color: '#D32F2F',
  },
  menuRightText: {
    fontSize: 14,
    color: '#999',
  },
});
