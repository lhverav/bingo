import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { io, Socket } from "socket.io-client";
import BingoCard from "../components/BingoCard";

const SERVER_URL = "http://10.0.0.35:3001";

interface Card {
  id: string;
  cells: number[][];
}

export default function GameScreen() {
  const params = useLocalSearchParams<{
    roundId: string;
    playerCode: string;
    selectedCardIds: string;
  }>();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [lastDrawn, setLastDrawn] = useState<number | null>(null);
  const [markedNumbers, setMarkedNumbers] = useState<Record<string, number[]>>({});
  const [gameStatus, setGameStatus] = useState<"waiting" | "playing" | "ended">("waiting");

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to game");
      // Join round room to receive updates
      newSocket.emit("player:rejoin", { roundId: params.roundId });
    });

    newSocket.on("game:started", (data) => {
      console.log("Game started:", data);
      setGameStatus("playing");
    });

    newSocket.on("ball:announced", (data: { number: number }) => {
      console.log("Ball announced:", data.number);
      setDrawnNumbers((prev) => [...prev, data.number]);
      setLastDrawn(data.number);
    });

    newSocket.on("game:ended", (data) => {
      console.log("Game ended:", data);
      setGameStatus("ended");
      Alert.alert("Juego terminado", data.message || "El juego ha finalizado.");
    });

    newSocket.on("bingo:claimed", (data) => {
      console.log("Bingo claimed:", data);
      Alert.alert(
        "¡BINGO!",
        `El jugador ${data.playerCode} ha cantado bingo.`
      );
    });

    newSocket.on("error", (data: { message: string }) => {
      console.error("Server error:", data.message);
    });

    // TODO: Fetch actual card data based on selectedCardIds
    // For now, we'll need to get the cards from the server
    // This is a placeholder - in a real implementation, cards would be fetched

    return () => {
      newSocket.disconnect();
    };
  }, [params.roundId]);

  const handleMarkNumber = useCallback((cardId: string, number: number) => {
    if (!drawnNumbers.includes(number)) {
      Alert.alert("Número no válido", "Este número aún no ha sido sacado.");
      return;
    }

    setMarkedNumbers((prev) => {
      const cardMarks = prev[cardId] || [];
      if (cardMarks.includes(number)) {
        // Unmark
        return {
          ...prev,
          [cardId]: cardMarks.filter((n) => n !== number),
        };
      }
      // Mark
      return {
        ...prev,
        [cardId]: [...cardMarks, number],
      };
    });
  }, [drawnNumbers]);

  const handleClaimBingo = (cardId: string) => {
    Alert.alert(
      "Confirmar Bingo",
      "¿Estás seguro de que tienes BINGO?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "¡BINGO!",
          onPress: () => {
            socket?.emit("bingo:claim", {
              roundId: params.roundId,
              cardId,
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bingote de Oro</Text>
        <Text style={styles.playerCode}>Código: {params.playerCode}</Text>
        <Text style={styles.status}>
          {gameStatus === "waiting" && "Esperando inicio del juego..."}
          {gameStatus === "playing" && "¡Juego en curso!"}
          {gameStatus === "ended" && "Juego finalizado"}
        </Text>
      </View>

      {/* Last drawn number */}
      <View style={styles.lastDrawnSection}>
        <Text style={styles.lastDrawnLabel}>Último número</Text>
        <View style={styles.lastDrawnBall}>
          <Text style={styles.lastDrawnNumber}>
            {lastDrawn !== null ? lastDrawn : "-"}
          </Text>
        </View>
      </View>

      {/* Drawn numbers history */}
      <View style={styles.drawnHistorySection}>
        <Text style={styles.sectionLabel}>
          Números sacados ({drawnNumbers.length})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.drawnNumbersList}>
            {drawnNumbers.map((num, index) => (
              <View key={index} style={styles.drawnNumberBadge}>
                <Text style={styles.drawnNumberText}>{num}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Player's cards */}
      <Text style={styles.sectionLabel}>Tus Cartones</Text>
      <ScrollView
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContent}
      >
        {cards.length === 0 ? (
          <Text style={styles.noCards}>
            Cargando cartones...
          </Text>
        ) : (
          cards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              <BingoCard
                id={card.id}
                cells={card.cells}
                markedNumbers={markedNumbers[card.id] || []}
                onMarkNumber={(number) => handleMarkNumber(card.id, number)}
                disabled={gameStatus !== "playing"}
              />
              {gameStatus === "playing" && (
                <TouchableOpacity
                  style={styles.bingoButton}
                  onPress={() => handleClaimBingo(card.id)}
                >
                  <Text style={styles.bingoButtonText}>¡BINGO!</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Back button */}
      {gameStatus === "ended" && (
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.homeButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 15,
  },
  header: {
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playerCode: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  status: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginTop: 5,
  },
  lastDrawnSection: {
    alignItems: "center",
    marginBottom: 15,
  },
  lastDrawnLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  lastDrawnBall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  lastDrawnNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#333",
  },
  drawnHistorySection: {
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  drawnNumbersList: {
    flexDirection: "row",
    gap: 8,
  },
  drawnNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  drawnNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  cardsContainer: {
    flex: 1,
  },
  cardsContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
    paddingBottom: 20,
  },
  cardWrapper: {
    alignItems: "center",
  },
  noCards: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  bingoButton: {
    marginTop: 10,
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  bingoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  homeButton: {
    backgroundColor: "#3498db",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
