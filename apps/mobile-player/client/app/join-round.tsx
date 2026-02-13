import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://10.0.0.10:3001";

interface Card {
  id: string;
  cells: number[][];
}

interface Player {
  id: string;
  playerCode: string;
  status: string;
  selectionDeadline: string;
}

export default function JoinRoundScreen() {
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const [status, setStatus] = useState<"connecting" | "joining" | "error">(
    "connecting",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!roundId) {
      setStatus("error");
      setErrorMessage("No se especificó la ronda");
      return;
    }

    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server, joining round...");
      setStatus("joining");
      newSocket.emit("player:join", { roundId });
    });

    newSocket.on(
      "cards:delivered",
      (data: { player: Player; cards: Card[]; deadline: string }) => {
        console.log("Cards delivered:", data);
        // Navigate to card selection with the data
        router.replace({
          pathname: "/card-selection",
          params: {
            roundId,
            playerCode: data.player.playerCode,
            playerId: data.player.id,
            cards: JSON.stringify(data.cards),
            deadline: data.deadline,
          },
        });
      },
    );

    newSocket.on("error", (data: { message: string }) => {
      console.error("Server error:", data.message);
      setStatus("error");
      setErrorMessage(data.message);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roundId]);

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
        {status === "connecting" ? "Conectando..." : "Uniéndose a la ronda..."}
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
