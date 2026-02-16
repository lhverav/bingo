import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { router } from "expo-router";
import YoutubePlayer from "react-native-youtube-iframe";
import {
  initializeOAuth,
  setupOAuthListener,
  initiateGoogleLogin,
  GoogleOAuthResult,
} from "../utils/googleOAuth";

// CRITICAL: Initialize OAuth session handler
initializeOAuth();

const SERVER_URL = "http://10.0.0.36:3001";
const YOUTUBE_VIDEO_ID =
  process.env.EXPO_PUBLIC_YOUTUBE_VIDEO_ID || "dQw4w9WgXcQ";

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<string | null>(
    null,
  );
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [oauthResult, setOauthResult] = useState<GoogleOAuthResult | null>(
    null,
  );

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  // Handle Google OAuth flow
  const handleGoogleLogin = async () => {
    try {
      await initiateGoogleLogin();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("OAuth Error", message);
    }
  };

  // Listen for OAuth callback
  useEffect(() => {
    const cleanup = setupOAuthListener((result) => {
      console.log("OAuth result:", result);
      setOauthResult(result);

      if (result.success) {
        Alert.alert(
          "OAuth Success",
          `Logged in as ${result.name}\nEmail: ${result.email}\nGoogle ID: ${result.googleId}`,
        );
      } else {
        Alert.alert("OAuth Failed", result.error || "Unknown error");
      }
    });

    return cleanup;
  }, []);

  useEffect(() => {
    const socket = io(SERVER_URL);

    socket.on("connect", () => {
      console.log("Connected to server");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
    });

    // When notification received, show popup
    socket.on("notification", (data) => {
      console.log("Notification received:", data);
      console.log("Notification data:", JSON.stringify(data)); // Check Metro terminal
      setCurrentNotification(data.message);
      if (data.roundId) {
        setCurrentRoundId(data.roundId);
      }
      setModalVisible(true);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
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
      <Text style={{ color: connected ? "green" : "red", marginBottom: 16 }}>
        {connected ? "● Connected" : "○   Disconnected"}
      </Text>

      {/* OAuth Test Button */}
      <TouchableOpacity style={styles.oauthButton} onPress={handleGoogleLogin}>
        <Text style={styles.oauthButtonText}>Test Google OAuth</Text>
      </TouchableOpacity>

      {/* TEST: Navigate to oauth-callback screen */}
      <TouchableOpacity
        style={[styles.oauthButton, { backgroundColor: "#FF6B6B" }]}
        onPress={() => {
          router.push({
            pathname: "/oauth-callback",
            params: {
              email: "test@example.com",
              name: "Test User",
              googleId: "123456789",
            },
          });
        }}
      >
        <Text style={styles.oauthButtonText}>
          TEST: Go to OAuth Callback Screen
        </Text>
      </TouchableOpacity>

      {/* OAuth Result Display */}
      {oauthResult && oauthResult.success && (
        <View style={styles.oauthResult}>
          <Text style={styles.oauthResultTitle}>OAuth Success!</Text>
          <Text style={styles.oauthResultText}>Name: {oauthResult.name}</Text>
          <Text style={styles.oauthResultText}>Email: {oauthResult.email}</Text>
          <Text style={styles.oauthResultText}>
            Google ID: {oauthResult.googleId}
          </Text>
        </View>
      )}

      {/* Notification Popup Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Ronda</Text>
            <Text style={styles.modalMessage}>{currentNotification}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.buttonIgnorar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonIgnorarText}>Ignorar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonJugar}
                // onPress={() => {
                //   console.log("Jugar button pressed");
                //   setModalVisible(false);
                //   if (currentRoundId) {
                //     console.log("Joining round:", currentRoundId);
                //     router.push({
                //       pathname: "/join-round",
                //       params: { roundId: currentRoundId },
                //     });
                //   } else {
                //     console.warn("No round ID available to join");
                //   }
                // }}

                onPress={() => {
                  router.push({
                    pathname: "/oauth-callback",
                    params: {
                      email: "test@example.com",
                      name: "Test User",
                      googleId: "123456789",
                    },
                  });
                }}
              >
                <Text style={styles.buttonJugarText}>Jugar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
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
  oauthButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 20,
  },
  oauthButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  oauthResult: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: "90%",
  },
  oauthResultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4285F4",
    marginBottom: 8,
  },
  oauthResultText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
});
