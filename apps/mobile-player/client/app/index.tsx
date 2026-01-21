import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://10.0.0.37:3001";

export default function HomeScreen() {
  const [notifications, setNotifications] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

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

    // When notification received
    socket.on("notification", (data) => {
      console.log("Notification  received:", data);
      setNotifications((prev) => [data.message, ...prev].slice(0, 5)); //   Keep last 5
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bingo Player</Text>
      <Text style={styles.subtitle}>Ingresa a una ronda para jugar</Text>

      {/* Connection status */}
      <Text style={{ color: connected ? "green" : "red", marginBottom: 16 }}>
        {connected ? "● Connected" : "○   Disconnected"}
      </Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Unirse a Ronda</Text>
      </TouchableOpacity>

      {/* Notifications list */}
      <View style={{ marginTop: 32, width: "100%" }}>
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
          Notifications:
        </Text>
        {notifications.map((msg, index) => (
          <Text
            key={index}
            style={{
              color: "#333",
              marginBottom: 4,
            }}
          >
            • {msg}
          </Text>
        ))}
      </View>
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#0070f3",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
