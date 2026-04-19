import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import YoutubePlayer from "react-native-youtube-iframe";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import {
  useNotifications,
  useConnectionState,
  useGameJoinSocket,
  useGameLifecycleEvents,
} from "@/hooks";
import { GameCarousel } from "@/components/GameCarousel";
import { GameLobbyModal } from "@/components/GameLobbyModal";
import { InlineGameView } from "@/components/InlineGameView";
import ProfileAvatar from "@/components/ProfileAvatar";
import ProfileDrawer from "@/components/ProfileDrawer";
import { serverConfig } from "@/config/server";

const YOUTUBE_VIDEO_ID =
  process.env.EXPO_PUBLIC_YOUTUBE_VIDEO_ID || "dQw4w9WgXcQ";

type TabType = "proximos" | "en-curso";

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

export default function MainScreen() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { connect } = useSocket();
  const { joinedGames, addJoinedGame, removeJoinedGame } = useGame();
  const isConnected = useConnectionState();
  const insets = useSafeAreaInsets();

  // Profile drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("proximos");

  // Video player state
  const [playing, setPlaying] = useState(false);

  // Game lobby modal state
  const [lobbyModalVisible, setLobbyModalVisible] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Active rounds state (for "Juegos en Curso" tab)
  const [activeRounds, setActiveRounds] = useState<ActiveRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [refreshingRounds, setRefreshingRounds] = useState(false);

  // Refresh trigger for GameCarousel (increments when game events occur)
  const [gamesRefreshTrigger, setGamesRefreshTrigger] = useState(0);

  // Currently playing round (inline game view)
  const [playingRound, setPlayingRound] = useState<ActiveRound | null>(null);

  // Use RxJS-based game join socket for leave functionality
  const { leaveGame } = useGameJoinSocket({
    onLeftGame: (data) => {
      console.log("[main] Left game:", data);
      removeJoinedGame(data.gameId);
    },
    onGameLeaveError: (error) => {
      console.error("[main] Leave game error:", error.message);
    },
  });

  // Use RxJS-based notification hook - just refresh active rounds, no popup
  useNotifications({
    onNotification: (data) => {
      console.log("[main] Notification received:", data);
      // Auto-refresh active rounds instead of showing popup
      fetchActiveRounds();
    },
  });

  // Listen for game lifecycle events to refresh lists
  // Always fetch regardless of tab - data will be ready when user switches
  useGameLifecycleEvents({
    onGameCreated: () => {
      console.log("[main] Game created, triggering games refresh");
      setGamesRefreshTrigger((prev) => prev + 1);
    },
    onGameStatusChanged: () => {
      console.log("[main] Game status changed, refreshing lists");
      fetchActiveRounds();
      setGamesRefreshTrigger((prev) => prev + 1);
    },
    onRoundStatusChanged: () => {
      console.log("[main] Round status changed, refreshing active rounds");
      fetchActiveRounds();
    },
  });

  // Connect to socket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Fetch active rounds when switching to "en-curso" tab
  useEffect(() => {
    if (activeTab === "en-curso") {
      fetchActiveRounds();
    }
  }, [activeTab]);

  const fetchActiveRounds = useCallback(async () => {
    try {
      setLoadingRounds(true);
      const response = await fetch(`${serverConfig.apiUrl}/games/active-rounds`);
      if (!response.ok) {
        throw new Error("Error al cargar rondas activas");
      }
      const data = await response.json();
      setActiveRounds(data);
    } catch (error) {
      console.error("[main] Error fetching active rounds:", error);
      setActiveRounds([]);
    } finally {
      setLoadingRounds(false);
      setRefreshingRounds(false);
    }
  }, []);

  const onRefreshRounds = useCallback(() => {
    setRefreshingRounds(true);
    fetchActiveRounds();
  }, [fetchActiveRounds]);

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

  const handleLeaveGame = useCallback(
    (gameId: string) => {
      console.log("Leaving game:", gameId);
      if (user?.id) {
        leaveGame(gameId, user.id);
      }
    },
    [leaveGame, user?.id]
  );

  const handleGameJoined = useCallback(
    (gameId: string, playerId: string, playerCode: string) => {
      console.log("Game joined:", gameId, "PlayerId:", playerId, "Code:", playerCode);
      addJoinedGame(gameId, playerId, playerCode);
      setLobbyModalVisible(false);
      setSelectedGameId(null);
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

  const handlePlayRound = useCallback((round: ActiveRound) => {
    console.log("Playing round:", round.id);
    setPlayingRound(round);
  }, []);

  const handleExitRound = useCallback(() => {
    console.log("Exiting round");
    setPlayingRound(null);
    // Refresh active rounds list
    fetchActiveRounds();
  }, [fetchActiveRounds]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Profile Avatar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ProfileAvatar
          name={user?.name || ''}
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

      {/* Connection status */}
      <Text style={styles.connectionStatus}>
        {isConnected ? "● Conectado" : "○ Desconectado"}
      </Text>

      {/* Chrome-style Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "proximos" && styles.tabActive]}
          onPress={() => setActiveTab("proximos")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "proximos" && styles.tabTextActive,
            ]}
          >
            Proximos Juegos
          </Text>
          {activeTab === "proximos" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "en-curso" && styles.tabActive]}
          onPress={() => setActiveTab("en-curso")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "en-curso" && styles.tabTextActive,
            ]}
          >
            Juegos en Curso
          </Text>
          {activeTab === "en-curso" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === "proximos" ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <GameCarousel
              onJoinGame={handleJoinGame}
              onLeaveGame={handleLeaveGame}
              onSelectCards={handleSelectCards}
              joinedGames={joinedGames}
              refreshTrigger={gamesRefreshTrigger}
            />
          </ScrollView>
        ) : playingRound ? (
          // Show inline game view when playing a round
          <InlineGameView
            roundId={playingRound.id}
            roundName={playingRound.name}
            gameName={playingRound.gameName}
            patternName={playingRound.patternName}
            cardType={playingRound.cardType}
            onExit={handleExitRound}
          />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshingRounds}
                onRefresh={onRefreshRounds}
              />
            }
          >
            {loadingRounds ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Cargando rondas...</Text>
              </View>
            ) : activeRounds.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎱</Text>
                <Text style={styles.emptyTitle}>No hay juegos en curso</Text>
                <Text style={styles.emptySubtitle}>
                  Espera a que el anfitrion inicie una ronda
                </Text>
              </View>
            ) : (
              activeRounds.map((round) => (
                <View key={round.id} style={styles.roundCard}>
                  <View style={styles.roundInfo}>
                    <Text style={styles.roundGameName}>{round.gameName}</Text>
                    <Text style={styles.roundName}>
                      Ronda {round.order}: {round.name}
                    </Text>
                    {round.patternName && (
                      <Text style={styles.roundPattern}>
                        Patron: {round.patternName}
                      </Text>
                    )}
                    <View style={styles.roundBadgeRow}>
                      <View style={styles.roundBadge}>
                        <Text style={styles.roundBadgeText}>
                          {round.cardType === "bingote" ? "BINGOTE" : "BINGO"}
                        </Text>
                      </View>
                      <View style={[styles.roundBadge, styles.roundBadgeActive]}>
                        <Text style={styles.roundBadgeText}>EN CURSO</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => handlePlayRound(round)}
                  >
                    <Text style={styles.playButtonText}>Jugar</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
  connectionStatus: {
    textAlign: "center",
    paddingVertical: 8,
    backgroundColor: "#fff",
    color: "#27ae60",
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    position: "relative",
  },
  tabActive: {},
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#888",
  },
  tabTextActive: {
    color: "#FFD700",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: "#FFD700",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
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
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  roundCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundInfo: {
    flex: 1,
  },
  roundGameName: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  roundName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  roundPattern: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  roundBadgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  roundBadge: {
    backgroundColor: "#3498db",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roundBadgeActive: {
    backgroundColor: "#27ae60",
  },
  roundBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  playButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
});
