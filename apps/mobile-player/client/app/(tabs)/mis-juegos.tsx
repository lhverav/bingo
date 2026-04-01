import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/contexts/AuthContext";
import { useConnectionState, useGameJoinSocket } from "@/hooks";
import { getGameById, getJoinedGames as fetchJoinedGames, GameWithRounds, JoinedGameInfo as ApiJoinedGameInfo, formatGameDate } from "@/api/games";

interface JoinedGameWithDetails {
  gameId: string;
  playerCode: string;
  playerId: string;
  game: GameWithRounds | null;
  loading: boolean;
  error: string | null;
}

export default function MisJuegosScreen() {
  const { joinedGames, removeJoinedGame, addJoinedGame } = useGame();
  const { user } = useAuth();
  const isConnected = useConnectionState();

  const [gamesWithDetails, setGamesWithDetails] = useState<JoinedGameWithDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Handle leave game
  const { leaveGame } = useGameJoinSocket({
    onLeftGame: (data) => {
      console.log("[mis-juegos] Left game:", data);
      removeJoinedGame(data.gameId);
    },
    onGameLeaveError: (error) => {
      console.error("[mis-juegos] Leave game error:", error.message);
    },
  });

  // Sync joined games from API (for games joined from other sessions)
  const syncFromApi = useCallback(async () => {
    if (!user?.id) return;

    try {
      const apiGames = await fetchJoinedGames(user.id);

      // Add any games from API that aren't in local context
      for (const apiGame of apiGames) {
        if (!joinedGames[apiGame.game.id]) {
          addJoinedGame(apiGame.game.id, apiGame.playerId, apiGame.playerCode);
        }
      }

      // Set the games with details directly from API response
      const details: JoinedGameWithDetails[] = apiGames.map((apiGame) => ({
        gameId: apiGame.game.id,
        playerCode: apiGame.playerCode,
        playerId: apiGame.playerId,
        game: apiGame.game,
        loading: false,
        error: null,
      }));

      setGamesWithDetails(details);
    } catch (err) {
      console.error("[mis-juegos] Error syncing from API:", err);
      // Fall back to loading from context
      await loadGameDetailsFromContext();
    } finally {
      setInitialLoading(false);
    }
  }, [user?.id, joinedGames, addJoinedGame]);

  // Load game details from context (fallback)
  const loadGameDetailsFromContext = useCallback(async () => {
    const gameIds = Object.keys(joinedGames);

    if (gameIds.length === 0) {
      setGamesWithDetails([]);
      return;
    }

    // Initialize with loading state
    const initialState: JoinedGameWithDetails[] = gameIds.map((gameId) => ({
      gameId,
      playerCode: joinedGames[gameId].playerCode,
      playerId: joinedGames[gameId].playerId,
      game: null,
      loading: true,
      error: null,
    }));
    setGamesWithDetails(initialState);

    // Fetch each game's details
    const results = await Promise.all(
      gameIds.map(async (gameId) => {
        try {
          const game = await getGameById(gameId);
          return {
            gameId,
            playerCode: joinedGames[gameId].playerCode,
            playerId: joinedGames[gameId].playerId,
            game,
            loading: false,
            error: null,
          };
        } catch (err) {
          return {
            gameId,
            playerCode: joinedGames[gameId].playerCode,
            playerId: joinedGames[gameId].playerId,
            game: null,
            loading: false,
            error: err instanceof Error ? err.message : "Error al cargar",
          };
        }
      })
    );

    setGamesWithDetails(results);
  }, [joinedGames]);

  // Load on mount - sync from API first
  useEffect(() => {
    syncFromApi();
  }, [syncFromApi]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncFromApi();
    setRefreshing(false);
  }, [syncFromApi]);

  // Handle game card tap
  const handleGamePress = useCallback((gameId: string, playerCode: string) => {
    router.push({
      pathname: "/game-detail",
      params: { gameId, playerCode },
    });
  }, []);

  // Handle select cards
  const handleSelectCards = useCallback((gameId: string) => {
    router.push({
      pathname: "/card-selection",
      params: { gameId },
    });
  }, []);

  // Handle leave game
  const handleLeaveGame = useCallback((gameId: string) => {
    if (user?.id) {
      leaveGame(gameId, user.id);
    }
  }, [leaveGame, user?.id]);

  // Get card type label
  const getCardTypeLabel = (cardType: string) => {
    return cardType === "bingo" ? "75-ball" : "90-ball";
  };

  // Get status label and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "scheduled":
        return { label: "Programado", color: "#2196F3" };
      case "active":
        return { label: "En Curso", color: "#4CAF50" };
      case "finished":
        return { label: "Finalizado", color: "#9E9E9E" };
      case "cancelled":
        return { label: "Cancelado", color: "#F44336" };
      default:
        return { label: status, color: "#666" };
    }
  };

  // Initial loading state
  if (initialLoading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando tus juegos...</Text>
      </View>
    );
  }

  // Empty state
  if (gamesWithDetails.length === 0 && Object.keys(joinedGames).length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎱</Text>
        <Text style={styles.emptyTitle}>No tienes juegos</Text>
        <Text style={styles.emptySubtitle}>
          Unete a un juego en la pestana "Proximos Juegos"
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.replace("/(tabs)/proximos-juegos")}
        >
          <Text style={styles.emptyButtonText}>Ver Juegos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#FFD700"]}
          tintColor="#FFD700"
        />
      }
    >
      {/* Connection status */}
      <Text style={{ color: isConnected ? "green" : "red", marginBottom: 16, textAlign: "center" }}>
        {isConnected ? "● Conectado" : "○ Desconectado"}
      </Text>

      {/* Games list */}
      {gamesWithDetails.map((item) => (
        <TouchableOpacity
          key={item.gameId}
          style={styles.gameCard}
          onPress={() => handleGamePress(item.gameId, item.playerCode)}
          disabled={item.loading}
        >
          {item.loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#FFD700" />
              <Text style={styles.loadingText}>Cargando...</Text>
            </View>
          ) : item.error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{item.error}</Text>
              <TouchableOpacity
                style={styles.leaveButtonSmall}
                onPress={() => handleLeaveGame(item.gameId)}
              >
                <Text style={styles.leaveButtonSmallText}>Salir</Text>
              </TouchableOpacity>
            </View>
          ) : item.game ? (
            <>
              {/* Game header */}
              <View style={styles.gameHeader}>
                <Text style={styles.gameName}>{item.game.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusInfo(item.game.status).color }]}>
                  <Text style={styles.statusText}>{getStatusInfo(item.game.status).label}</Text>
                </View>
              </View>

              {/* Player code */}
              <View style={styles.playerCodeContainer}>
                <Text style={styles.playerCodeLabel}>Tu codigo:</Text>
                <Text style={styles.playerCode}>{item.playerCode}</Text>
              </View>

              {/* Game info */}
              <View style={styles.gameInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tipo:</Text>
                  <Text style={styles.infoValue}>{getCardTypeLabel(item.game.cardType)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha:</Text>
                  <Text style={styles.infoValue}>{formatGameDate(item.game.scheduledAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Rondas:</Text>
                  <Text style={styles.infoValue}>{item.game.rounds.length}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cardsButton}
                  onPress={() => handleSelectCards(item.gameId)}
                >
                  <Text style={styles.cardsButtonText}>MIS CARTONES</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => handleGamePress(item.gameId, item.playerCode)}
                >
                  <Text style={styles.detailButtonText}>Ver Detalles</Text>
                </TouchableOpacity>
                {item.game.status === "scheduled" && (
                  <TouchableOpacity
                    style={styles.leaveButton}
                    onPress={() => handleLeaveGame(item.gameId)}
                  >
                    <Text style={styles.leaveButtonText}>Salir</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : null}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fafafa",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  gameCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    fontSize: 14,
    color: "#D32F2F",
    flex: 1,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  gameName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  playerCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  playerCodeLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  playerCode: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
    letterSpacing: 2,
  },
  gameInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  actions: {
    marginBottom: 12,
  },
  cardsButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#388E3C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardsButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  detailButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  detailButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  leaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D32F2F",
    alignItems: "center",
  },
  leaveButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D32F2F",
  },
  leaveButtonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D32F2F",
  },
  leaveButtonSmallText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D32F2F",
  },
});
