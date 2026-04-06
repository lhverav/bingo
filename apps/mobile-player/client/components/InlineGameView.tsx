import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useState, useCallback, useRef, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { useGame, useAuth } from "@/contexts";
import { useGameSocket, useRoundSocket, useConnectionState } from "@/hooks";
import BingoCard from "./BingoCard";

// Pattern labels for display
const PATTERN_LABELS: Record<string, string> = {
  linea: "Linea",
  columna: "Columna",
  diagonal: "Diagonal",
  completo: "Carton Completo",
  figura_especial: "Figura Especial",
};

// Layout constants for responsive design
const CONTAINER_PADDING = 12; // matches container padding
const SIDEBAR_WIDTH = 50; // width for mini cards sidebar
const SIDEBAR_MARGIN = 16; // margin/gap between card and sidebar

// Calculate available card width based on screen size
const calculateCardWidth = (screenWidth: number, hasSidebar: boolean): number => {
  if (!hasSidebar) {
    return screenWidth - (CONTAINER_PADDING * 2);
  }
  return screenWidth - (CONTAINER_PADDING * 2) - SIDEBAR_WIDTH - SIDEBAR_MARGIN;
};

// Letter ranges for bingo (5x5) and bingote (7x5)
const BINGO_RANGES = [
  { letter: 'B', min: 1, max: 15 },
  { letter: 'I', min: 16, max: 30 },
  { letter: 'N', min: 31, max: 45 },
  { letter: 'G', min: 46, max: 60 },
  { letter: 'O', min: 61, max: 75 },
];

const BINGOTE_RANGES = [
  { letter: 'B', min: 1, max: 15 },
  { letter: 'I', min: 16, max: 30 },
  { letter: 'N', min: 31, max: 45 },
  { letter: 'G', min: 46, max: 60 },
  { letter: 'O', min: 61, max: 75 },
  { letter: 'T', min: 76, max: 89 },
  { letter: 'E', min: 90, max: 103 },
];

// Get letter for a number based on card type
const getLetterForNumber = (num: number, cardType: 'bingo' | 'bingote' = 'bingo'): string => {
  const ranges = cardType === 'bingote' ? BINGOTE_RANGES : BINGO_RANGES;
  for (const range of ranges) {
    if (num >= range.min && num <= range.max) {
      return range.letter;
    }
  }
  return '';
};

interface InlineGameViewProps {
  roundId: string;
  roundName: string;
  gameName: string;
  patternName?: string;
  cardType: 'bingo' | 'bingote';
  onExit: () => void;
}

