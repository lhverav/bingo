import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { GameWithRounds, formatPrice, formatGameDate } from "@/api/games";

interface GameCardProps {
  game: GameWithRounds;
  isJoined?: boolean;
  playerCode?: string;
  onJoin: (gameId: string) => void;
  onLeave: (gameId: string) => void;
  onSelectCards?: (gameId: string) => void;
}

export function GameCard({ game, isJoined, playerCode, onJoin, onLeave, onSelectCards }: GameCardProps) {
  const cardTypeLabel = game.cardType === "bingo" ? "BINGO" : "BINGOTE";

  return (
    <View style={[styles.card, isJoined && styles.cardJoined]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.gameName}>{game.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cardTypeLabel}</Text>
        </View>
      </View>

      {/* Schedule */}
      <View style={styles.scheduleRow}>
        <Text style={styles.scheduleIcon}>📅</Text>
        <Text style={styles.scheduleText}>{formatGameDate(game.scheduledAt)}</Text>
      </View>

      {/* Player Code (when joined) */}
      {isJoined && playerCode && (
        <View style={styles.playerCodeRow}>
          <Text style={styles.playerCodeLabel}>Codigo:</Text>
          <Text style={styles.playerCode}>{playerCode}</Text>
        </View>
      )}

      {/* Rounds List */}
      <View style={styles.roundsContainer}>
        <Text style={styles.roundsTitle}>Rondas:</Text>
        {game.rounds.length === 0 ? (
          <Text style={styles.noRounds}>Sin rondas configuradas</Text>
        ) : (
          game.rounds.map((round) => (
            <View key={round.id} style={styles.roundRow}>
              <Text style={styles.roundBullet}>•</Text>
              <Text style={styles.roundName}>{round.name}</Text>
              <Text style={[styles.roundType, round.isPaid && styles.roundTypePaid]}>
                {round.isPaid
                  ? formatPrice(round.pricePerCard || 0, round.currency)
                  : "Gratis"}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Action Buttons */}
      {isJoined ? (
        <View style={styles.joinedActions}>
          {/* My Cards Button */}
          <TouchableOpacity
            style={styles.cardsButton}
            onPress={() => onSelectCards?.(game.id)}
          >
            <Text style={styles.cardsButtonText}>MIS CARTONES</Text>
          </TouchableOpacity>

          {/* Leave Button */}
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={() => onLeave(game.id)}
          >
            <Text style={styles.leaveButtonText}>DESVINCULARSE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => onJoin(game.id)}
        >
          <Text style={styles.joinButtonText}>UNIRME</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 10,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#FFD700",
    width: 300,
  },
  cardJoined: {
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  gameName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  badge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  scheduleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: "#666",
  },
  playerCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#f0fff0",
    padding: 8,
    borderRadius: 8,
  },
  playerCodeLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  playerCode: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    letterSpacing: 2,
  },
  roundsContainer: {
    marginBottom: 16,
  },
  roundsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  noRounds: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
  },
  roundRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  roundBullet: {
    fontSize: 14,
    color: "#FFD700",
    marginRight: 8,
  },
  roundName: {
    fontSize: 13,
    color: "#444",
    flex: 1,
  },
  roundType: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  roundTypePaid: {
    color: "#FF9800",
  },
  joinButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  joinedActions: {
    gap: 10,
  },
  cardsButton: {
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
  cardsButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  leaveButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
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
});

export default GameCard;
