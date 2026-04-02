import { StyleSheet, Text, View, ActivityIndicator, BackHandler } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useSocket, useGame, useAuth } from "@/contexts";
import { useGameJoinSocket, useConnectionState } from "@/hooks";

export default function JoinGameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { reconnect } = useSocket();
  const { setGameInfo, clearGame } = useGame();
  const { user } = useAuth();
  const isConnected = useConnectionState();

  const [status, setStatus] = useState<"connecting" | "joining" | "joined" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const joinAttemptedRef = useRef(false);

  // Use RxJS-based game join event hooks
  const { joinGame } = useGameJoinSocket({
    onJoinedGame: (data) => {
      console.log("[join-game.tsx] Player joined game:", JSON.stringify(data, null, 2));
      console.log("[join-game.tsx] player object:", JSON.stringify(data.player, null, 2));
      console.log("[join-game.tsx] player.id:", data.player.id);
      console.log("[join-game.tsx] typeof player.id:", typeof data.player.id);

      // Store in game context
      if (gameId) {
        const playerId = data.player.id || data.player._id;
        console.log("[join-game.tsx] Storing playerId:", playerId);
        if (!playerId) {
          console.error("[join-game.tsx] ERROR: No playerId found in response!");
        }
        setGameInfo(gameId, playerId || '', data.player.playerCode, data.game.cardType);
      }

      setStatus("joined");

      // Navigate to card selection with gameId
      // The player needs to select their cards for this game
      router.replace({
        pathname: "/card-selection",
        params: { gameId },
      });
    },
    onGameJoinError: (error) => {
      console.error("[join-game.tsx] Game join error:", error.message);
      setStatus("error");
      setErrorMessage(error.message);
    },
  });

  // Main effect: setup, connect, and join
  useEffect(() => {
    if (!gameId) {
      setStatus("error");
      setErrorMessage("No se especificó el juego");
      return;
    }

    // Clear any previous game state before joining new game
    clearGame();
    joinAttemptedRef.current = false;

    // Use reconnect for FRESH socket connection
    reconnect();
  }, [gameId, reconnect, clearGame]);

  // Join effect: handles joining once connected
  useEffect(() => {
    if (!gameId || !isConnected) return;
    if (joinAttemptedRef.current) return;

    // Perform join
    console.log("[join-game.tsx] Joining game:", gameId);
    joinAttemptedRef.current = true;
    setStatus("joining");
    joinGame(gameId, user?.id);
  }, [gameId, isConnected, joinGame, user?.id]);

  // Handle Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/games");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

  if (status === "error") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {errorMessage || "Error al unirse al juego"}
        </Text>
        <Text style={styles.backLink} onPress={() => router.replace("/games")}>
          Volver
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFD700" />
      <Text style={styles.statusText}>
        {status === "connecting" && "Conectando..."}
        {status === "joining" && "Uniéndose al juego..."}
        {status === "joined" && "Cargando cartones..."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    color: "#333",
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
  },
  backLink: {
    fontSize: 16,
    color: "#3498db",
    textDecorationLine: "underline",
  },
});
