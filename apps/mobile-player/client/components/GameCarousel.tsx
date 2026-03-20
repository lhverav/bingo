import { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { GameWithRounds, getScheduledGames } from "@/api/games";
import { GameCard } from "./GameCard";
import { useSocket } from "@/contexts/SocketContext";

interface JoinedGameInfo {
  playerCode: string;
  playerId: string;
}

interface GameCarouselProps {
  onJoinGame: (gameId: string) => void;
  onLeaveGame: (gameId: string) => void;
  joinedGames: Record<string, JoinedGameInfo>;
}

export function GameCarousel({ onJoinGame, onLeaveGame, joinedGames }: GameCarouselProps) {
  const [games, setGames] = useState<GameWithRounds[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const scheduledGames = await getScheduledGames();
      setGames(scheduledGames);
    } catch (err) {
      console.error("Error loading games:", err);
      setError(err instanceof Error ? err.message : "Error al cargar juegos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // Listen for real-time game events
  useEffect(() => {
    if (!socket) return;

    const handleGameCreated = () => {
      console.log("🎮 New game created, refreshing list...");
      loadGames();
    };

    const handleGameStarted = () => {
      console.log("🎮 Game started, refreshing list...");
      loadGames();
    };

    const handleGameFinished = () => {
      console.log("🎮 Game finished, refreshing list...");
      loadGames();
    };

    const handleGameCancelled = () => {
      console.log("🎮 Game cancelled, refreshing list...");
      loadGames();
    };

    const handleRoundCreated = () => {
      console.log("🎯 Round created, refreshing list...");
      loadGames();
    };

    const handleRoundUpdated = () => {
      console.log("🎯 Round updated, refreshing list...");
      loadGames();
    };

    const handleRoundDeleted = () => {
      console.log("🎯 Round deleted, refreshing list...");
      loadGames();
    };

    // Game events
    socket.on("game:created", handleGameCreated);
    socket.on("game:started", handleGameStarted);
    socket.on("game:finished", handleGameFinished);
    socket.on("game:cancelled", handleGameCancelled);

    // Round events
    socket.on("round:created", handleRoundCreated);
    socket.on("round:updated", handleRoundUpdated);
    socket.on("round:deleted", handleRoundDeleted);

    return () => {
      // Game events
      socket.off("game:created", handleGameCreated);
      socket.off("game:started", handleGameStarted);
      socket.off("game:finished", handleGameFinished);
      socket.off("game:cancelled", handleGameCancelled);

      // Round events
      socket.off("round:created", handleRoundCreated);
      socket.off("round:updated", handleRoundUpdated);
      socket.off("round:deleted", handleRoundDeleted);
    };
  }, [socket, loadGames]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : games.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < games.length - 1 ? prev + 1 : 0));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Próximos Juegos</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Cargando juegos...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Próximos Juegos</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGames}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (games.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Próximos Juegos</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎱</Text>
          <Text style={styles.emptyText}>No hay juegos pendientes</Text>
          <Text style={styles.emptySubtext}>
            Los juegos programados aparecerán aquí
          </Text>
        </View>
      </View>
    );
  }

  const currentGame = games[currentIndex];
  const joinedInfo = joinedGames[currentGame.id];
  const isJoined = !!joinedInfo;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Proximos Juegos</Text>

      {/* Card Display */}
      <View style={styles.cardContainer}>
        <GameCard
          game={currentGame}
          isJoined={isJoined}
          playerCode={joinedInfo?.playerCode}
          onJoin={onJoinGame}
          onLeave={onLeaveGame}
        />
      </View>

      {/* Navigation */}
      {games.length > 1 && (
        <View style={styles.navigation}>
          <TouchableOpacity style={styles.navButton} onPress={goToPrevious}>
            <Text style={styles.navButtonText}>◄</Text>
          </TouchableOpacity>

          <View style={styles.indicators}>
            {games.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.navButton} onPress={goToNext}>
            <Text style={styles.navButtonText}>►</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Counter */}
      <Text style={styles.counter}>
        {currentIndex + 1} de {games.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    width: 300,
  },
  errorText: {
    fontSize: 14,
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    width: 300,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  navButtonText: {
    fontSize: 18,
    color: "#333",
  },
  indicators: {
    flexDirection: "row",
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DDD",
  },
  indicatorActive: {
    backgroundColor: "#FFD700",
    width: 24,
  },
  counter: {
    marginTop: 12,
    fontSize: 12,
    color: "#999",
  },
});

export default GameCarousel;
