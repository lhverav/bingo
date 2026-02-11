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
import CountdownTimer from "../components/CountdownTimer";

const SERVER_URL = "http://10.0.0.35:3001";

interface Card {
  id: string;
  cells: number[][];
}

export default function CardSelectionScreen() {
  const params = useLocalSearchParams<{
    roundId: string;
    playerCode: string;
    playerId: string;
    cards: string;
    deadline: string;
  }>();

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [maxSelectable] = useState(2); // TODO: Get from round config

  useEffect(() => {
    if (params.cards) {
      try {
        const parsedCards = JSON.parse(params.cards);
        setCards(parsedCards);
      } catch (e) {
        console.error("Error parsing cards:", e);
      }
    }

    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected for card selection");
      // Re-join the round room
      newSocket.emit("player:join", { roundId: params.roundId });
    });

    newSocket.on("cards:confirmed", (data) => {
      console.log("Cards confirmed:", data);
      router.replace({
        pathname: "/game",
        params: {
          roundId: params.roundId,
          playerCode: params.playerCode,
          selectedCardIds: JSON.stringify(data.selectedCardIds),
        },
      });
    });

    newSocket.on("cards:autoAssigned", (data) => {
      console.log("Cards auto-assigned:", data);
      Alert.alert(
        "Tiempo agotado",
        "Se te asignaron cartones automáticamente.",
        [{ text: "OK" }]
      );
      router.replace({
        pathname: "/game",
        params: {
          roundId: params.roundId,
          playerCode: params.playerCode,
          selectedCardIds: JSON.stringify(data.selectedCardIds),
        },
      });
    });

    newSocket.on("error", (data: { message: string }) => {
      console.error("Server error:", data.message);
      Alert.alert("Error", data.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [params.cards, params.roundId, params.playerCode]);

  const handleSelectCard = useCallback((cardId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= maxSelectable) {
        return prev;
      }
      return [...prev, cardId];
    });
  }, [maxSelectable]);

  const handleTimeout = useCallback(() => {
    console.log("Selection timed out");
    // Server will handle auto-assignment
  }, []);

  const handleConfirmSelection = () => {
    if (selectedIds.length === 0) {
      Alert.alert("Error", "Debes seleccionar al menos un cartón");
      return;
    }

    setSubmitting(true);
    socket?.emit("cards:selected", { selectedCardIds: selectedIds });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecciona tus Cartones</Text>
        <Text style={styles.playerCode}>Código: {params.playerCode}</Text>
      </View>

      <CountdownTimer
        deadline={new Date(params.deadline || Date.now() + 60000)}
        onTimeout={handleTimeout}
      />

      <Text style={styles.instructions}>
        Selecciona {maxSelectable} cartones ({selectedIds.length}/{maxSelectable})
      </Text>

      <ScrollView
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContent}
      >
        {cards.map((card) => (
          <View key={card.id} style={styles.cardWrapper}>
            <BingoCard
              id={card.id}
              cells={card.cells}
              selected={selectedIds.includes(card.id)}
              onSelect={handleSelectCard}
              disabled={submitting}
            />
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          selectedIds.length === 0 && styles.confirmButtonDisabled,
          submitting && styles.confirmButtonDisabled,
        ]}
        onPress={handleConfirmSelection}
        disabled={selectedIds.length === 0 || submitting}
      >
        <Text style={styles.confirmButtonText}>
          {submitting ? "Confirmando..." : "Confirmar Selección"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  playerCode: {
    fontSize: 16,
    color: "#FFD700",
    fontWeight: "600",
    marginTop: 5,
  },
  instructions: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 15,
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
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});
