import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface Card {
  id: string;
  cells: number[][];
}

interface WinnerInfo {
  playerCode: string;
  cardId: string;
}

interface GameSummary {
  winners: WinnerInfo[];
  pattern: string;
  totalPlayers: number;
  numbersDrawn: number;
}

// Map of gameId -> playerCode for joined games
interface JoinedGameInfo {
  playerCode: string;
  playerId: string;
}

interface GameState {
  roundId: string | null;
  playerId: string | null;
  playerCode: string | null;
  cards: Card[];
  deadline: Date | null;
  selectedCardIds: string[];
  // Winner-related state
  winningCardIds: string[];
  isWinner: boolean;
  gameEnded: boolean;
  roundPattern: string | null;
  patternCells: boolean[][] | null; // Custom pattern cells from server
  cardType: 'bingo' | 'bingote' | null;
  gameSummary: GameSummary | null;
  // Joined games tracking
  joinedGames: Record<string, JoinedGameInfo>;
}

interface GameContextValue extends GameState {
  // Actions
  setRoundInfo: (roundId: string, playerId: string, playerCode: string) => void;
  setCards: (cards: Card[], deadline: Date) => void;
  setSelectedCards: (cardIds: string[]) => void;
  setRoundPattern: (pattern: string, patternCells?: boolean[][]) => void;
  setCardType: (cardType: 'bingo' | 'bingote') => void;
  setWinningCards: (cardIds: string[]) => void;
  setIsWinner: (isWinner: boolean) => void;
  setGameEnded: (summary: GameSummary) => void;
  clearGame: () => void;
  // Joined games management
  addJoinedGame: (gameId: string, playerId: string, playerCode: string) => void;
  removeJoinedGame: (gameId: string) => void;
  isGameJoined: (gameId: string) => boolean;
  getJoinedGameInfo: (gameId: string) => JoinedGameInfo | null;
}

// =============================================================================
// CONTEXT
// =============================================================================

const GameContext = createContext<GameContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

const initialState: GameState = {
  roundId: null,
  playerId: null,
  playerCode: null,
  cards: [],
  deadline: null,
  selectedCardIds: [],
  winningCardIds: [],
  isWinner: false,
  gameEnded: false,
  roundPattern: null,
  patternCells: null,
  cardType: null,
  gameSummary: null,
  joinedGames: {},
};

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, setState] = useState<GameState>(initialState);

  const setRoundInfo = useCallback((roundId: string, playerId: string, playerCode: string) => {
    setState(prev => ({
      ...prev,
      roundId,
      playerId,
      playerCode,
    }));
  }, []);

  const setCards = useCallback((cards: Card[], deadline: Date) => {
    setState(prev => ({
      ...prev,
      cards,
      deadline,
    }));
  }, []);

  const setSelectedCards = useCallback((cardIds: string[]) => {
    setState(prev => ({
      ...prev,
      selectedCardIds: cardIds,
    }));
  }, []);

  const setRoundPattern = useCallback((pattern: string, patternCells?: boolean[][]) => {
    setState(prev => ({
      ...prev,
      roundPattern: pattern,
      patternCells: patternCells || null,
    }));
  }, []);

  const setCardType = useCallback((cardType: 'bingo' | 'bingote') => {
    setState(prev => ({
      ...prev,
      cardType,
    }));
  }, []);

  const setWinningCards = useCallback((cardIds: string[]) => {
    setState(prev => ({
      ...prev,
      winningCardIds: cardIds,
    }));
  }, []);

  const setIsWinner = useCallback((isWinner: boolean) => {
    setState(prev => ({
      ...prev,
      isWinner,
    }));
  }, []);

  const setGameEnded = useCallback((summary: GameSummary) => {
    setState(prev => ({
      ...prev,
      gameEnded: true,
      gameSummary: summary,
    }));
  }, []);

  const clearGame = useCallback(() => {
    setState(prev => ({
      ...initialState,
      // Preserve joined games when clearing round state
      joinedGames: prev.joinedGames,
    }));
  }, []);

  const addJoinedGame = useCallback((gameId: string, playerId: string, playerCode: string) => {
    setState(prev => ({
      ...prev,
      joinedGames: {
        ...prev.joinedGames,
        [gameId]: { playerId, playerCode },
      },
    }));
  }, []);

  const removeJoinedGame = useCallback((gameId: string) => {
    setState(prev => {
      const { [gameId]: removed, ...rest } = prev.joinedGames;
      return {
        ...prev,
        joinedGames: rest,
      };
    });
  }, []);

  const isGameJoined = useCallback((gameId: string) => {
    return gameId in state.joinedGames;
  }, [state.joinedGames]);

  const getJoinedGameInfo = useCallback((gameId: string): JoinedGameInfo | null => {
    return state.joinedGames[gameId] || null;
  }, [state.joinedGames]);

  const value: GameContextValue = {
    ...state,
    setRoundInfo,
    setCards,
    setSelectedCards,
    setRoundPattern,
    setCardType,
    setWinningCards,
    setIsWinner,
    setGameEnded,
    clearGame,
    addJoinedGame,
    removeJoinedGame,
    isGameJoined,
    getJoinedGameInfo,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
