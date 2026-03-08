import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useSocket, useGame } from "@/contexts";
import BingoCard from "../components/BingoCard";
import CountdownTimer from "../components/CountdownTimer";

interface Card {
  id: string;
  cells: number[][];
}

interface CardsDeliveredData {
  player: {
    id: string;
    playerCode: string;
    status: string;
  };
  cards: Card[];
  deadline: string;
}

export default function CardSelectionScreen() {
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const { socket } = useSocket();
  const { playerId, playerCode, cards, deadline, setCards, setSelectedCards } = useGame();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [maxSelectable] = useState(2); // TODO: Get from round config
  const errorHandlerRef = useRef<((data: { message: string }) => void) | null>(null);

  // Request cards on mount (only if we don't have cards yet)
  useEffect(() => {
    if (!socket || !playerId) return;

    // If we already have cards (from reconnect), don't request again
    if (cards.length > 0) {
      setLoading(false);
      return;
    }

    console.log("Requesting cards for player:", playerId);
    socket.emit("cards:request", { playerId });
  }, [socket, playerId, cards.length]);

  // Register event handlers (always active while on this screen)
  useEffect(() => {
    if (!socket) return;

    // AGGRESSIVELY remove ALL listeners for card-specific events to prevent accumulation
    socket.removeAllListeners("cards:delivered");
    socket.removeAllListeners("cards:confirmed");
    socket.removeAllListeners("cards:autoAssigned");

    // Handle cards delivered
    const handleCardsDelivered = (data: CardsDeliveredData) => {
      console.log("Cards delivered:", data);
      setCards(data.cards, new Date(data.deadline));
      setLoading(false);
    };

    // Handle cards confirmed (after selection)
    const handleCardsConfirmed = (data: { selectedCardIds: string[] }) => {
      console.log("Cards confirmed:", data);
      setSelectedCards(data.selectedCardIds);
      router.replace({
        pathname: "/game",
        params: { roundId },
      });
    };

    // Handle auto-assignment on timeout
    const handleAutoAssigned = (data: { selectedCardIds: string[] }) => {
      console.log("Cards auto-assigned:", data);
      setSelectedCards(data.selectedCardIds);
      Alert.alert(
        "Tiempo agotado",
        "Se te asignaron cartones automáticamente.",
        [{ text: "OK" }]
      );
      router.replace({
        pathname: "/game",
        params: { roundId },
      });
    };

    // Handle errors
    const handleError = (data: { message: string }) => {
      console.error("Server error:", data.message);
      Alert.alert("Error", data.message);
      setLoading(false);
    };

    // Store error handler ref for cleanup
    errorHandlerRef.current = handleError;

    socket.on("cards:delivered", handleCardsDelivered);
    socket.on("cards:confirmed", handleCardsConfirmed);
    socket.on("cards:autoAssigned", handleAutoAssigned);
    socket.on("error", handleError);

    return () => {
      socket.removeAllListeners("cards:delivered");
      socket.removeAllListeners("cards:confirmed");
      socket.removeAllListeners("cards:autoAssigned");
      if (errorHandlerRef.current) {
        socket.off("error", errorHandlerRef.current);
      }
    };
  }, [socket, setCards, setSelectedCards, roundId]);

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
    socket?.emit("cards:selected", { selectedCardIds: selectedIds, playerId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando cartones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecciona tus Cartones</Text>
        <Text style={styles.playerCode}>Código: {playerCode}</Text>
      </View>

      {deadline && (
        <CountdownTimer
          deadline={deadline}
          onTimeout={handleTimeout}
        />
      )}

      <Text style={styles.instructions}>
        Selecciona hasta {maxSelectable} cartones ({selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''})
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
    marginTop: 20,
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
