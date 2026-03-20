import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { filter, share, bufferTime, distinctUntilChanged } from 'rxjs/operators';
import { Socket } from 'socket.io-client';

// =============================================================================
// TYPES
// =============================================================================

export interface BallAnnouncedEvent {
  number: number;
}

export interface WinnersDetectedEvent {
  winningCardIds: string[];
}

export interface GameEndingEvent {
  summary: GameSummary;
}

export interface GameSummary {
  winners: { playerCode: string; cardId: string }[];
  pattern: string;
  totalPlayers: number;
  numbersDrawn: number;
}

export interface SocketError {
  message: string;
}

export interface Card {
  id: string;
  cells: number[][];
}

export interface CardsAssignedEvent {
  cards: Card[];
  deadline: string;
}

export interface JoinedRoundEvent {
  player: {
    id: string;
    playerCode: string;
    status: string;
  };
  isReconnect: boolean;
  roundPattern: string | null;
}

export interface CardsDeliveredEvent {
  player: {
    id: string;
    playerCode: string;
    status: string;
  };
  cards: Card[];
  deadline: string;
}

export interface CardsConfirmedEvent {
  selectedCardIds: string[];
}

export interface CardsAutoAssignedEvent {
  selectedCardIds: string[];
}

export interface NotificationEvent {
  message: string;
  roundId?: string;
  gameId?: string;
  gameName?: string;
  roundName?: string;
  cardType?: 'bingo' | 'bingote';
}

export interface JoinedGameEvent {
  player: {
    id: string;
    playerCode: string;
    status: string;
    gameId: string;
  };
  game: {
    id: string;
    name: string;
    cardType: 'bingo' | 'bingote';
    scheduledAt: string;
    status: string;
  };
  isReconnect: boolean;
  message: string;
}

export interface GameJoinErrorEvent {
  message: string;
}

export interface LeftGameEvent {
  gameId: string;
  message: string;
}

export interface GameLeaveErrorEvent {
  message: string;
}

// =============================================================================
// SOCKET EVENT STREAM SERVICE
// =============================================================================

/**
 * RxJS-based service that wraps socket.io events into observables.
 * This provides:
 * - Event batching for rapid events (ball announcements)
 * - Automatic cleanup when socket disconnects
 * - Type-safe event streams
 * - No stale closures - observables always have latest values
 */
export class SocketEventStream {
  private socket: Socket | null = null;

  // Connection state
  private connectionState$ = new BehaviorSubject<boolean>(false);

  // Event subjects (internal)
  private gameStarted$ = new Subject<void>();
  private ballAnnounced$ = new Subject<BallAnnouncedEvent>();
  private winnersDetected$ = new Subject<WinnersDetectedEvent>();
  private gameEnding$ = new Subject<GameEndingEvent>();
  private error$ = new Subject<SocketError>();
  private joinedRound$ = new Subject<JoinedRoundEvent>();
  private joinedGame$ = new Subject<JoinedGameEvent>();
  private gameJoinError$ = new Subject<GameJoinErrorEvent>();
  private leftGame$ = new Subject<LeftGameEvent>();
  private gameLeaveError$ = new Subject<GameLeaveErrorEvent>();
  private cardsDelivered$ = new Subject<CardsDeliveredEvent>();
  private cardsConfirmed$ = new Subject<CardsConfirmedEvent>();
  private cardsAutoAssigned$ = new Subject<CardsAutoAssignedEvent>();
  private notification$ = new Subject<NotificationEvent>();

