import { useEffect, useRef, useCallback, useState } from 'react';
import { Subscription } from 'rxjs';
import {
  socketEventStream,
  BallAnnouncedEvent,
  WinnersDetectedEvent,
  GameEndingEvent,
  JoinedRoundEvent,
  JoinedGameEvent,
  GameJoinErrorEvent,
  LeftGameEvent,
  GameLeaveErrorEvent,
  CardsDeliveredEvent,
  CardsConfirmedEvent,
  CardsAutoAssignedEvent,
  NotificationEvent,
  SocketError,
} from '@/services/socketEventStream';

// =============================================================================
// TYPES
// =============================================================================

export interface UseGameEventsHandlers {
  onGameStarted?: () => void;
  onBallAnnounced?: (event: BallAnnouncedEvent) => void;
  onBallAnnouncedBatch?: (events: BallAnnouncedEvent[]) => void;
  onWinnersDetected?: (event: WinnersDetectedEvent) => void;
  onGameEnding?: (event: GameEndingEvent) => void;
  onError?: (error: SocketError) => void;
}

export interface UseRoundEventsHandlers {
  onJoinedRound?: (event: JoinedRoundEvent) => void;
  onCardsDelivered?: (event: CardsDeliveredEvent) => void;
  onCardsConfirmed?: (event: CardsConfirmedEvent) => void;
  onCardsAutoAssigned?: (event: CardsAutoAssignedEvent) => void;
  onError?: (error: SocketError) => void;
}

export interface UseNotificationHandlers {
  onNotification?: (event: NotificationEvent) => void;
}

export interface UseGameJoinHandlers {
  onJoinedGame?: (event: JoinedGameEvent) => void;
  onGameJoinError?: (error: GameJoinErrorEvent) => void;
  onLeftGame?: (event: LeftGameEvent) => void;
  onGameLeaveError?: (error: GameLeaveErrorEvent) => void;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to subscribe to game events using RxJS observables.
 * Automatically handles subscription cleanup.
 *
 * Using refs for handlers ensures:
 * - No stale closures (always latest handler)
 * - No re-subscription on handler change
 * - Stable reference for useEffect dependencies
 */
export function useGameEvents(handlers: UseGameEventsHandlers): void {
  // Use refs to avoid stale closures and re-subscriptions
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const subscriptions: Subscription[] = [];

    // Subscribe to game started
    subscriptions.push(
      socketEventStream.onGameStarted$.subscribe(() => {
        handlersRef.current.onGameStarted?.();
      })
    );

    // Subscribe to individual ball announcements
    subscriptions.push(
      socketEventStream.onBallAnnounced$.subscribe((event) => {
        handlersRef.current.onBallAnnounced?.(event);
      })
    );

    // Subscribe to batched ball announcements (for batch processing)
    subscriptions.push(
      socketEventStream.onBallAnnouncedBatched$.subscribe((events) => {
        handlersRef.current.onBallAnnouncedBatch?.(events);
      })
    );

    // Subscribe to winners detected
    subscriptions.push(
      socketEventStream.onWinnersDetected$.subscribe((event) => {
        handlersRef.current.onWinnersDetected?.(event);
      })
    );

    // Subscribe to game ending
    subscriptions.push(
      socketEventStream.onGameEnding$.subscribe((event) => {
        handlersRef.current.onGameEnding?.(event);
      })
    );

    // Subscribe to errors
    subscriptions.push(
      socketEventStream.onError$.subscribe((error) => {
        handlersRef.current.onError?.(error);
      })
    );

    // Cleanup all subscriptions on unmount
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []); // Empty deps - handlers are accessed via ref
}

/**
 * Hook to subscribe to round/lobby events using RxJS observables.
 * Automatically handles subscription cleanup.
 */
