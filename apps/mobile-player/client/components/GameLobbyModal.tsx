import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useSocket, useAuth } from "@/contexts";
import { useGameJoinSocket, useConnectionState } from "@/hooks";

interface GameInfo {
  id: string;
  name: string;
  cardType: "bingo" | "bingote";
  scheduledAt: string;
  status: string;
}

interface PlayerInfo {
  id: string;
  playerCode: string;
  status: string;
  gameId: string;
}

interface GameLobbyModalProps {
  visible: boolean;
  gameId: string | null;
  onClose: () => void;
  onJoined: (gameId: string, playerId: string, playerCode: string) => void;
}

export function GameLobbyModal({
  visible,
  gameId,
  onClose,
  onJoined,
}: GameLobbyModalProps) {
  const { reconnect } = useSocket();
  const { user } = useAuth();
  const isConnected = useConnectionState();

  const [status, setStatus] = useState<"connecting" | "joining" | "joined" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [game, setGame] = useState<GameInfo | null>(null);
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const joinAttemptedRef = useRef(false);

  // Use RxJS-based game join hook
  const { joinGame, isConnected: socketConnected } = useGameJoinSocket({
    onJoinedGame: (data) => {
      console.log("[GameLobbyModal] Player joined game:", data);
      console.log("[GameLobbyModal] Player ID:", data.player.id);

      setGame(data.game);
      setPlayer(data.player);
      setStatus("joined");

      // Notify parent about successful join (including playerId)
      onJoined(data.game.id, data.player.id, data.player.playerCode);
    },
    onGameJoinError: (error) => {
      console.error("[GameLobbyModal] Game join error:", error.message);
      setStatus("error");
      setErrorMessage(error.message);
    },
  });

  // Debug logging
  console.log("[GameLobbyModal] State:", { visible, gameId, status, isConnected, socketConnected });

  // Reset state when modal opens (whenever visible becomes true)
  useEffect(() => {
    if (visible) {
      console.log("[GameLobbyModal] Modal opened, resetting state");
      setStatus("connecting");
      setErrorMessage(null);
      setGame(null);
      setPlayer(null);
      joinAttemptedRef.current = false;
    }
  }, [visible]);

  // Reconnect socket when modal opens with gameId
  useEffect(() => {
    if (visible && gameId) {
      console.log("[GameLobbyModal] Reconnecting socket for gameId:", gameId);
      reconnect();
    }
  }, [visible, gameId, reconnect]);

  // Join effect: handles joining once connected
  useEffect(() => {
    console.log("[GameLobbyModal] Join effect check:", { visible, gameId, isConnected, attempted: joinAttemptedRef.current });

    if (!visible || !gameId || !isConnected) {
      console.log("[GameLobbyModal] Skipping join - conditions not met");
      return;
    }
    if (joinAttemptedRef.current) {
      console.log("[GameLobbyModal] Skipping join - already attempted");
      return;
    }

    console.log("[GameLobbyModal] Emitting game:join for gameId:", gameId, "mobileUserId:", user?.id);
    joinAttemptedRef.current = true;
    setStatus("joining");
    joinGame(gameId, user?.id);
  }, [visible, gameId, isConnected, joinGame, user?.id]);

  const handleClose = () => {
    setStatus("connecting");
    setErrorMessage(null);
    setGame(null);
    setPlayer(null);
    joinAttemptedRef.current = false;
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

          {/* Loading state */}
          {(status === "connecting" || status === "joining") && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.statusText}>
                {status === "connecting" && "Conectando..."}
                {status === "joining" && "Uniendose al juego..."}
              </Text>
            </View>
          )}

          {/* Error state */}
          {status === "error" && (
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>
                {errorMessage || "Error al unirse al juego"}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleClose}>
                <Text style={styles.retryButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Joined state */}
          {status === "joined" && game && player && (
            <>
              {/* Game Info */}
              <Text style={styles.modalTitle}>{game.name}</Text>
              <Text style={styles.gameType}>
                {game.cardType === "bingote" ? "Bingote (4x4)" : "Bingo (5x5)"}
              </Text>

              {/* Player Code */}
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Tu codigo de jugador</Text>
                <Text style={styles.playerCode}>{player.playerCode}</Text>
                <Text style={styles.codeHint}>
                  Guarda este codigo para identificarte
                </Text>
              </View>

              {/* Success message */}
              <Text style={styles.successText}>
                Te has unido al juego exitosamente
              </Text>

              {/* Close button */}
              <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Entendido</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  centerContent: {
    alignItems: "center",
    paddingVertical: 40,
  },
  statusText: {
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
  retryButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  gameType: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  codeContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  playerCode: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFD700",
    letterSpacing: 6,
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  codeHint: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 8,
    textAlign: "center",
  },
  successText: {
    fontSize: 14,
    color: "#27ae60",
    textAlign: "center",
    marginBottom: 20,
  },
  doneButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  doneButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
});
