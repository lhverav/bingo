import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useSocket, useAuth } from "@/contexts";
import { useGameJoinSocket, useConnectionState } from "@/hooks";

interface GameInfo {
  id: string;
  name: string;
  cardType: "bingo" | "bingote";
  scheduledAt: string;
  status: string;
}

interface PlayerInfo {
  id: string;
  playerCode: string;
  status: string;
  gameId: string;
}

export default function GameLobbyScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { reconnect } = useSocket();
  const { user } = useAuth();
  const isConnected = useConnectionState();

  const [status, setStatus] = useState<"connecting" | "joining" | "joined" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [game, setGame] = useState<GameInfo | null>(null);
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const joinAttemptedRef = useRef(false);

  // Use RxJS-based game join hook
  const { joinGame } = useGameJoinSocket({
    onJoinedGame: (data) => {
      console.log("[game-lobby.tsx] Player joined game (RxJS):", data);

      // Store game and player info
      setGame(data.game);
      setPlayer(data.player);
      setStatus("joined");

      // TODO: Listen for round start events to navigate to card selection
    },
    onGameJoinError: (error) => {
      console.error("[game-lobby.tsx] Game join error (RxJS):", error.message);
      setStatus("error");
      setErrorMessage(error.message);
    },
  });

  // Main effect: setup, connect, and join
  useEffect(() => {
    if (!gameId) {
      setStatus("error");
      setErrorMessage("No se especifico el juego");
      return;
    }

    joinAttemptedRef.current = false;

    // Use reconnect for FRESH socket connection
    reconnect();
  }, [gameId, reconnect]);

  // Join effect: handles joining once connected
  useEffect(() => {
    console.log("[game-lobby.tsx] Join effect - gameId:", gameId, "isConnected:", isConnected, "attempted:", joinAttemptedRef.current);

    if (!gameId || !isConnected) return;
    if (joinAttemptedRef.current) return;

    // Perform join
    console.log("[game-lobby.tsx] Emitting game:join for gameId:", gameId, "mobileUserId:", user?.id);
    joinAttemptedRef.current = true;
    setStatus("joining");
    joinGame(gameId, user?.id);
  }, [gameId, isConnected, joinGame, user?.id]);

  if (status === "error") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {errorMessage || "Error al unirse al juego"}
        </Text>
        <Text style={styles.backLink} onPress={() => router.back()}>
          Volver
        </Text>
      </View>
    );
  }

  if (status === "connecting" || status === "joining") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.statusText}>
          {status === "connecting" && "Conectando..."}
          {status === "joining" && "Uniendose al juego..."}
        </Text>
      </View>
    );
  }

  // Joined state - show lobby
  return (
    <View style={styles.container}>
      {/* Game Info Card */}
      <View style={styles.gameCard}>
        <Text style={styles.gameName}>{game?.name || "Juego"}</Text>
        <Text style={styles.gameType}>
          Tipo: {game?.cardType === "bingote" ? "Bingote (4x4)" : "Bingo (5x5)"}
        </Text>
        {game?.scheduledAt && (
          <Text style={styles.gameSchedule}>
            Programado: {new Date(game.scheduledAt).toLocaleString()}
          </Text>
        )}
        <Text style={styles.gameStatus}>
          Estado: {game?.status === "scheduled" ? "Programado" : game?.status === "active" ? "Activo" : game?.status}
        </Text>
      </View>

      {/* Player Code Display */}
      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Tu codigo de jugador</Text>
        <Text style={styles.playerCode}>{player?.playerCode || "----"}</Text>
        <Text style={styles.codeHint}>
          Guarda este codigo para identificarte en el juego
        </Text>
      </View>

      {/* Waiting Message */}
      <View style={styles.waitingContainer}>
        <ActivityIndicator size="small" color="#FFD700" />
        <Text style={styles.waitingText}>
          Esperando a que comience una ronda...
        </Text>
        <Text style={styles.waitingHint}>
          El anfitrion iniciara el juego cuando todos esten listos
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    color: "#333",
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
  },
  backLink: {
    fontSize: 16,
    color: "#3498db",
    textDecorationLine: "underline",
  },
  gameCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  gameName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  gameType: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  gameSchedule: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  gameStatus: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "600",
  },
  codeContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  codeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  playerCode: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFD700",
    letterSpacing: 8,
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  codeHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  waitingContainer: {
    alignItems: "center",
    padding: 16,
  },
  waitingText: {
    fontSize: 16,
    color: "#333",
    marginTop: 12,
    textAlign: "center",
  },
  waitingHint: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
});
