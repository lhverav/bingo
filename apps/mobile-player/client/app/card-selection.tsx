import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useGame } from "@/contexts";
import { useRoundSocket, useConnectionState } from "@/hooks";
import BingoCard from "../components/BingoCard";
import CountdownTimer from "../components/CountdownTimer";

export default function CardSelectionScreen() {
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const { playerId, playerCode, cards, deadline, setCards, setSelectedCards } = useGame();
  const isConnected = useConnectionState();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [maxSelectable] = useState(2); // TODO: Get from round config
  const cardsRequestedRef = { current: false };

  // Use RxJS-based round event hooks
  const { requestCards, selectCards } = useRoundSocket({
    onCardsDelivered: (data) => {
      console.log("[card-selection.tsx] Cards delivered (RxJS):", data);
      setCards(data.cards, new Date(data.deadline));
      setLoading(false);
    },
    onCardsConfirmed: (data) => {
      console.log("[card-selection.tsx] Cards confirmed (RxJS):", data);
      setSelectedCards(data.selectedCardIds);
      router.replace({
        pathname: "/game",
        params: { roundId },
      });
    },
    onCardsAutoAssigned: (data) => {
      console.log("[card-selection.tsx] Cards auto-assigned (RxJS):", data);
      setSelectedCards(data.selectedCardIds);
      Alert.alert(
        "Tiempo agotado",
        "Se te asignaron cartones automaticamente.",
        [{ text: "OK" }]
      );
      router.replace({
        pathname: "/game",
        params: { roundId },
      });
    },
    onError: (error) => {
      console.error("[card-selection.tsx] Server error (RxJS):", error.message);
      Alert.alert("Error", error.message);
      setLoading(false);
    },
  });

  // Request cards on mount (only if we don't have cards yet)
  useEffect(() => {
    if (!isConnected || !playerId) return;

    // If we already have cards (from reconnect), don't request again
    if (cards.length > 0) {
      setLoading(false);
      return;
    }

    // Prevent duplicate requests
    if (cardsRequestedRef.current) return;
    cardsRequestedRef.current = true;

    console.log("[card-selection.tsx] Requesting cards for player:", playerId);
    requestCards(playerId);
  }, [isConnected, playerId, cards.length, requestCards]);

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
      Alert.alert("Error", "Debes seleccionar al menos un carton");
      return;
    }

    if (!playerId) {
      Alert.alert("Error", "No estas conectado a una ronda");
      return;
    }

    setSubmitting(true);
    selectCards(playerId, selectedIds);
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
