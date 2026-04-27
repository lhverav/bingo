import { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { GameWithRounds, getPublishedGame } from "@/api/games";
import { GameCard } from "./GameCard";
import { useSocket } from "@/contexts/SocketContext";

interface JoinedGameInfo {
  playerCode: string;
  playerId: string;
}

interface GameCarouselProps {
  onJoinGame: (gameId: string) => void;
  onLeaveGame: (gameId: string) => void;
  onSelectCards: (gameId: string) => void;
  joinedGames: Record<string, JoinedGameInfo>;
  refreshTrigger?: number; // Increments when external refresh is needed
}

/**
 * Displays the single published game (if any)
 * Only one game can be published/visible to players at a time
 */
export function GameCarousel({ onJoinGame, onLeaveGame, onSelectCards, joinedGames, refreshTrigger }: GameCarouselProps) {
  const [game, setGame] = useState<GameWithRounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const loadGame = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const publishedGame = await getPublishedGame();
      setGame(publishedGame);
    } catch (err) {
      console.error("Error loading published game:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el juego");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load game on mount
  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // Refresh game when external trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log("[GameCarousel] External refresh triggered");
      loadGame();
    }
  }, [refreshTrigger, loadGame]);

  // Listen for real-time game events
  useEffect(() => {
    if (!socket) {
      console.log("[GameCarousel] Socket not available yet");
      return;
    }

    console.log("[GameCarousel] Setting up socket listeners, connected:", socket.connected);

    const handleGamePublished = () => {
      console.log("🎮 Game published, refreshing...");
      loadGame();
    };

    const handleGameUnpublished = () => {
      console.log("🎮 Game unpublished, refreshing...");
      loadGame();
    };

    const handleGameStarted = () => {
      console.log("🎮 Game started, refreshing...");
      loadGame();
    };

    const handleGameFinished = () => {
      console.log("🎮 Game finished, refreshing...");
      loadGame();
    };

    const handleGameCancelled = () => {
      console.log("🎮 Game cancelled, refreshing...");
      loadGame();
    };

    const handleRoundCreated = () => {
      console.log("🎯 Round created, refreshing...");
      loadGame();
    };

    const handleRoundUpdated = () => {
      console.log("🎯 Round updated, refreshing...");
      loadGame();
    };

    const handleRoundDeleted = () => {
      console.log("🎯 Round deleted, refreshing...");
      loadGame();
    };

    // Game publish events
    socket.on("game:published", handleGamePublished);
    socket.on("game:unpublished", handleGameUnpublished);

    // Game lifecycle events
    socket.on("game:started", handleGameStarted);
    socket.on("game:finished", handleGameFinished);
    socket.on("game:cancelled", handleGameCancelled);

    // Round events (still needed for round info refresh)
    socket.on("round:created", handleRoundCreated);
    socket.on("round:updated", handleRoundUpdated);
    socket.on("round:deleted", handleRoundDeleted);

    return () => {
      // Game publish events
      socket.off("game:published", handleGamePublished);
      socket.off("game:unpublished", handleGameUnpublished);

      // Game lifecycle events
      socket.off("game:started", handleGameStarted);
      socket.off("game:finished", handleGameFinished);
      socket.off("game:cancelled", handleGameCancelled);

      // Round events
      socket.off("round:created", handleRoundCreated);
      socket.off("round:updated", handleRoundUpdated);
      socket.off("round:deleted", handleRoundDeleted);
    };
  }, [socket, loadGame]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Próximo Juego</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Próximo Juego</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGame}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Próximo Juego</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎱</Text>
          <Text style={styles.emptyText}>No hay juegos disponibles</Text>
          <Text style={styles.emptySubtext}>
            Espera a que el organizador publique un juego
          </Text>
        </View>
      </View>
    );
  }

  const joinedInfo = joinedGames[game.id];
  const isJoined = !!joinedInfo;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Próximo Juego</Text>

      {/* Card Display */}
      <View style={styles.cardContainer}>
        <GameCard
          game={game}
          isJoined={isJoined}
          playerCode={joinedInfo?.playerCode}
          onJoin={onJoinGame}
          onLeave={onLeaveGame}
          onSelectCards={onSelectCards}
        />
      </View>
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
});

export default GameCarousel;
