import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useNotifications } from './useSocketEvents';
import { useGame } from '@/contexts';

/**
 * Hook that listens for round start notifications and handles auto-navigation.
 *
 * When a round starts:
 * - If the player has cards selected for that game → auto-navigate to game screen
 * - If the player is joined but has no cards → show notification that they're excluded
 *
 * This hook should be used at a high level in the app (e.g., in the layout or a provider).
 */
export function useRoundStartNotification() {
  const { isGameJoined, getJoinedGameInfo } = useGame();

  const handleNotification = useCallback((notification: {
    message: string;
    roundId?: string;
    gameId?: string;
    gameName?: string;
    roundName?: string;
    cardType?: 'bingo' | 'bingote';
  }) => {
    console.log('[useRoundStartNotification] Received notification:', notification);

    // Check if this is a round start notification
    if (!notification.roundId || !notification.gameId) {
      return;
    }

    // Check if the player is joined to this game
    if (!isGameJoined(notification.gameId)) {
      return;
    }

    const gameInfo = getJoinedGameInfo(notification.gameId);
    if (!gameInfo) {
      return;
    }

    // Show alert and navigate to the round
    Alert.alert(
      notification.gameName || 'Ronda Iniciada',
      notification.message || `La ronda ${notification.roundName || ''} ha comenzado`,
      [
        {
          text: 'Jugar',
          onPress: () => {
            router.push({
              pathname: '/join-round',
              params: { roundId: notification.roundId },
            });
          },
        },
        {
          text: 'Despues',
          style: 'cancel',
        },
      ]
    );
  }, [isGameJoined, getJoinedGameInfo]);

  useNotifications({
    onNotification: handleNotification,
  });
}
