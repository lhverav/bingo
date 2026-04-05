import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { useGameJoinSocket } from "@/hooks";
import { getGameById, GameWithRounds, formatGameDate, formatPrice } from "@/api/games";

export default function GameDetailScreen() {
  const { gameId, playerCode: initialPlayerCode } = useLocalSearchParams<{
    gameId: string;
    playerCode: string;
  }>();
  const { user } = useAuth();
  const { removeJoinedGame, joinedGames } = useGame();

  const [game, setGame] = useState<GameWithRounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the current player code from context (may have changed)
  const playerCode = joinedGames[gameId || ""]?.playerCode || initialPlayerCode;

  // Handle leave game
  const { leaveGame } = useGameJoinSocket({
    onLeftGame: (data) => {
      console.log("[game-detail] Left game:", data);
      removeJoinedGame(data.gameId);
      router.replace("/main");
    },
    onGameLeaveError: (error) => {
      console.error("[game-detail] Leave game error:", error.message);
      Alert.alert("Error", error.message);
    },
  });

  // Load game details
  const loadGame = useCallback(async () => {
    if (!gameId) {
      setError("ID de juego no proporcionado");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const gameData = await getGameById(gameId);
      setGame(gameData);
    } catch (err) {
      console.error("Error loading game:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el juego");
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // Handle Android hardware back button - use useFocusEffect to ensure it works when screen is focused
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        console.log("[game-detail] Back button pressed, navigating to mis-juegos");
        router.replace("/main");
        return true; // Prevent default behavior (app exit)
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => subscription.remove();
    }, [])
  );

  // Handle leave game button
  const handleLeaveGame = useCallback(() => {
    Alert.alert(
      "Salir del Juego",
      "¿Estas seguro que deseas salir de este juego?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => {
            if (user?.id && gameId) {
              leaveGame(gameId, user.id);
            }
          },
        },
      ]
    );
  }, [leaveGame, user?.id, gameId]);

  // Get card type info
  const getCardTypeInfo = (cardType: string) => {
    if (cardType === "bingo") {
      return { label: "75-ball", description: "Carton 5x5 con centro libre" };
    }
    return { label: "90-ball", description: "Carton 3x9 estilo europeo" };
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "scheduled":
        return { label: "Programado", color: "#2196F3", icon: "calendar-outline" as const };
      case "active":
        return { label: "En Curso", color: "#4CAF50", icon: "play-circle-outline" as const };
      case "finished":
        return { label: "Finalizado", color: "#9E9E9E", icon: "checkmark-circle-outline" as const };
      case "cancelled":
        return { label: "Cancelado", color: "#F44336", icon: "close-circle-outline" as const };
      default:
        return { label: status, color: "#666", icon: "help-circle-outline" as const };
    }
  };


  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Cargando juego...</Text>
        </View>
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.centerContainer}>
          <Ionicons name="warning-outline" size={64} color="#D32F2F" />
          <Text style={styles.errorText}>{error || "Juego no encontrado"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGame}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/main")}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo(game.status);
  const cardTypeInfo = getCardTypeInfo(game.cardType);

  return (
  <View style={styles.mainContainer}>
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backArrow} onPress={() => router.replace("/main")}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{game.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Player Code Card */}
      <View style={styles.playerCodeCard}>
        <Text style={styles.playerCodeLabel}>Tu Codigo de Jugador</Text>
        <Text style={styles.playerCodeValue}>{playerCode}</Text>
        <Text style={styles.playerCodeHint}>Usa este codigo para identificarte en el juego</Text>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusCard, { borderColor: statusInfo.color }]}>
        <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
        <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
      </View>

      {/* Game Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informacion del Juego</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="grid-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tipo de Carton</Text>
              <Text style={styles.infoValue}>{cardTypeInfo.label}</Text>
              <Text style={styles.infoHint}>{cardTypeInfo.description}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fecha Programada</Text>
              <Text style={styles.infoValue}>{formatGameDate(game.scheduledAt)}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="list-outline" size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Total de Rondas</Text>
              <Text style={styles.infoValue}>{game.rounds.length}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Rounds List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rondas ({game.rounds.length})</Text>

        {game.rounds.length === 0 ? (
          <View style={styles.emptyRounds}>
            <Text style={styles.emptyRoundsText}>No hay rondas configuradas</Text>
          </View>
        ) : (
          <View style={styles.roundsList}>
            {game.rounds.map((round, index) => (
              <View key={round.id} style={styles.roundCard}>
                <View style={styles.roundHeader}>
                  <View style={styles.roundNumber}>
                    <Text style={styles.roundNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.roundInfo}>
                    <Text style={styles.roundName}>{round.name}</Text>
                    {round.patternName && (
                      <Text style={styles.roundPattern}>Patron: {round.patternName}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Cards Section - Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Cartones</Text>

        <View style={styles.cardsPlaceholder}>
          <Ionicons name="card-outline" size={48} color="#ccc" />
          <Text style={styles.cardsPlaceholderTitle}>Cartones no disponibles</Text>
          <Text style={styles.cardsPlaceholderText}>
            Los cartones se asignaran cuando el juego comience
          </Text>
        </View>
      </View>

      {/* Actions */}
      {game.status === "scheduled" && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGame}>
            <Ionicons name="exit-outline" size={20} color="#D32F2F" />
            <Text style={styles.leaveButtonText}>Salir del Juego</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  contentContainer: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fafafa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#D32F2F",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#FFD700",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backArrow: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  playerCodeCard: {
    margin: 16,
    padding: 24,
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFD700",
    alignItems: "center",
  },
  playerCodeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  playerCodeValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFD700",
    letterSpacing: 4,
  },
  playerCodeHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    gap: 10,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    alignItems: "flex-start",
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
    fontWeight: "500",
  },
  infoHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  emptyRounds: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
  },
  emptyRoundsText: {
    fontSize: 14,
    color: "#999",
  },
  roundsList: {
    gap: 12,
  },
  roundCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roundHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  roundNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  roundNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  roundInfo: {
    flex: 1,
  },
  roundName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  roundPattern: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  paidBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976D2",
  },
  freeBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#388E3C",
  },
  cardsPlaceholder: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
  },
  cardsPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  cardsPlaceholderText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D32F2F",
    gap: 8,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D32F2F",
  },
});
