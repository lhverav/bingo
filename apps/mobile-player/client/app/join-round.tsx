import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useSocket, useGame, useAuth } from "@/contexts";

interface PlayerJoinedData {
  player: {
    id: string;
    playerCode: string;
    status: string;
  };
  isReconnect: boolean;
}

export default function JoinRoundScreen() {
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const { socket, isConnected, connect } = useSocket();
  const { setRoundInfo } = useGame();
  const { user } = useAuth();

  const [status, setStatus] = useState<"connecting" | "joining" | "joined" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Connect socket on mount
  useEffect(() => {
    if (!roundId) {
      setStatus("error");
      setErrorMessage("No se especificó la ronda");
      return;
    }

    connect();
  }, [roundId, connect]);

  // Join round when connected
  useEffect(() => {
    if (!socket || !isConnected || !roundId) return;

    console.log("Connected to server, joining round...");
    setStatus("joining");

    // Send join with mobileUserId for duplicate protection
    socket.emit("player:join", {
      roundId,
      mobileUserId: user?.id
    });

    // Handle successful join
    const handlePlayerJoined = (data: PlayerJoinedData) => {
      console.log("Player joined:", data);

      // Store in game context
      setRoundInfo(roundId, data.player.id, data.player.playerCode);

      setStatus("joined");

      // Navigate to card selection
      router.replace({
        pathname: "/card-selection",
        params: { roundId },
      });
    };

    // Handle errors
    const handleError = (data: { message: string }) => {
      console.error("Server error:", data.message);
      setStatus("error");
      setErrorMessage(data.message);
    };

    socket.on("player:joined", handlePlayerJoined);
    socket.on("error", handleError);

    return () => {
      socket.off("player:joined", handlePlayerJoined);
      socket.off("error", handleError);
    };
  }, [socket, isConnected, roundId, user?.id, setRoundInfo]);

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