export function useRoundEvents(handlers: UseRoundEventsHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const subscriptions: Subscription[] = [];

    // Subscribe to joined round
    subscriptions.push(
      socketEventStream.onJoinedRound$.subscribe((event) => {
        handlersRef.current.onJoinedRound?.(event);
      })
    );

    // Subscribe to cards delivered
    subscriptions.push(
      socketEventStream.onCardsDelivered$.subscribe((event) => {
        handlersRef.current.onCardsDelivered?.(event);
      })
    );

    // Subscribe to cards confirmed
    subscriptions.push(
      socketEventStream.onCardsConfirmed$.subscribe((event) => {
        handlersRef.current.onCardsConfirmed?.(event);
      })
    );

    // Subscribe to cards auto-assigned
    subscriptions.push(
      socketEventStream.onCardsAutoAssigned$.subscribe((event) => {
        handlersRef.current.onCardsAutoAssigned?.(event);
      })
    );

    // Subscribe to errors
    subscriptions.push(
      socketEventStream.onError$.subscribe((error) => {
        handlersRef.current.onError?.(error);
      })
    );

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);
}

/**
 * Hook for connection state tracking
 */
export function useConnectionState(): boolean {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const subscription = socketEventStream.isConnected$.subscribe(setIsConnected);
    return () => subscription.unsubscribe();
  }, []);

  return isConnected;
}

/**
 * Hook to subscribe to notification events
 */
export function useNotifications(handlers: UseNotificationHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const subscription = socketEventStream.onNotification$.subscribe((event) => {
      handlersRef.current.onNotification?.(event);
    });

    return () => subscription.unsubscribe();
  }, []);
}

/**
 * Hook to subscribe to game join/leave events (new game flow)
 */
export function useGameJoinEvents(handlers: UseGameJoinHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const subscriptions: Subscription[] = [];

    // Subscribe to joined game
    subscriptions.push(
      socketEventStream.onJoinedGame$.subscribe((event) => {
        handlersRef.current.onJoinedGame?.(event);
      })
    );

    // Subscribe to game join errors
    subscriptions.push(
      socketEventStream.onGameJoinError$.subscribe((error) => {
        handlersRef.current.onGameJoinError?.(error);
      })
    );

    // Subscribe to left game
    subscriptions.push(
      socketEventStream.onLeftGame$.subscribe((event) => {
        handlersRef.current.onLeftGame?.(event);
      })
    );

    // Subscribe to game leave errors
    subscriptions.push(
      socketEventStream.onGameLeaveError$.subscribe((error) => {
        handlersRef.current.onGameLeaveError?.(error);
      })
    );

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);
}

/**
 * Hook providing socket emit functions
 * These functions are stable references (won't cause re-renders)
 */
export function useSocketEmit() {
  const joinRound = useCallback((roundId: string, mobileUserId?: string) => {
    socketEventStream.joinRound(roundId, mobileUserId);
  }, []);

  const joinGame = useCallback((gameId: string, mobileUserId?: string) => {
    socketEventStream.joinGame(gameId, mobileUserId);
  }, []);

  const leaveGame = useCallback((gameId: string, mobileUserId: string) => {
    socketEventStream.leaveGame(gameId, mobileUserId);
  }, []);

  const requestCards = useCallback((playerId: string) => {
    socketEventStream.requestCards(playerId);
  }, []);

  const selectCards = useCallback((playerId: string, selectedCardIds: string[]) => {
    socketEventStream.selectCards(playerId, selectedCardIds);
  }, []);

  const leaveRound = useCallback(() => {
    socketEventStream.leaveRound();
  }, []);

  const emit = useCallback(<T = unknown>(event: string, data?: T) => {
    socketEventStream.emit(event, data);
  }, []);

  return {
    joinRound,
    joinGame,
    leaveGame,
    requestCards,
    selectCards,
    leaveRound,
    emit,
  };
}

/**
 * Combined hook for common game operations
 * Provides both event subscriptions and emit functions
 */
export function useGameSocket(handlers: UseGameEventsHandlers) {
  useGameEvents(handlers);
  const emitters = useSocketEmit();
  const isConnected = useConnectionState();

  return {
    ...emitters,
    isConnected,
  };
}

/**
 * Combined hook for round operations
 */
export function useRoundSocket(handlers: UseRoundEventsHandlers) {
  useRoundEvents(handlers);
  const emitters = useSocketEmit();
  const isConnected = useConnectionState();

  return {
    ...emitters,
    isConnected,
  };
}

/**
 * Combined hook for game join operations (new game flow)
 */
export function useGameJoinSocket(handlers: UseGameJoinHandlers) {
  useGameJoinEvents(handlers);
  const emitters = useSocketEmit();
  const isConnected = useConnectionState();

  return {
    ...emitters,
    isConnected,
  };
}
