import { StyleSheet, Text, View, ActivityIndicator, BackHandler } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useSocket, useGame, useAuth } from "@/contexts";
import { useRoundSocket, useConnectionState } from "@/hooks";

export default function JoinRoundScreen() {
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const { reconnect } = useSocket();
  const { setRoundInfo, clearGame, setRoundPattern } = useGame();
  const { user } = useAuth();
  const isConnected = useConnectionState();

  const [status, setStatus] = useState<"connecting" | "joining" | "joined" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const joinAttemptedRef = useRef(false);

  // Use RxJS-based round event hooks
  const { joinRound } = useRoundSocket({
    onJoinedRound: (data) => {
      console.log("[join-round.tsx] Player joined (RxJS):", data);

      // Store in game context
      if (roundId) {
        setRoundInfo(roundId, data.player.id, data.player.playerCode);
      }

      // Set the round pattern and cells
      if (data.roundPattern) {
        setRoundPattern(data.roundPattern, data.patternCells || undefined);
      }

      setStatus("joined");

      // Navigate based on player status
      if (data.player.status === "ready") {
        router.replace({
          pathname: "/game",
          params: { roundId },
        });
      } else {
        router.replace({
          pathname: "/card-selection",
          params: { roundId },
        });
      }
    },
    onError: (error) => {
      console.error("[join-round.tsx] Server error (RxJS):", error.message);
      setStatus("error");
      setErrorMessage(error.message);
    },
  });

  // Main effect: setup, connect, and join
  useEffect(() => {
    if (!roundId) {
      setStatus("error");
      setErrorMessage("No se especificó la ronda");
      return;
    }

    // Clear any previous game state before joining new round
    clearGame();
    joinAttemptedRef.current = false;

    // Use reconnect for FRESH socket connection (clears all listeners and state)
    reconnect();
  }, [roundId, reconnect, clearGame]);

  // Join effect: handles joining once connected
  useEffect(() => {
    if (!roundId || !isConnected) return;
    if (joinAttemptedRef.current) return;

    // Perform join
    console.log("[join-round.tsx] Joining round (RxJS):", roundId);
    joinAttemptedRef.current = true;
    setStatus("joining");
    joinRound(roundId, user?.id);
  }, [roundId, isConnected, joinRound, user?.id]);

  // Handle Android hardware back button - use useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/main");
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
          {errorMessage || "Error al unirse a la ronda"}
        </Text>
        <Text style={styles.backLink} onPress={() => router.replace("/main")}>
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
        {status === "joining" && "Uniéndose a la ronda..."}
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
