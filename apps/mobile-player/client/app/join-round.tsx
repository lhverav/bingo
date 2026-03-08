import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useSocket, useGame, useAuth } from "@/contexts";

interface PlayerJoinedData {
  player: {
    id: string;
    playerCode: string;
    status: string;
  };
  isReconnect: boolean;
  roundPattern: string | null;
}

export default function JoinRoundScreen() {
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const { socket, reconnect } = useSocket();
  const { setRoundInfo, clearGame, setRoundPattern } = useGame();
  const { user } = useAuth();

  const [status, setStatus] = useState<"connecting" | "joining" | "joined" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const joinAttemptedRef = useRef(false);
  const errorHandlerRef = useRef<((data: { message: string }) => void) | null>(null);

  // Main effect: setup, connect, and join
  useEffect(() => {
    if (!roundId) {
      setStatus("error");
      setErrorMessage("No se especificó la ronda");
      return;
    }

    // Clear any previous game state before joining new round
    clearGame();
    joinAttemptedRef.current = false;

    // Use reconnect for FRESH socket connection (clears all listeners and state)
    reconnect();
  }, [roundId, reconnect, clearGame]);

  // Join effect: handles joining once socket is available
  useEffect(() => {
    if (!socket || !roundId) return;

    // AGGRESSIVELY remove ALL listeners for these events to prevent accumulation
    socket.removeAllListeners("player:joined");
    // Note: Don't removeAllListeners("error") as other parts might use it
    // Instead, we'll be careful with our error handling

    const performJoin = () => {
      if (joinAttemptedRef.current) return;
      joinAttemptedRef.current = true;

      console.log("Joining round:", roundId);
      setStatus("joining");

      socket.emit("player:join", {
        roundId,
        mobileUserId: user?.id
      });
    };

    // Handle successful join
    const handlePlayerJoined = (data: PlayerJoinedData) => {
      console.log("Player joined:", data);

      // Store in game context
      setRoundInfo(roundId, data.player.id, data.player.playerCode);

      // Set the round pattern
      if (data.roundPattern) {
        setRoundPattern(data.roundPattern);
      }

      setStatus("joined");

      // Navigate based on player status
      if (data.player.status === "ready") {
        router.replace({
          pathname: "/game",
          params: { roundId },
        });
      } else {
        router.replace({
          pathname: "/card-selection",
          params: { roundId },
        });
      }
    };

    // Handle errors
    const handleError = (data: { message: string }) => {
      console.error("Server error:", data.message);
      setStatus("error");
      setErrorMessage(data.message);
    };

    // Store error handler ref for cleanup
    errorHandlerRef.current = handleError;

    // Register event handlers
    socket.on("player:joined", handlePlayerJoined);
    socket.on("error", handleError);

    // Try to join - check socket.connected directly
    if (socket.connected) {
      performJoin();
    } else {
      // Wait for connection, then join
      socket.once("connect", performJoin);
    }

    // Fallback: if still not joined after 500ms, try again
    const fallbackTimer = setTimeout(() => {
      if (!joinAttemptedRef.current && socket.connected) {
        console.log("Fallback join triggered");
        performJoin();
      }
    }, 500);

    return () => {
      clearTimeout(fallbackTimer);
      socket.removeAllListeners("player:joined");
      if (errorHandlerRef.current) {
        socket.off("error", errorHandlerRef.current);
      }
      socket.off("connect", performJoin);
    };
  }, [socket, roundId, user?.id, setRoundInfo, setRoundPattern]);

  if (status === "error") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {errorMessage || "Error al unirse a la ronda"}
        </Text>
        <Text style={styles.backLink} onPress={() => router.back()}>
          Volver
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFD700" />
      <Text style={styles.statusText}>
        {status === "connecting" && "Conectando..."}
        {status === "joining" && "Uniéndose a la ronda..."}
        {status === "joined" && "Cargando cartones..."}
      </Text>
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
});
