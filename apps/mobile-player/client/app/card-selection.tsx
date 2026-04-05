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
import { useGame, useSocket } from "@/contexts";
import {
  useRoundSocket,
  useGameCardSocket,
  useConnectionState,
} from "@/hooks";
import BingoCard from "../components/BingoCard";
import CountdownTimer from "../components/CountdownTimer";

interface Card {
  id: string;
  cells: number[][];
}

type ScreenMode = 'loading' | 'viewing' | 'selecting';

export default function CardSelectionScreen() {
  console.log("[card-selection.tsx] Component RENDERING");

  const { roundId, gameId } = useLocalSearchParams<{
    roundId?: string;
    gameId?: string;
  }>();

  console.log("[card-selection.tsx] Params - roundId:", roundId, "gameId:", gameId);
  const {
    playerId: contextPlayerId,
    playerCode: contextPlayerCode,
    cards,
    deadline,
    setCards,
    setSelectedCards,
    getJoinedGameInfo,
    removeJoinedGame,
  } = useGame();
  const { reconnect } = useSocket();
  const isConnected = useConnectionState();

  // If navigated with gameId (not roundId), use game-level card selection
  const isGameLevel = !!gameId && !roundId;

  // For game-level, get playerId from joinedGames; for round-level, use context
  const gameInfo = isGameLevel && gameId ? getJoinedGameInfo(gameId) : null;
  const playerId = isGameLevel ? gameInfo?.playerId : contextPlayerId;
  const playerCode = isGameLevel ? gameInfo?.playerCode : contextPlayerCode;
  const [hasInvalidData, setHasInvalidData] = useState(false);

  // Screen mode: loading -> viewing (if has cards) or selecting (if no cards)
  const [mode, setMode] = useState<ScreenMode>('loading');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [maxSelectable, setMaxSelectable] = useState(2);
  const cardsRequestedRef = useRef(false);
  const viewRequestedRef = useRef(false);

  // Game-level card state
  const [gameCards, setGameCards] = useState<Card[]>([]);
  const [gameDeadline, setGameDeadline] = useState<Date | null>(null);

  // Current cards (for viewing mode)
  const [currentCards, setCurrentCards] = useState<Card[]>([]);

  // Ensure socket is connected when coming from games.tsx
  useEffect(() => {
    if (isGameLevel && !isConnected) {
      console.log("[card-selection.tsx] Socket not connected, reconnecting...");
      reconnect();
    }
  }, [isGameLevel, isConnected, reconnect]);

  // Handle invalid playerId - redirect to rejoin the game
  useEffect(() => {
    if (isGameLevel && gameId && gameInfo && !gameInfo.playerId) {
      console.log("[card-selection.tsx] Invalid playerId detected, clearing corrupted data");
      setHasInvalidData(true);
      removeJoinedGame(gameId);
      Alert.alert(
        "Sesion Invalida",
        "Debes volver a unirte al juego.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/main"),
          },
        ]
      );
    }
  }, [isGameLevel, gameId, gameInfo, removeJoinedGame]);

  // =========================================================================
  // GAME-LEVEL CARD HOOKS
  // =========================================================================
  const { requestGameCards, selectGameCards, viewGameCards } = useGameCardSocket({
    // When viewing current cards
    onGameCardsCurrent: (data) => {
      console.log("[card-selection.tsx] Current cards received:", data);
      if (data.hasCards && data.cards.length > 0) {
        // Player has cards - show viewing mode
        setCurrentCards(data.cards);
        setMode('viewing');
      } else {
        // Player has no cards - go directly to selection
        console.log("[card-selection.tsx] No cards, requesting new cards for selection");
        cardsRequestedRef.current = true;
        requestGameCards(playerId!);
      }
    },
    // When new cards are delivered for selection
    onGameCardsDelivered: (data) => {
      console.log("[card-selection.tsx] Game cards delivered:", data);
      setGameCards(data.cards);
      setGameDeadline(new Date(data.deadline));
      setMaxSelectable(data.maxSelectable);
      setMode('selecting');
    },
    onGameCardsConfirmed: (data) => {
      console.log("[card-selection.tsx] Game cards confirmed:", data);
      setSubmitting(false);
      Alert.alert(
        "Cartones Confirmados",
        `Has seleccionado ${data.selectedCardIds.length} carton(es).`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/main"),
          },
        ]
      );
    },
    onGameCardsAutoAssigned: (data) => {
      console.log("[card-selection.tsx] Game cards auto-assigned:", data);
      const message = data.keptPreviousCards
        ? "El tiempo expiro. Se mantuvieron tus cartones anteriores."
        : "El tiempo expiro. Se te asignaron cartones automaticamente.";
      Alert.alert("Tiempo Agotado", message, [
        {
          text: "OK",
          onPress: () => router.replace("/main"),
        },
      ]);
    },
    onGameCardsError: (error) => {
      console.error("[card-selection.tsx] Game cards error:", error.message);
      Alert.alert("Error", error.message);
      setMode('loading');
      setSubmitting(false);
    },
  });

  // =========================================================================
  // ROUND-LEVEL CARD SELECTION (original flow)
  // =========================================================================
  const { requestCards, selectCards } = useRoundSocket({
    onCardsDelivered: (data) => {
      console.log("[card-selection.tsx] Cards delivered (round):", data);
      setCards(data.cards, new Date(data.deadline));
      setMode('selecting');
    },
    onCardsConfirmed: (data) => {
      console.log("[card-selection.tsx] Cards confirmed (round):", data);
      setSelectedCards(data.selectedCardIds);
      router.replace({
        pathname: "/game",
        params: { roundId },
      });
    },
    onCardsAutoAssigned: (data) => {
      console.log("[card-selection.tsx] Cards auto-assigned (round):", data);
      setSelectedCards(data.selectedCardIds);
      Alert.alert("Tiempo agotado", "Se te asignaron cartones automaticamente.", [
        { text: "OK" },
      ]);
      router.replace({
        pathname: "/game",
        params: { roundId },
      });
    },
    onError: (error) => {
      console.error("[card-selection.tsx] Server error (round):", error.message);
      Alert.alert("Error", error.message);
      setMode('loading');
    },
  });

  // =========================================================================
  // INITIAL DATA FETCH
  // =========================================================================
  useEffect(() => {
    if (!isConnected || !playerId) return;
    if (viewRequestedRef.current || cardsRequestedRef.current) return;

    if (isGameLevel) {
      // Game-level: first VIEW current cards
      viewRequestedRef.current = true;
      console.log("[card-selection.tsx] Viewing current cards for player:", playerId);
      viewGameCards(playerId);
    } else {
      // Round-level: skip if we already have cards (reconnect scenario)
      if (cards.length > 0) {
        setMode('selecting');
        return;
      }
      cardsRequestedRef.current = true;
      console.log("[card-selection.tsx] Requesting round cards for player:", playerId);
      requestCards(playerId);
    }
  }, [isConnected, playerId, isGameLevel, cards.length, requestCards, viewGameCards]);

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleSelectCard = useCallback(
    (cardId: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(cardId)) {
          return prev.filter((id) => id !== cardId);
        }
        if (prev.length >= maxSelectable) {
          return prev;
        }
        return [...prev, cardId];
      });
    },
    [maxSelectable]
  );

  const handleTimeout = useCallback(() => {
    console.log("Selection timed out - server will handle auto-assignment");
  }, []);

  const handleConfirmSelection = () => {
    if (selectedIds.length === 0) {
      Alert.alert("Error", "Debes seleccionar al menos un carton");
      return;
    }

    if (!playerId) {
      Alert.alert("Error", "No estas conectado");
      return;
    }

    setSubmitting(true);

    if (isGameLevel) {
      selectGameCards(playerId, selectedIds);
    } else {
      selectCards(playerId, selectedIds);
    }
  };

  const handleChangeCards = () => {
    // Request new cards for selection
    console.log("[card-selection.tsx] User wants to change cards");
    cardsRequestedRef.current = true;
    requestGameCards(playerId!);
  };

  const handleGoBack = () => {
    router.replace("/main");
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  if (hasInvalidData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Redirigiendo...</Text>
      </View>
    );
  }

  if (mode === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando cartones...</Text>
      </View>
    );
  }

  // =========================================================================
  // VIEWING MODE - Show current cards with option to change
  // =========================================================================
  if (mode === 'viewing') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Cartones</Text>
          <Text style={styles.playerCode}>Codigo: {playerCode}</Text>
        </View>

        <Text style={styles.instructions}>
          Tienes {currentCards.length} carton{currentCards.length !== 1 ? "es" : ""} seleccionado{currentCards.length !== 1 ? "s" : ""}
        </Text>

        <ScrollView
          style={styles.cardsContainer}
          contentContainerStyle={styles.cardsContent}
        >
          {currentCards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              <BingoCard
                id={card.id}
                cells={card.cells}
                selected={false}
                disabled={true}
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleGoBack}
          >
            <Text style={styles.cancelButtonText}>Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, styles.confirmButtonWithCancel]}
            onPress={handleChangeCards}
          >
            <Text style={styles.confirmButtonText}>Cambiar Cartones</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // SELECTING MODE - Select from available cards
  // =========================================================================
  const displayCards = isGameLevel ? gameCards : cards;
  const displayDeadline = isGameLevel ? gameDeadline : deadline;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {currentCards.length > 0 ? "Cambiar Cartones" : "Selecciona tus Cartones"}
        </Text>
        <Text style={styles.playerCode}>Codigo: {playerCode}</Text>
      </View>

      {displayDeadline && (
        <CountdownTimer deadline={displayDeadline} onTimeout={handleTimeout} />
      )}

      {currentCards.length > 0 && (
        <View style={styles.changeWarning}>
          <Text style={styles.changeWarningText}>
            Si el tiempo expira, se mantendran tus cartones anteriores.
          </Text>
        </View>
      )}

      <Text style={styles.instructions}>
        Selecciona hasta {maxSelectable} cartones ({selectedIds.length}{" "}
        seleccionado{selectedIds.length !== 1 ? "s" : ""})
      </Text>

      <ScrollView
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContent}
      >
        {displayCards.map((card) => (
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

      <View style={styles.buttonContainer}>
        {isGameLevel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleGoBack}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.confirmButton,
            isGameLevel && styles.confirmButtonWithCancel,
            selectedIds.length === 0 && styles.confirmButtonDisabled,
            submitting && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmSelection}
          disabled={selectedIds.length === 0 || submitting}
        >
          <Text style={styles.confirmButtonText}>
            {submitting ? "Confirmando..." : "Confirmar Seleccion"}
          </Text>
        </TouchableOpacity>
      </View>
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
  changeWarning: {
    backgroundColor: "#FFF3CD",
    borderColor: "#FFD700",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  changeWarningText: {
    fontSize: 14,
    color: "#856404",
    textAlign: "center",
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
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    flex: 1,
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
  confirmButtonWithCancel: {
    flex: 2,
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
