import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { Ionicons } from "@expo/vector-icons";

export default function PerfilScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const { joinedGames } = useGame();

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesion",
      "¿Estas seguro que deseas cerrar sesion?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar Sesion",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              // Navigate to root - auth guard will redirect to auth with clean stack
              router.replace("/");
            } catch (error) {
              console.error("Error logging out:", error);
            }
          },
        },
      ]
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get gender label
  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case "masculino":
        return "Masculino";
      case "femenino":
        return "Femenino";
      case "otro":
        return "Otro";
      case "prefiero_no_decir":
        return "Prefiero no decir";
      default:
        return gender;
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.notAuthContainer}>
        <Ionicons name="person-circle-outline" size={80} color="#ccc" />
        <Text style={styles.notAuthTitle}>No has iniciado sesion</Text>
        <Text style={styles.notAuthSubtitle}>
          Inicia sesion para ver tu perfil
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.loginButtonText}>Iniciar Sesion</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={100} color="#FFD700" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        {user.email && (
          <Text style={styles.userEmail}>{user.email}</Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Object.keys(joinedGames).length}</Text>
          <Text style={styles.statLabel}>Juegos Activos</Text>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informacion Personal</Text>

        <View style={styles.infoCard}>
          {user.email && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Correo electronico</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
          )}

          {user.phone && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="call-outline" size={20} color="#666" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefono</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
              <Text style={styles.infoValue}>{formatDate(user.birthdate)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="person-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Genero</Text>
              <Text style={styles.infoValue}>{getGenderLabel(user.gender)}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="time-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Miembro desde</Text>
              <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="notifications-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Notificaciones</Text>
              <Text style={[styles.infoValue, { color: user.notificationsEnabled ? "#4CAF50" : "#999" }]}>
                {user.notificationsEnabled ? "Activadas" : "Desactivadas"}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="eye-off-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Sin anuncios</Text>
              <Text style={[styles.infoValue, { color: user.noAds ? "#4CAF50" : "#999" }]}>
                {user.noAds ? "Activado" : "Desactivado"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
        <Text style={styles.logoutButtonText}>Cerrar Sesion</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  contentContainer: {
    paddingBottom: 40,
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fafafa",
  },
  notAuthTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  notAuthSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 30,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D32F2F",
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D32F2F",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginTop: 30,
    marginBottom: 20,
  },
});