export function InlineGameView({
  roundId,
  roundName,
  gameName,
  patternName,
  cardType: propCardType,
  onExit,
}: InlineGameViewProps) {
  const { user } = useAuth();
  const {
    playerId,
    playerCode,
    cards,
    selectedCardIds,
    winningCardIds,
    isWinner,
    roundPattern,
    patternCells,
    cardType,
    drawnNumbers,
    lastDrawn,
    markedNumbers,
    roundPlayStatus,
    setRoundInfo,
    setRoundPattern,
    setCards,
    setSelectedCards,
    setWinningCards,
    setIsWinner,
    clearGame,
    addDrawnNumber,
    markNumber,
    setRoundPlayStatus,
  } = useGame();

  const isConnected = useConnectionState();
  const [showPatternPopup, setShowPatternPopup] = useState(false);
  const [screenFrozen, setScreenFrozen] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);
  const joinAttemptedRef = useRef(false);

  // Listen for screen dimension changes (e.g., rotation)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  // Animation for BINGO button
  const bingoButtonScale = useRef(new Animated.Value(1)).current;

  // Filter cards to only show selected ones
  const selectedCards = cards.filter((card) => selectedCardIds.includes(card.id));

  // Play vibration for ball announcement
  const playBallNotification = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log("Haptic feedback error:", error);
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

  // Join round socket events
  const { joinRound } = useRoundSocket({
    onJoinedRound: (data) => {
      console.log("[InlineGameView] Joined round:", data);
      setRoundInfo(roundId, data.player.id, data.player.playerCode);

      if (data.roundPattern) {
        setRoundPattern(data.roundPattern, data.patternCells || undefined);
      }

      // If player already has cards (ready status), load them and go to waiting
      if (data.player.status === "ready") {
        // Set cards from server response
        if (data.cards && data.cards.length > 0) {
          setCards(data.cards, null);
          setSelectedCards(data.player.selectedCardIds || data.cards.map((c: { id: string }) => c.id));
        }
        setRoundPlayStatus("waiting");
      } else {
        // Need to request cards - but for inline view, we expect game-level cards
        setJoinError("No tienes cartones seleccionados para este juego");
      }
    },
    onCardsDelivered: (data) => {
      console.log("[InlineGameView] Cards delivered:", data);
      setCards(data.cards, new Date(data.deadline));
      setRoundPlayStatus("waiting");
    },
    onCardsConfirmed: (data) => {
      console.log("[InlineGameView] Cards confirmed:", data);
      setSelectedCards(data.selectedCardIds);
      setRoundPlayStatus("waiting");
    },
    onError: (error) => {
      console.error("[InlineGameView] Error:", error.message);
      setJoinError(error.message);
    },
  });

  // Game socket events
  const { leaveRound } = useGameSocket({
    onGameStarted: () => {
      console.log("[InlineGameView] Game started");
      setRoundPlayStatus("playing");
    },
    onBallAnnounced: (event) => {
      console.log("[InlineGameView] Ball announced:", event.number);
      addDrawnNumber(event.number);
      setRoundPlayStatus("playing");
      playBallNotification();
    },
    onWinnersDetected: (event) => {
      console.log("[InlineGameView] Winners detected:", event.winningCardIds);
      setWinningCards(event.winningCardIds);
    },
    onGameEnding: (event) => {
      console.log("[InlineGameView] Game ending");
      setRoundPlayStatus("ended");
    },
    onError: (error) => {
      console.error("[InlineGameView] Server error:", error.message);
    },
  });

  // Join round on mount (only if not already playing)
  useEffect(() => {
    // Skip if not connected
    if (!isConnected) return;

    // Skip if already joined this round (status is waiting, playing, or ended)
    if (roundPlayStatus !== "idle" && roundPlayStatus !== "joining") {
      console.log("[InlineGameView] Already in round, status:", roundPlayStatus);
      return;
    }

    // Skip if already attempted join in this session
    if (joinAttemptedRef.current) return;

    joinAttemptedRef.current = true;
    setRoundPlayStatus("joining");
    console.log("[InlineGameView] Joining round:", roundId, "user:", user?.id);
    joinRound(roundId, user?.id);
  }, [isConnected, roundId, joinRound, user?.id, roundPlayStatus, setRoundPlayStatus]);

  const handleMarkNumber = useCallback(
    (cardId: string, number: number) => {
      if (screenFrozen) return;
      if (!drawnNumbers.includes(number)) return;
      markNumber(cardId, number);
    },
    [drawnNumbers, screenFrozen, markNumber]
  );

  const handleClaimBingo = useCallback(() => {
    const myWinningCard = selectedCardIds.find((cardId) =>
      winningCardIds.includes(cardId)
    );

    if (myWinningCard) {
      playWinSound();
      setIsWinner(true);
      setScreenFrozen(true);
    } else {
      animateBingoButton();
    }
  }, [selectedCardIds, winningCardIds, playWinSound, setIsWinner, animateBingoButton]);

  const handleExit = useCallback(() => {
    leaveRound();
    clearGame();
    onExit();
  }, [leaveRound, clearGame, onExit]);

  // Get pattern mask for visualization
  const getPatternMask = (): boolean[][] => {
    if (patternCells && patternCells.length > 0) {
      return patternCells;
    }

    const cols = propCardType === 'bingote' ? 7 : 5;
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

  // Joining state (idle or joining)
  if (roundPlayStatus === "idle" || roundPlayStatus === "joining") {
    if (joinError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{joinError}</Text>
          <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
            <Text style={styles.exitButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.joiningText}>Uniendose a la ronda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Winner overlay */}
      {isWinner && (
        <View style={styles.winnerOverlay}>
          <Text style={styles.winnerText}>Ganaste!!</Text>
          <TouchableOpacity style={styles.homeButton} onPress={handleExit}>
            <Text style={styles.homeButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header with exit button */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.gameName}>{gameName}</Text>
          <View style={styles.roundNameRow}>
            <Text style={styles.roundName}>{roundName}</Text>
            <TouchableOpacity
              style={styles.patternButtonSmall}
              onPressIn={() => setShowPatternPopup(true)}
              onPressOut={() => setShowPatternPopup(false)}
            >
              <Text style={styles.patternButtonSmallText}>Patron</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.playerCode}>Codigo: {playerCode}</Text>
        </View>
        <TouchableOpacity style={styles.exitButtonSmall} onPress={handleExit}>
          <Text style={styles.exitButtonSmallText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Status indicator */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, roundPlayStatus === "playing" ? styles.statusDotActive : styles.statusDotWaiting]} />
        <Text style={styles.statusText}>
          {roundPlayStatus === "waiting" && "Esperando inicio..."}
          {roundPlayStatus === "playing" && "En juego"}
          {roundPlayStatus === "ended" && "Finalizado"}
        </Text>
      </View>

      {/* Last drawn number and history - side by side */}
      <View style={styles.numbersRow}>
        {/* Last drawn number */}
        <View style={styles.lastDrawnSection}>
          <Text style={styles.lastDrawnLabel}>Ultimo</Text>
          <View style={styles.lastDrawnBall}>
            {lastDrawn !== null ? (
              <>
                <Text style={styles.lastDrawnLetter}>{getLetterForNumber(lastDrawn, propCardType)}</Text>
                <Text style={styles.lastDrawnNumber}>{lastDrawn}</Text>
              </>
            ) : (
              <Text style={styles.lastDrawnNumber}>-</Text>
            )}
          </View>
        </View>

        {/* Drawn numbers history */}
        <View style={styles.drawnHistorySection}>
          <Text style={styles.drawnHistoryLabel}>
            Numeros ({drawnNumbers.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.drawnHistoryScroll}
          >
            <View style={styles.drawnNumbersList}>
              {drawnNumbers.map((num, index) => (
                <View key={index} style={styles.drawnNumberBadge}>
                  <Text style={styles.drawnNumberLetter}>{getLetterForNumber(num, propCardType)}</Text>
                  <Text style={styles.drawnNumberText}>{num}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

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
              {patternName || PATTERN_LABELS[roundPattern || "linea"]}
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

      {/* Player's cards - Split View */}
      <View style={styles.splitViewContainer}>
        {selectedCards.length === 0 ? (
          <Text style={styles.noCards}>Cargando cartones...</Text>
        ) : (
          <>
            {/* Main Card (Focus) */}
            <View style={[
              styles.mainCardContainer,
              // Full width if no sidebar needed
              selectedCards.length === 1 && styles.mainCardContainerFull
            ]}>
              <BingoCard
                id={selectedCards[activeCardIndex]?.id || ""}
                cells={selectedCards[activeCardIndex]?.cells || []}
                markedNumbers={markedNumbers[selectedCards[activeCardIndex]?.id] || []}
                onMarkNumber={(number) => handleMarkNumber(selectedCards[activeCardIndex]?.id, number)}
                disabled={roundPlayStatus !== "playing" || screenFrozen}
                maxWidth={calculateCardWidth(screenWidth, selectedCards.length > 1)}
              />
            </View>

            {/* Mini Cards Sidebar (Overview) */}
            {selectedCards.length > 1 && (
              <View style={styles.miniCardsSidebarContainer}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {selectedCards.map((card, index) => {
                    const markedCount = (markedNumbers[card.id] || []).length;
                    const isActive = index === activeCardIndex;
                    const isWinningCard = winningCardIds.includes(card.id);

                    return (
                      <TouchableOpacity
                        key={card.id}
                        style={[
                          styles.miniCard,
                          isActive && styles.miniCardActive,
                          isWinningCard && styles.miniCardWinner,
                        ]}
                        onPress={() => setActiveCardIndex(index)}
                      >
                        <Text style={[styles.miniCardNumber, isActive && styles.miniCardNumberActive]}>
                          {index + 1}
                        </Text>
                        <View style={styles.miniCardProgress}>
                          <View
                            style={[
                              styles.miniCardProgressBar,
                              { width: `${Math.min((markedCount / 24) * 100, 100)}%` }
                            ]}
                          />
                        </View>
                        <Text style={styles.miniCardCount}>{markedCount}</Text>
                        {isWinningCard && <Text style={styles.miniCardWinnerBadge}>★</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </View>

      {/* BINGO button - positioned at bottom */}
      {roundPlayStatus === "playing" && !screenFrozen && (
        <Animated.View style={[styles.bingoButtonContainer, { transform: [{ scale: bingoButtonScale }] }]}>
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
    padding: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  joiningText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headerInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 12,
    color: "#888",
  },
  roundNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roundName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  patternButtonSmall: {
    backgroundColor: "#3498db",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  patternButtonSmallText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  playerCode: {
    fontSize: 12,
    color: "#FFD700",
    fontWeight: "600",
  },
  exitButtonSmall: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  exitButtonSmallText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  exitButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
  },
  exitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotWaiting: {
    backgroundColor: "#f39c12",
  },
  statusDotActive: {
    backgroundColor: "#27ae60",
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  numbersRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  lastDrawnSection: {
    alignItems: "center",
  },
  lastDrawnLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
  },
  lastDrawnBall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  lastDrawnLetter: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    marginTop: -2,
  },
  lastDrawnNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: -2,
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
  },
  patternPopupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  patternGrid: {
    gap: 3,
  },
  patternRow: {
    flexDirection: "row",
    gap: 3,
  },
  patternCell: {
    width: 24,
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
  },
  patternCellActive: {
    backgroundColor: "#FFD700",
  },
  drawnHistorySection: {
    flex: 1,
  },
  drawnHistoryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  drawnHistoryScroll: {
    maxHeight: 56,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  drawnNumbersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  drawnNumberBadge: {
    minWidth: 36,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  drawnNumberLetter: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#3498db",
  },
  drawnNumberText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  // Split View Styles
  splitViewContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 85, // Space for BINGO button (lifted higher for device buttons)
  },
  mainCardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  mainCardContainerFull: {
    // When there's only one card, center it with full width
    paddingHorizontal: 0,
  },
  miniCardsSidebarContainer: {
    width: SIDEBAR_WIDTH,
    marginLeft: SIDEBAR_MARGIN,
  },
  miniCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
    marginBottom: 6,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
    width: SIDEBAR_WIDTH - 8, // account for margin
  },
  miniCardActive: {
    borderColor: "#FFD700",
    backgroundColor: "#fffef0",
  },
  miniCardWinner: {
    borderColor: "#27ae60",
    backgroundColor: "#e8f8e8",
  },
  miniCardNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  miniCardNumberActive: {
    color: "#333",
  },
  miniCardProgress: {
    width: "100%",
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    marginVertical: 4,
    overflow: "hidden",
  },
  miniCardProgressBar: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  miniCardCount: {
    fontSize: 10,
    color: "#888",
  },
  miniCardWinnerBadge: {
    fontSize: 12,
    color: "#FFD700",
    marginTop: 2,
  },
  noCards: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    flex: 1,
  },
  bingoButtonContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bingoButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
    shadowColor: "#c0392b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  bingoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  homeButton: {
    backgroundColor: "#3498db",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 16,
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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  winnerText: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFD700",
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});

export default InlineGameView;
