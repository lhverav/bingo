import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useGame, useSocket } from "@/contexts";

// Pattern labels for display
const PATTERN_LABELS: Record<string, string> = {
  linea: "Linea",
  columna: "Columna",
  diagonal: "Diagonal",
  completo: "Carton Completo",
  figura_especial: "Figura Especial",
};

export default function ResultsScreen() {
  const { gameSummary, isWinner, clearGame } = useGame();
  const { disconnect } = useSocket();

  const handleGoHome = () => {
    clearGame();
    disconnect();
    router.replace("/home");
  };

  if (!gameSummary) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando resultados...</Text>
        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
          <Text style={styles.homeButtonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { winners, pattern, totalPlayers, numbersDrawn } = gameSummary;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Resultados</Text>
        {isWinner && (
          <View style={styles.winnerBadge}>
            <Text style={styles.winnerBadgeText}>GANASTE!</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Winners Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ganadores</Text>
          {winners.length === 0 ? (
            <Text style={styles.noWinners}>No hubo ganadores</Text>
          ) : (
            <View style={styles.winnersList}>
              {winners.map((winner, index) => (
                <View key={index} style={styles.winnerCard}>
                  <Text style={styles.winnerCode}>{winner.playerCode}</Text>
                  <View style={styles.bingoBadge}>
                    <Text style={styles.bingoBadgeText}>BINGO!</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Game Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen del Juego</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patron:</Text>
              <Text style={styles.infoValue}>
                {PATTERN_LABELS[pattern] || pattern}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Jugadores:</Text>
              <Text style={styles.infoValue}>{totalPlayers}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Numeros Sacados:</Text>
              <Text style={styles.infoValue}>{numbersDrawn}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Home Button */}
      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
        <Text style={styles.homeButtonText}>Volver al Inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  winnerBadge: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  winnerBadgeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  noWinners: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  winnersList: {
    gap: 10,
  },
  winnerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  winnerCode: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  bingoBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bingoBadgeText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  homeButton: {
    backgroundColor: "#3498db",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 40,
  },
});
