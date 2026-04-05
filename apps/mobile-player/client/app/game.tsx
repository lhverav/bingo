import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
} from "react-native";
import { useState, useCallback, useRef } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useGame } from "@/contexts";
import { useGameSocket } from "@/hooks";
import BingoCard from "../components/BingoCard";

// Pattern labels for display
const PATTERN_LABELS: Record<string, string> = {
  linea: "Linea",
  columna: "Columna",
  diagonal: "Diagonal",
  completo: "Carton Completo",
  figura_especial: "Figura Especial",
};

export default function GameScreen() {
  const {
    playerCode,
    cards,
    selectedCardIds,
    winningCardIds,
    isWinner,
    roundPattern,
    patternCells,
    cardType,
    clearGame,
    setWinningCards,
    setIsWinner,
    setGameEnded,
  } = useGame();

  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [lastDrawn, setLastDrawn] = useState<number | null>(null);
  const [markedNumbers, setMarkedNumbers] = useState<Record<string, number[]>>({});
  const [gameStatus, setGameStatus] = useState<"waiting" | "playing" | "ended">("waiting");
  const [showPatternPopup, setShowPatternPopup] = useState(false);
  const [screenFrozen, setScreenFrozen] = useState(false);

  // Animation for BINGO button
  const bingoButtonScale = useRef(new Animated.Value(1)).current;

  // Filter cards to only show selected ones
  const selectedCards = cards.filter((card) => selectedCardIds.includes(card.id));

  // Play sound and vibration for ball announcement
  const playBallNotification = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log("Notification feedback error:", error);
    }
  }, []);

  // Play win sound
  const playWinSound = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log("Win sound error:", error);
    }
  }, []);

  // Animate BINGO button press (for false claims)
  const animateBingoButton = useCallback(() => {
    Animated.sequence([
      Animated.timing(bingoButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bingoButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bingoButtonScale]);

  // Use RxJS-based game event hooks - no stale closures, automatic cleanup
  const { leaveRound } = useGameSocket({
    onGameStarted: () => {
      console.log("[game.tsx] Game started (RxJS)");
      setGameStatus("playing");
    },
    onBallAnnounced: (event) => {
      console.log("[game.tsx] Ball announced (RxJS):", event.number);
      setDrawnNumbers((prev) => [...prev, event.number]);
      setLastDrawn(event.number);
      setGameStatus("playing");
      playBallNotification();
    },
    onWinnersDetected: (event) => {
      console.log("[game.tsx] Winners detected (RxJS):", event.winningCardIds);
      setWinningCards(event.winningCardIds);
    },
    onGameEnding: (event) => {
      console.log("[game.tsx] Game ending (RxJS):", event);
      setGameStatus("ended");
      setGameEnded(event.summary);
      router.replace("/results");
    },
    onError: (error) => {
      console.error("[game.tsx] Server error (RxJS):", error.message);
    },
  });

  const handleMarkNumber = useCallback(
    (cardId: string, number: number) => {
      // Screen frozen after winning - no more marking
      if (screenFrozen) return;

      // Silent fail if number not drawn (no alert)
      if (!drawnNumbers.includes(number)) {
        return;
      }

      // Permanent marking - no toggle (remove un-mark logic)
      setMarkedNumbers((prev) => {
        const cardMarks = prev[cardId] || [];
        // Only add if not already marked
        if (cardMarks.includes(number)) {
          return prev; // Already marked, do nothing
        }
        return {
          ...prev,
          [cardId]: [...cardMarks, number],
        };
      });
    },
    [drawnNumbers, screenFrozen]
  );

  const handleClaimBingo = useCallback(() => {
    console.log('[BINGO] Button pressed');
    console.log('[BINGO] selectedCardIds:', selectedCardIds);
    console.log('[BINGO] winningCardIds:', winningCardIds);

    // Check if any of player's selected cards are in the winning cards
    const myWinningCard = selectedCardIds.find((cardId) =>
      winningCardIds.includes(cardId)
    );

    console.log('[BINGO] myWinningCard:', myWinningCard);

    if (myWinningCard) {
      // WIN! Show celebration
      console.log('[BINGO] WIN! Setting isWinner to true');
      playWinSound();
      setIsWinner(true);
      setScreenFrozen(true);
      // Show winner modal or message handled by UI below
    } else {
      // False claim - just animate button, no message
      console.log('[BINGO] No winning card found, animating button');
      animateBingoButton();
    }
  }, [selectedCardIds, winningCardIds, playWinSound, setIsWinner, animateBingoButton]);

  const handleGoHome = () => {
    // Emit leave event to server before going home
    leaveRound();
    clearGame();
    router.replace("/main");
  };

  // Get pattern mask for visualization - uses custom cells if provided
  const getPatternMask = (): boolean[][] => {
    // If we have custom pattern cells from the server, use them
    if (patternCells && patternCells.length > 0) {
      return patternCells;
    }

    // Fallback to legacy pattern types
    const cols = cardType === 'bingote' ? 7 : 5;
    const rows = 5;
    const mask: boolean[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(false));

    switch (roundPattern) {
      case "linea":
        const middleRow = Math.floor(rows / 2);
        for (let col = 0; col < cols; col++) {
          mask[middleRow][col] = true;
        }
        break;
      case "columna":
        const middleCol = Math.floor(cols / 2);
        for (let row = 0; row < rows; row++) {
          mask[row][middleCol] = true;
        }
        break;
      case "diagonal":
        for (let i = 0; i < Math.min(rows, cols); i++) {
          mask[i][i] = true;
          if (cols - 1 - i >= 0 && cols - 1 - i < cols) {
            mask[i][cols - 1 - i] = true;
          }
        }
        break;
      case "completo":
      case "figura_especial":
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            mask[row][col] = true;
          }
        }
        break;
    }
    return mask;
  };

  return (
    <View style={styles.container}>
      {/* Winner overlay */}
      {isWinner && (
        <View style={styles.winnerOverlay}>
          <Text style={styles.winnerText}>Ganaste!!</Text>
          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
            <Text style={styles.homeButtonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Bingote de Oro</Text>
        <Text style={styles.playerCode}>Codigo: {playerCode}</Text>
        <Text style={styles.status}>
          {gameStatus === "waiting" && "Esperando inicio del juego..."}
          {gameStatus === "playing" && "Juego en curso!"}
          {gameStatus === "ended" && "Juego finalizado"}
        </Text>
      </View>

      {/* Last drawn number */}
      <View style={styles.lastDrawnSection}>
        <Text style={styles.lastDrawnLabel}>Ultimo numero</Text>
        <View style={styles.lastDrawnBall}>
          <Text style={styles.lastDrawnNumber}>
            {lastDrawn !== null ? lastDrawn : "-"}
          </Text>
        </View>
      </View>

      {/* Pattern button - above cards */}
      <TouchableOpacity
        style={styles.patternButton}
        onPressIn={() => setShowPatternPopup(true)}
        onPressOut={() => setShowPatternPopup(false)}
      >
        <Text style={styles.patternButtonText}>
          Patron: {PATTERN_LABELS[roundPattern || "linea"] || roundPattern}
        </Text>
      </TouchableOpacity>

      {/* Pattern popup */}
      <Modal
        transparent
        visible={showPatternPopup}
        animationType="fade"
        onRequestClose={() => setShowPatternPopup(false)}
      >
        <Pressable
          style={styles.patternPopupOverlay}
          onPress={() => setShowPatternPopup(false)}
        >
          <View style={styles.patternPopup}>
            <Text style={styles.patternPopupTitle}>
              {PATTERN_LABELS[roundPattern || "linea"]}
            </Text>
            <View style={styles.patternGrid}>
              {getPatternMask().map((row, rowIndex) => (
                <View key={rowIndex} style={styles.patternRow}>
                  {row.map((isActive, colIndex) => (
                    <View
                      key={colIndex}
                      style={[
                        styles.patternCell,
                        isActive && styles.patternCellActive,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Drawn numbers history */}
      <View style={styles.drawnHistorySection}>
        <Text style={styles.sectionLabel}>
          Numeros sacados ({drawnNumbers.length})
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
        {selectedCards.length === 0 ? (
          <Text style={styles.noCards}>Cargando cartones...</Text>
        ) : (
          selectedCards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              <BingoCard
                id={card.id}
                cells={card.cells}
                markedNumbers={markedNumbers[card.id] || []}
                onMarkNumber={(number) => handleMarkNumber(card.id, number)}
                disabled={gameStatus !== "playing" || screenFrozen}
              />
            </View>
          ))
        )}
      </ScrollView>

      {/* BINGO button - below all cards */}
      {gameStatus === "playing" && !screenFrozen && (
        <Animated.View style={{ transform: [{ scale: bingoButtonScale }] }}>
          <TouchableOpacity style={styles.bingoButton} onPress={handleClaimBingo}>
            <Text style={styles.bingoButtonText}>BINGO!!!</Text>
          </TouchableOpacity>
        </Animated.View>
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
    marginBottom: 10,
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
    marginBottom: 10,
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
  patternButton: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 10,
  },
  patternButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  patternPopupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  patternPopup: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  patternPopupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  patternGrid: {
    gap: 4,
  },
  patternRow: {
    flexDirection: "row",
    gap: 4,
  },
  patternCell: {
    width: 30,
    height: 30,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
  patternCellActive: {
    backgroundColor: "#FFD700",
  },
  drawnHistorySection: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
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
    backgroundColor: "#e74c3c",
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    alignSelf: "center",
    marginVertical: 10,
    shadowColor: "#c0392b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  bingoButtonText: {
    color: "#fff",
    fontSize: 24,
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
  winnerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  winnerText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFD700",
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});
