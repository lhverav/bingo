import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { serverConfig } from "@/config/server";

interface Round {
  id: string;
  name: string;
  order: number;
  status: string;
  patternName?: string;
  isPaid: boolean;
  pricePerCard?: number;
  currency?: string;
}

interface Game {
  id: string;
  name: string;
  cardType: 'bingo' | 'bingote';
  status: string;
  scheduledAt: string;
  rounds?: Round[];
}

const CARD_TYPE_LABELS = {
  bingo: 'BINGO (5x5)',
  bingote: 'BINGOTE (7x5)',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programado',
  active: 'En Curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#3498db',
  active: '#27ae60',
  finished: '#95a5a6',
  cancelled: '#e74c3c',
};

export default function GamesScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${serverConfig.apiUrl}/games?status=active`);
      if (!response.ok) {
        throw new Error('Error al cargar juegos');
      }
      const data = await response.json();
      setGames(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Handle Android hardware back button - use useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/(tabs)");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGames();
  }, [fetchGames]);

  const handleGamePress = useCallback(async (gameId: string) => {
    if (expandedGameId === gameId) {
      setExpandedGameId(null);
      return;
    }

    // Fetch rounds for this game
    try {
      const response = await fetch(`${serverConfig.apiUrl}/games/${gameId}/rounds`);
      if (!response.ok) {
        throw new Error('Error al cargar rondas');
      }
      const rounds = await response.json();
      setGames(prev => prev.map(g =>
        g.id === gameId ? { ...g, rounds } : g
      ));
      setExpandedGameId(gameId);
    } catch (err) {
      console.error('Error fetching rounds:', err);
    }
  }, [expandedGameId]);

  const handleJoinRound = useCallback((roundId: string) => {
    router.push({
      pathname: "/join-round",
      params: { roundId },
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando juegos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchGames}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Juegos Disponibles</Text>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.backLink}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.gamesList}
        contentContainerStyle={styles.gamesListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {games.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay juegos activos</Text>
            <Text style={styles.emptySubtext}>
              Espera a que el anfitrion inicie un juego
            </Text>
          </View>
        ) : (
          games.map((game) => (
            <View key={game.id} style={styles.gameCard}>
              <TouchableOpacity
                style={styles.gameHeader}
                onPress={() => handleGamePress(game.id)}
              >
                <View style={styles.gameInfo}>
                  <Text style={styles.gameName}>{game.name}</Text>
                  <View style={styles.gameMetaRow}>
                    <View style={[styles.badge, { backgroundColor: '#3498db' }]}>
                      <Text style={styles.badgeText}>
                        {CARD_TYPE_LABELS[game.cardType]}
                      </Text>
                    </View>
                    <View style={[
                      styles.badge,
                      { backgroundColor: STATUS_COLORS[game.status] || '#95a5a6' }
                    ]}>
                      <Text style={styles.badgeText}>
                        {STATUS_LABELS[game.status] || game.status}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedGameId === game.id ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {expandedGameId === game.id && game.rounds && (
                <View style={styles.roundsList}>
                  {game.rounds.length === 0 ? (
                    <Text style={styles.noRoundsText}>No hay rondas disponibles</Text>
                  ) : (
                    game.rounds
                      .filter(r => r.status === 'en_progreso')
                      .map((round) => (
                        <TouchableOpacity
                          key={round.id}
                          style={styles.roundCard}
                          onPress={() => handleJoinRound(round.id)}
                        >
                          <View style={styles.roundInfo}>
                            <Text style={styles.roundName}>
                              {round.order}. {round.name}
                            </Text>
                            {round.patternName && (
                              <Text style={styles.roundPattern}>
                                Patron: {round.patternName}
                              </Text>
                            )}
                            {round.isPaid && (
                              <Text style={styles.roundPrice}>
                                {round.pricePerCard} {round.currency}/carton
                              </Text>
                            )}
                          </View>
                          <View style={styles.joinButton}>
                            <Text style={styles.joinButtonText}>Unirse</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                  )}
                  {game.rounds.filter(r => r.status === 'en_progreso').length === 0 && (
                    <Text style={styles.noRoundsText}>
                      No hay rondas en curso
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  backLink: {
    fontSize: 16,
    color: "#3498db",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  gamesList: {
    flex: 1,
  },
  gamesListContent: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  gameCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  gameMetaRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  expandIcon: {
    fontSize: 14,
    color: "#999",
    marginLeft: 8,
  },
  roundsList: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 12,
    gap: 10,
  },
  noRoundsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 8,
  },
  roundCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
  },
  roundInfo: {
    flex: 1,
  },
  roundName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  roundPattern: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  roundPrice: {
    fontSize: 13,
    color: "#27ae60",
    fontWeight: "600",
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
});
