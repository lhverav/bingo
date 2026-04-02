import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import YoutubePlayer from "react-native-youtube-iframe";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import { useNotifications, useConnectionState, useGameJoinSocket } from "@/hooks";
import { GameCarousel } from "@/components/GameCarousel";
import { GameLobbyModal } from "@/components/GameLobbyModal";

const YOUTUBE_VIDEO_ID =
  process.env.EXPO_PUBLIC_YOUTUBE_VIDEO_ID || "dQw4w9WgXcQ";

export default function ProximosJuegosScreen() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { connect } = useSocket();
  const { joinedGames, addJoinedGame, removeJoinedGame } = useGame();
  const isConnected = useConnectionState();

  const [playing, setPlaying] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<string | null>(null);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);

  // Game lobby modal state
  const [lobbyModalVisible, setLobbyModalVisible] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Use RxJS-based game join socket for leave functionality
  const { leaveGame } = useGameJoinSocket({
    onLeftGame: (data) => {
      console.log("[proximos-juegos] Left game:", data);
      removeJoinedGame(data.gameId);
    },
    onGameLeaveError: (error) => {
      console.error("[proximos-juegos] Leave game error:", error.message);
    },
  });

  // Use RxJS-based notification hook
  useNotifications({
    onNotification: (data) => {
      console.log("[proximos-juegos] Notification received:", data);
      setCurrentNotification(data.message);
      if (data.roundId) {
        setCurrentRoundId(data.roundId);
      }
      setNotificationModalVisible(true);
    },
  });

  // Connect to socket on mount
  useEffect(() => {
    connect();
  }, [connect]);

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

  const handleLeaveGame = useCallback((gameId: string) => {
    console.log("Leaving game:", gameId);
    if (user?.id) {
      leaveGame(gameId, user.id);
    }
  }, [leaveGame, user?.id]);

  const handleGameJoined = useCallback((gameId: string, playerId: string, playerCode: string) => {
    console.log("Game joined:", gameId, "PlayerId:", playerId, "Code:", playerCode);
    addJoinedGame(gameId, playerId, playerCode);
    // Close modal and stay on the same page - user can use "MIS CARTONES" button
    setLobbyModalVisible(false);
    setSelectedGameId(null);
  }, [addJoinedGame]);

  const handleSelectCards = useCallback((gameId: string) => {
    console.log("Select cards for game:", gameId);
    // Navigate to card selection screen
    router.push({
      pathname: "/card-selection",
      params: { gameId },
    });
  }, []);

  const handleLobbyClose = useCallback(() => {
    setLobbyModalVisible(false);
    setSelectedGameId(null);
  }, []);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      {/* YouTube Video Player */}
      <View style={styles.videoContainer}>
        <YoutubePlayer
          height={200}
          width={Dimensions.get("window").width - 40}
          play={playing}
          videoId={YOUTUBE_VIDEO_ID}
          onChangeState={onStateChange}
        />
      </View>

      {/* Connection status */}
      <Text style={{ color: isConnected ? "green" : "red", marginBottom: 16 }}>
        {isConnected ? "● Conectado" : "○ Desconectado"}
      </Text>

      {/* Game Carousel */}
      <GameCarousel
        onJoinGame={handleJoinGame}
        onLeaveGame={handleLeaveGame}
        onSelectCards={handleSelectCards}
        joinedGames={joinedGames}
      />

      {/* Game Lobby Modal - key forces remount on new game */}
      <GameLobbyModal
        key={selectedGameId || "no-game"}
        visible={lobbyModalVisible}
        gameId={selectedGameId}
        onClose={handleLobbyClose}
        onJoined={handleGameJoined}
      />

      {/* Notification Popup Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Ronda</Text>
            <Text style={styles.modalMessage}>{currentNotification}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.buttonIgnorar}
                onPress={() => setNotificationModalVisible(false)}
              >
                <Text style={styles.buttonIgnorarText}>Ignorar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonJugar}
                onPress={() => {
                  setNotificationModalVisible(false);
                  if (currentRoundId) {
                    router.push({
                      pathname: "/join-round",
                      params: { roundId: currentRoundId },
                    });
                  }
                }}
              >
                <Text style={styles.buttonJugarText}>Jugar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
    paddingBottom: 40,
  },
  videoContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: "85%",
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 15,
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modalMessage: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 15,
  },
  buttonJugar: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonJugarText: {
    color: "#333",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonIgnorar: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  buttonIgnorarText: {
    color: "#666",
    fontSize: 18,
    fontWeight: "600",
  },
});
