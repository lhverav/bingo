import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import YoutubePlayer from "react-native-youtube-iframe";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import {
  useConnectionState,
  useGameJoinSocket,
  useGameLifecycleEvents,
  useGameCardEvents,
  useSocketEmit,
} from "@/hooks";
import { GameLobbyModal } from "@/components/GameLobbyModal";
import { InlineGameView } from "@/components/InlineGameView";
import ProfileAvatar from "@/components/ProfileAvatar";
import ProfileDrawer from "@/components/ProfileDrawer";
import BingoCard from "@/components/BingoCard";
import { GameWithRounds, getPublishedGame, formatGameDate } from "@/api/games";
import { serverConfig } from "@/config/server";

const YOUTUBE_VIDEO_ID =
  process.env.EXPO_PUBLIC_YOUTUBE_VIDEO_ID || "dQw4w9WgXcQ";

interface ActiveRound {
  id: string;
  name: string;
  order: number;
  status: string;
  patternName?: string;
  gameName: string;
  gameId: string;
  cardType: "bingo" | "bingote";
}

interface PlayerCard {
  id: string;
  cells: number[][];
}

export default function MainScreen() {
  const { loading: authLoading, user } = useAuth();
  const { connect } = useSocket();
  const { joinedGames, addJoinedGame, removeJoinedGame } = useGame();
  const isConnected = useConnectionState();
  const insets = useSafeAreaInsets();
  const { viewGameCards } = useSocketEmit();

  // Profile drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Video player state
  const [playing, setPlaying] = useState(false);

  // Game data state
  const [publishedGame, setPublishedGame] = useState<GameWithRounds | null>(null);
  const [loadingGame, setLoadingGame] = useState(true);

  // Game lobby modal state
  const [lobbyModalVisible, setLobbyModalVisible] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Player cards state
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const cardsRequestedRef = useRef(false);

  // Active round state (for State C1 - round notification)
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);

  // Flag: Can user play the active round? Only true if round started while user was ready
  const [canPlayActiveRound, setCanPlayActiveRound] = useState(false);

  // Playing round state (for State D)
  const [playingRound, setPlayingRound] = useState<ActiveRound | null>(null);

  // Leave game confirmation dialog
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [gameToLeave, setGameToLeave] = useState<string | null>(null);

  // Compute current state
  const joinedGameId = Object.keys(joinedGames)[0] || null;
  const joinedGameInfo = joinedGameId ? joinedGames[joinedGameId] : null;
  const hasJoinedGame = !!joinedGameId;
  const hasCards = playerCards.length > 0;
  const isPlayingRound = !!playingRound;

  // Use RxJS-based game join socket for leave functionality
  const { leaveGame } = useGameJoinSocket({
    onLeftGame: (data) => {
      console.log("[main] Left game:", data);
      removeJoinedGame(data.gameId);
      setPlayerCards([]);
      setActiveRound(null);
      setPlayingRound(null);
      setCanPlayActiveRound(false);
    },
    onGameLeaveError: (error) => {
      console.error("[main] Leave game error:", error.message);
      Alert.alert("Error", error.message);
    },
  });

  // Listen for game-level card events
  useGameCardEvents({
    onGameCardsCurrent: (data) => {
      console.log("[main] Current cards received:", data);
      setLoadingCards(false);
      if (data.hasCards && data.cards.length > 0) {
        setPlayerCards(data.cards);
      } else {
        setPlayerCards([]);
      }
    },
    onGameCardsError: (error) => {
      console.error("[main] Cards error:", error.message);
      setLoadingCards(false);
    },
  });

  // Listen for game lifecycle events to refresh data
  useGameLifecycleEvents({
    onGameCreated: () => {
      console.log("[main] Game created, refreshing...");
      loadPublishedGame();
    },
    onGamePublished: () => {
      console.log("[main] Game published/unpublished, refreshing...");
      loadPublishedGame();
    },
    onGameStatusChanged: (event) => {
      console.log("[main] Game status changed:", event);
      loadPublishedGame();
      // If game finished/cancelled, clear joined state
      if (event.status === "finished" || event.status === "cancelled") {
        if (event.gameId === joinedGameId) {
          removeJoinedGame(event.gameId);
          setPlayerCards([]);
          setActiveRound(null);
          setPlayingRound(null);
          setCanPlayActiveRound(false);
        }
      }
    },
    onRoundCreated: (event) => {
      console.log("[main] Round created:", event);
      // Refresh game data to update rounds count
      loadPublishedGame();
    },
    onRoundStatusChanged: (event) => {
      console.log("[main] Round status changed:", event);
      // Check if a round started - this is a REAL-TIME event, user can play
      if (event.status === "active" && event.gameId === joinedGameId) {
        console.log("[main] Round started in real-time, user CAN play");
        setCanPlayActiveRound(true); // User was present when round started
        fetchActiveRoundForGame(event.gameId);
      }
      // If round ended, clear states (whether user was playing or waiting)
      if (event.status === "finished") {
        // Clear playing state if user was playing this round
        if (playingRound?.id === event.roundId) {
          setPlayingRound(null);
        }
        // Clear active round if it matches (user was waiting)
        if (activeRound?.id === event.roundId) {
          setActiveRound(null);
        }
        setCanPlayActiveRound(false);
      }
    },
  });

  // Connect to socket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Load published game on mount
  useEffect(() => {
    loadPublishedGame();
  }, []);

  // Load player cards when joined game changes
  useEffect(() => {
    if (hasJoinedGame && joinedGameInfo && isConnected && !cardsRequestedRef.current) {
      console.log("[main] Loading cards for player:", joinedGameInfo.playerId);
      cardsRequestedRef.current = true;
      setLoadingCards(true);
      viewGameCards(joinedGameInfo.playerId);
    }
    if (!hasJoinedGame) {
      cardsRequestedRef.current = false;
      setPlayerCards([]);
    }
  }, [hasJoinedGame, joinedGameInfo, isConnected, viewGameCards]);

  // Check for active rounds when user has cards
  useEffect(() => {
    if (hasJoinedGame && hasCards && joinedGameId) {
      fetchActiveRoundForGame(joinedGameId);
    }
  }, [hasJoinedGame, hasCards, joinedGameId]);

  // Auto-enter game ONLY when round started while user was ready (real-time event)
  useEffect(() => {
    if (activeRound && hasCards && !playingRound && canPlayActiveRound) {
      console.log("[main] Auto-entering game for round:", activeRound.name);
      setPlayingRound(activeRound);
      setActiveRound(null);
      setCanPlayActiveRound(false);
    }
  }, [activeRound, hasCards, playingRound, canPlayActiveRound]);

  // Refresh cards when screen comes into focus (e.g., returning from card selection)
  useFocusEffect(
    useCallback(() => {
      if (hasJoinedGame && joinedGameInfo && isConnected) {
        console.log("[main] Screen focused, refreshing cards");
        cardsRequestedRef.current = false; // Reset flag to allow refresh
        setLoadingCards(true);
        viewGameCards(joinedGameInfo.playerId);
      }
    }, [hasJoinedGame, joinedGameInfo, isConnected, viewGameCards])
  );

  const loadPublishedGame = useCallback(async () => {
    try {
      setLoadingGame(true);
      const game = await getPublishedGame();
      setPublishedGame(game);
    } catch (error) {
      console.error("[main] Error loading published game:", error);
      setPublishedGame(null);
    } finally {
      setLoadingGame(false);
    }
  }, []);

  const fetchActiveRoundForGame = useCallback(async (gameId: string) => {
    try {
      const response = await fetch(`${serverConfig.apiUrl}/games/active-rounds`);
      if (!response.ok) return;
      const rounds: ActiveRound[] = await response.json();
      // Find active round for this game
      const round = rounds.find((r) => r.gameId === gameId);
      if (round) {
        setActiveRound(round);
      } else {
        setActiveRound(null);
      }
    } catch (error) {
      console.error("[main] Error fetching active rounds:", error);
    }
  }, []);

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const handleJoinGame = useCallback((gameId: string) => {
    console.log("Opening join modal for game:", gameId);
    setSelectedGameId(gameId);
    setLobbyModalVisible(true);
  }, []);

  const handleLeaveGameRequest = useCallback((gameId: string) => {
    setGameToLeave(gameId);
    setShowLeaveConfirmation(true);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    if (gameToLeave && user?.id) {
      console.log("Leaving game:", gameToLeave);
      leaveGame(gameToLeave, user.id);
    }
    setShowLeaveConfirmation(false);
    setGameToLeave(null);
  }, [gameToLeave, user?.id, leaveGame]);

  const handleCancelLeave = useCallback(() => {
    setShowLeaveConfirmation(false);
    setGameToLeave(null);
  }, []);

  const handleGameJoined = useCallback(
    (gameId: string, playerId: string, playerCode: string) => {
      console.log("Game joined:", gameId, "PlayerId:", playerId, "Code:", playerCode);
      addJoinedGame(gameId, playerId, playerCode);
      setLobbyModalVisible(false);
      setSelectedGameId(null);
      // Reset cards request flag so we fetch cards for new game
      cardsRequestedRef.current = false;
    },
    [addJoinedGame]
  );

  const handleSelectCards = useCallback((gameId: string) => {
    console.log("Select cards for game:", gameId);
    router.push({
      pathname: "/card-selection",
      params: { gameId },
    });
  }, []);

  const handleLobbyClose = useCallback(() => {
    setLobbyModalVisible(false);
    setSelectedGameId(null);
  }, []);

  const handlePlayRound = useCallback(() => {
    if (activeRound) {
      console.log("Playing round:", activeRound.id);
      setPlayingRound(activeRound);
      setActiveRound(null);
    }
  }, [activeRound]);

  const handleExitRound = useCallback(() => {
    console.log("Exiting round");
    setPlayingRound(null);
    setCanPlayActiveRound(false);
    // Check for next active round (but user won't auto-enter since they left mid-round)
    if (joinedGameId) {
      fetchActiveRoundForGame(joinedGameId);
    }
  }, [joinedGameId, fetchActiveRoundForGame]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // =========================================================================
  // RENDER STATE D: Playing Round
  // =========================================================================
  if (isPlayingRound && playingRound) {
    return (
      <View style={styles.container}>
        {/* Header with Profile Avatar */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <ProfileAvatar
            name={user?.name || ""}
            size={40}
            onPress={() => setDrawerVisible(true)}
          />
          <Text style={styles.headerTitle}>Bingote de Oro</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* YouTube Video Player */}
        <View style={styles.videoContainer}>
          <YoutubePlayer
            height={180}
            width={Dimensions.get("window").width - 32}
            play={playing}
            videoId={YOUTUBE_VIDEO_ID}
            onChangeState={onStateChange}
          />
        </View>

        {/* Disabled Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDisabled]} disabled>
            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>
              CAMBIAR CARTONES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.leaveButton, styles.leaveButtonDisabled]} disabled>
            <Text style={[styles.leaveButtonText, styles.leaveButtonTextDisabled]}>
              SALIR DEL JUEGO
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inline Game View */}
        <View style={styles.contentContainer}>
          <InlineGameView
            roundId={playingRound.id}
            roundName={playingRound.name}
            gameName={playingRound.gameName}
            patternName={playingRound.patternName}
            cardType={playingRound.cardType}
            onExit={handleExitRound}
          />
        </View>

        {/* Profile Drawer */}
        <ProfileDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        />
      </View>
    );
  }

  // =========================================================================
  // RENDER COMMON HEADER + VIDEO
  // =========================================================================
  const renderHeader = () => (
    <>
      {/* Header with Profile Avatar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ProfileAvatar
          name={user?.name || ""}
          size={40}
          onPress={() => setDrawerVisible(true)}
        />
        <Text style={styles.headerTitle}>Bingote de Oro</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* YouTube Video Player */}
      <View style={styles.videoContainer}>
        <YoutubePlayer
          height={180}
          width={Dimensions.get("window").width - 32}
          play={playing}
          videoId={YOUTUBE_VIDEO_ID}
          onChangeState={onStateChange}
        />
      </View>
    </>
  );

  // =========================================================================
  // RENDER STATE A: Not Joined Any Game
  // =========================================================================
  if (!hasJoinedGame) {
    return (
      <View style={styles.container}>
        {renderHeader()}

        {/* Dynamic Content - Next Game Info */}
        <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
          {loadingGame ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Cargando juego...</Text>
            </View>
          ) : publishedGame ? (
            <View style={styles.gameInfoCard}>
              <Text style={styles.gameInfoTitle}>{publishedGame.name}</Text>

              <View style={styles.gameInfoRow}>
                <Text style={styles.gameInfoIcon}>📅</Text>
                <Text style={styles.gameInfoText}>
                  {formatGameDate(publishedGame.scheduledAt)}
                </Text>
              </View>

              <View style={styles.gameInfoRow}>
                <Text style={styles.gameInfoIcon}>🎮</Text>
                <Text style={styles.gameInfoText}>
                  {publishedGame.cardType === "bingote" ? "BINGOTE" : "BINGO"}
                </Text>
              </View>

              <View style={styles.gameInfoRow}>
                <Text style={styles.gameInfoIcon}>📋</Text>
                <Text style={styles.gameInfoText}>
                  {publishedGame.rounds.length} ronda{publishedGame.rounds.length !== 1 ? "s" : ""}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinGame(publishedGame.id)}
              >
                <Text style={styles.joinButtonText}>UNIRME</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎱</Text>
              <Text style={styles.emptyTitle}>No hay proximos juegos disponibles</Text>
              <Text style={styles.emptySubtitle}>
                Espera a que el organizador publique un juego
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Game Lobby Modal */}
        <GameLobbyModal
          key={selectedGameId || "no-game"}
          visible={lobbyModalVisible}
          gameId={selectedGameId}
          onClose={handleLobbyClose}
          onJoined={handleGameJoined}
        />

        {/* Profile Drawer */}
        <ProfileDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        />
      </View>
    );
  }

  // =========================================================================
  // RENDER STATE B: Joined Game, No Cards Selected
  // =========================================================================
  if (hasJoinedGame && !hasCards && !loadingCards) {
    return (
      <View style={styles.container}>
        {renderHeader()}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSelectCards(joinedGameId!)}
          >
            <Text style={styles.actionButtonText}>MIS CARTONES</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={() => handleLeaveGameRequest(joinedGameId!)}
          >
            <Text style={styles.leaveButtonText}>SALIR DEL JUEGO</Text>
          </TouchableOpacity>
        </View>

        {/* Empty Content */}
        <View style={[styles.contentContainer, styles.centerContent]}>
          <Text style={styles.noCardsText}>
            Selecciona tus cartones para participar
          </Text>
        </View>

        {/* Leave Confirmation Modal */}
        <Modal
          visible={showLeaveConfirmation}
          transparent
          animationType="fade"
          onRequestClose={handleCancelLeave}
        >
          <View style={styles.confirmationOverlay}>
            <View style={styles.confirmationDialog}>
              <Text style={styles.confirmationText}>
                ¿Estas seguro que deseas salir?
              </Text>
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={styles.confirmationCancelButton}
                  onPress={handleCancelLeave}
                >
                  <Text style={styles.confirmationCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmationConfirmButton}
                  onPress={handleConfirmLeave}
                >
                  <Text style={styles.confirmationConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Profile Drawer */}
        <ProfileDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        />
      </View>
    );
  }

  // =========================================================================
  // RENDER STATE C/C1: Has Cards, Waiting for Round
  // =========================================================================
  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSelectCards(joinedGameId!)}
        >
          <Text style={styles.actionButtonText}>CAMBIAR CARTONES</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.leaveButton}
          onPress={() => handleLeaveGameRequest(joinedGameId!)}
        >
          <Text style={styles.leaveButtonText}>SALIR DEL JUEGO</Text>
        </TouchableOpacity>
      </View>

      {/* Round Status Indicator (below buttons) */}
      {activeRound && (
        <View style={[
          styles.roundStatusBar,
          !canPlayActiveRound && styles.roundStatusBarWaiting
        ]}>
          {canPlayActiveRound ? (
            <Text style={styles.roundStatusText}>
              🎮 {activeRound.name} - <Text style={styles.roundStatusActive}>Entrando...</Text>
            </Text>
          ) : (
            <Text style={styles.roundStatusText}>
              ⏳ {activeRound.name} - <Text style={styles.roundStatusWaiting}>En Curso (Espera la siguiente ronda)</Text>
            </Text>
          )}
        </View>
      )}

      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
        {/* Note: With auto-enter, activeRound state triggers automatic game entry */}

        {/* Loading Cards */}
        {loadingCards && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Cargando cartones...</Text>
          </View>
        )}

        {/* Player Cards Display */}
        {!loadingCards && hasCards && (
          <View style={styles.cardsSection}>
            <Text style={styles.cardsSectionTitle}>Mis Cartones</Text>
            <View style={styles.cardsGrid}>
              {playerCards.map((card) => (
                <View key={card.id} style={styles.cardWrapper}>
                  <BingoCard
                    id={card.id}
                    cells={card.cells}
                    selected={false}
                    disabled={true}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Leave Confirmation Modal */}
      <Modal
        visible={showLeaveConfirmation}
        transparent
        animationType="fade"
        onRequestClose={handleCancelLeave}
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationDialog}>
            <Text style={styles.confirmationText}>
              ¿Estas seguro que deseas salir?
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={styles.confirmationCancelButton}
                onPress={handleCancelLeave}
              >
                <Text style={styles.confirmationCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmationConfirmButton}
                onPress={handleConfirmLeave}
              >
                <Text style={styles.confirmationConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Drawer */}
      <ProfileDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  videoContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  // State A - Game Info Card
  gameInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  gameInfoTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  gameInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  gameInfoIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  gameInfoText: {
    fontSize: 16,
    color: "#666",
  },
  joinButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  // Action Buttons (State B, C, C1)
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#388E3C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  actionButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonTextDisabled: {
    color: "#999",
  },
  leaveButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e74c3c",
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e74c3c",
  },
  leaveButtonDisabled: {
    borderColor: "#ccc",
  },
  leaveButtonTextDisabled: {
    color: "#999",
  },
  noCardsText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  // Round Status Bar (below action buttons)
  roundStatusBar: {
    backgroundColor: "#e8f5e9",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#c8e6c9",
  },
  roundStatusBarWaiting: {
    backgroundColor: "#fff3e0",
    borderBottomColor: "#ffe0b2",
  },
  roundStatusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  roundStatusActive: {
    color: "#27ae60",
    fontWeight: "bold",
  },
  roundStatusWaiting: {
    color: "#f57c00",
    fontWeight: "bold",
  },
  // Cards Section
  cardsSection: {
    marginTop: 8,
  },
  cardsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  // Confirmation Dialog
  confirmationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationDialog: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 320,
    alignItems: "center",
  },
  confirmationText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  confirmationCancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  confirmationCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  confirmationConfirmButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  confirmationConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