  /**
   * Initialize the event stream with a socket instance
   */
  init(socket: Socket): void {
    // Clean up previous socket listeners if any (but don't affect observables)
    if (this.socket) {
      this.cleanup();
    }

    this.socket = socket;

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Clean up all subscriptions and listeners
   * NOTE: We don't complete destroy$ here because that would complete all
   * observable subscriptions. Hooks subscribe once on mount and need to
   * keep receiving events after reconnect.
   */
  cleanup(): void {
    if (this.socket) {
      // Remove our listeners (socket may be used elsewhere)
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('game:started');
      this.socket.off('ball:announced');
      this.socket.off('winners:detected');
      this.socket.off('game:ending');
      this.socket.off('error');
      this.socket.off('player:joined');
      this.socket.off('game:joined');
      this.socket.off('game:join:error');
      this.socket.off('game:left');
      this.socket.off('game:leave:error');
      this.socket.off('cards:delivered');
      this.socket.off('cards:confirmed');
      this.socket.off('cards:autoAssigned');
      this.socket.off('notification');
    }

    this.socket = null;
    this.connectionState$.next(false);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[SocketEventStream] Connected');
      this.connectionState$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketEventStream] Disconnected');
      this.connectionState$.next(false);
    });

    // Game events
    this.socket.on('game:started', (data: unknown) => {
      console.log('[SocketEventStream] game:started', data);
      this.gameStarted$.next();
    });

    this.socket.on('ball:announced', (data: BallAnnouncedEvent) => {
      console.log('[SocketEventStream] ball:announced', data.number);
      this.ballAnnounced$.next(data);
    });

    this.socket.on('winners:detected', (data: WinnersDetectedEvent) => {
      console.log('[SocketEventStream] winners:detected', data);
      this.winnersDetected$.next(data);
    });

    this.socket.on('game:ending', (data: GameEndingEvent) => {
      console.log('[SocketEventStream] game:ending', data);
      this.gameEnding$.next(data);
    });

    this.socket.on('error', (data: SocketError) => {
      console.error('[SocketEventStream] error', data);
      this.error$.next(data);
    });

    // Round/Card events
    this.socket.on('player:joined', (data: JoinedRoundEvent) => {
      console.log('[SocketEventStream] player:joined', data);
      this.joinedRound$.next(data);
    });

    // Game join events (new game flow)
    this.socket.on('game:joined', (data: JoinedGameEvent) => {
      console.log('[SocketEventStream] game:joined', data);
      this.joinedGame$.next(data);
    });

    this.socket.on('game:join:error', (data: GameJoinErrorEvent) => {
      console.error('[SocketEventStream] game:join:error', data);
      this.gameJoinError$.next(data);
    });

    this.socket.on('game:left', (data: LeftGameEvent) => {
      console.log('[SocketEventStream] game:left', data);
      this.leftGame$.next(data);
    });

    this.socket.on('game:leave:error', (data: GameLeaveErrorEvent) => {
      console.error('[SocketEventStream] game:leave:error', data);
      this.gameLeaveError$.next(data);
    });

    this.socket.on('cards:delivered', (data: CardsDeliveredEvent) => {
      console.log('[SocketEventStream] cards:delivered', data);
      this.cardsDelivered$.next(data);
    });

    this.socket.on('cards:confirmed', (data: CardsConfirmedEvent) => {
      console.log('[SocketEventStream] cards:confirmed', data);
      this.cardsConfirmed$.next(data);
    });

    this.socket.on('cards:autoAssigned', (data: CardsAutoAssignedEvent) => {
      console.log('[SocketEventStream] cards:autoAssigned', data);
      this.cardsAutoAssigned$.next(data);
    });

    // Notification events (from host)
    this.socket.on('notification', (data: NotificationEvent) => {
      console.log('[SocketEventStream] notification', data);
      this.notification$.next(data);
    });
  }

  // =============================================================================
  // PUBLIC OBSERVABLES
  // =============================================================================

  /**
   * Observable of connection state changes
   */
  get isConnected$(): Observable<boolean> {
    return this.connectionState$.asObservable().pipe(
      distinctUntilChanged()
    );
  }

  /**
   * Observable for game started events
   */
  get onGameStarted$(): Observable<void> {
    return this.gameStarted$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for ball announced events
   */
  get onBallAnnounced$(): Observable<BallAnnouncedEvent> {
    return this.ballAnnounced$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for ball announcements batched over 100ms
   * Useful for handling rapid ball draws
   */
  get onBallAnnouncedBatched$(): Observable<BallAnnouncedEvent[]> {
    return this.ballAnnounced$.asObservable().pipe(
      bufferTime(100),
      filter(events => events.length > 0),
      share()
    );
  }

  /**
   * Observable for winners detected events
   */
  get onWinnersDetected$(): Observable<WinnersDetectedEvent> {
    return this.winnersDetected$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for game ending events
   */
  get onGameEnding$(): Observable<GameEndingEvent> {
    return this.gameEnding$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for error events
   */
  get onError$(): Observable<SocketError> {
    return this.error$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for joined round events
   */
  get onJoinedRound$(): Observable<JoinedRoundEvent> {
    return this.joinedRound$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for joined game events (new game flow)
   */
  get onJoinedGame$(): Observable<JoinedGameEvent> {
    return this.joinedGame$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for game join error events
   */
  get onGameJoinError$(): Observable<GameJoinErrorEvent> {
    return this.gameJoinError$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for left game events
   */
  get onLeftGame$(): Observable<LeftGameEvent> {
    return this.leftGame$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for game leave error events
   */
  get onGameLeaveError$(): Observable<GameLeaveErrorEvent> {
    return this.gameLeaveError$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for cards delivered events
   */
  get onCardsDelivered$(): Observable<CardsDeliveredEvent> {
    return this.cardsDelivered$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for cards confirmed events
   */
  get onCardsConfirmed$(): Observable<CardsConfirmedEvent> {
    return this.cardsConfirmed$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for cards auto-assigned events
   */
  get onCardsAutoAssigned$(): Observable<CardsAutoAssignedEvent> {
    return this.cardsAutoAssigned$.asObservable().pipe(
      share()
    );
  }

  /**
   * Observable for notification events (from host)
   */
  get onNotification$(): Observable<NotificationEvent> {
    return this.notification$.asObservable().pipe(
      share()
    );
  }

  // =============================================================================
  // SOCKET EMITTERS
  // =============================================================================

  /**
   * Emit a socket event
   */
  emit<T = unknown>(event: string, data?: T): void {
    if (this.socket?.connected) {
      console.log(`[SocketEventStream] Emitting '${event}':`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`[SocketEventStream] Cannot emit '${event}': socket not connected, socket exists: ${!!this.socket}`);
    }
  }

  /**
   * Join a round
   */
  joinRound(roundId: string, mobileUserId?: string): void {
    this.emit('player:join', { roundId, mobileUserId });
  }

  /**
   * Join a game (new game flow)
   */
  joinGame(gameId: string, mobileUserId?: string): void {
    this.emit('game:join', { gameId, mobileUserId });
  }

  /**
   * Leave a game (new game flow)
   */
  leaveGame(gameId: string, mobileUserId: string): void {
    this.emit('game:leave', { gameId, mobileUserId });
  }

  /**
   * Request cards for selection
   */
  requestCards(playerId: string): void {
    this.emit('cards:request', { playerId });
  }

  /**
   * Select cards
   */
  selectCards(playerId: string, selectedCardIds: string[]): void {
    this.emit('cards:selected', { playerId, selectedCardIds });
  }

  /**
   * Leave the round
   */
  leaveRound(): void {
    this.emit('player:leave');
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const socketEventStream = new SocketEventStream();
