import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

type RoundPlayStatus = "idle" | "joining" | "waiting" | "playing" | "ended";

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
  // Round play state (persists across tab switches)
  drawnNumbers: number[];
  lastDrawn: number | null;
  markedNumbers: Record<string, number[]>; // cardId -> marked numbers
  roundPlayStatus: RoundPlayStatus;
}

interface GameContextValue extends GameState {
  // Actions
  setRoundInfo: (roundId: string, playerId: string, playerCode: string) => void;
  setGameInfo: (gameId: string, playerId: string, playerCode: string, cardType: 'bingo' | 'bingote') => void;
  setCards: (cards: Card[], deadline: Date | null) => void;
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
  // Round play state management
  addDrawnNumber: (number: number) => void;
  setLastDrawn: (number: number | null) => void;
  markNumber: (cardId: string, number: number) => void;
  setRoundPlayStatus: (status: RoundPlayStatus) => void;
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
  // Round play state
  drawnNumbers: [],
  lastDrawn: null,
  markedNumbers: {},
  roundPlayStatus: "idle",
};

interface GameProviderProps {
  children: ReactNode;
}

const JOINED_GAMES_KEY = '@bingo_joined_games';

export function GameProvider({ children }: GameProviderProps) {
  const [state, setState] = useState<GameState>(initialState);

  // Load joined games from AsyncStorage on mount
  useEffect(() => {
    const loadJoinedGames = async () => {
      try {
        const stored = await AsyncStorage.getItem(JOINED_GAMES_KEY);
        if (stored) {
          const joinedGames = JSON.parse(stored);
          setState(prev => ({
            ...prev,
            joinedGames,
          }));
        }
      } catch (error) {
        console.error('Error loading joined games:', error);
      }
    };
    loadJoinedGames();
  }, []);

  // Save joined games to AsyncStorage whenever they change
  useEffect(() => {
    const saveJoinedGames = async () => {
      try {
        await AsyncStorage.setItem(JOINED_GAMES_KEY, JSON.stringify(state.joinedGames));
      } catch (error) {
        console.error('Error saving joined games:', error);
      }
    };
    saveJoinedGames();
  }, [state.joinedGames]);

  const setRoundInfo = useCallback((roundId: string, playerId: string, playerCode: string) => {
    setState(prev => ({
      ...prev,
      roundId,
      playerId,
      playerCode,
    }));
  }, []);

  const setGameInfo = useCallback((gameId: string, playerId: string, playerCode: string, cardType: 'bingo' | 'bingote') => {
    setState(prev => ({
      ...prev,
      playerId,
      playerCode,
      cardType,
      joinedGames: {
        ...prev.joinedGames,
        [gameId]: { playerId, playerCode },
      },
    }));
  }, []);

  const setCards = useCallback((cards: Card[], deadline: Date | null) => {
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
      // Reset round play state
      drawnNumbers: [],
      lastDrawn: null,
      markedNumbers: {},
      roundPlayStatus: "idle",
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

  // Round play state actions
  const addDrawnNumber = useCallback((number: number) => {
    setState(prev => ({
      ...prev,
      drawnNumbers: prev.drawnNumbers.includes(number)
        ? prev.drawnNumbers
        : [...prev.drawnNumbers, number],
      lastDrawn: number,
    }));
  }, []);

  const setLastDrawn = useCallback((number: number | null) => {
    setState(prev => ({
      ...prev,
      lastDrawn: number,
    }));
  }, []);

  const markNumber = useCallback((cardId: string, number: number) => {
    setState(prev => {
      const cardMarks = prev.markedNumbers[cardId] || [];
      if (cardMarks.includes(number)) {
        return prev; // Already marked
      }
      return {
        ...prev,
        markedNumbers: {
          ...prev.markedNumbers,
          [cardId]: [...cardMarks, number],
        },
      };
    });
  }, []);

  const setRoundPlayStatus = useCallback((status: RoundPlayStatus) => {
    setState(prev => ({
      ...prev,
      roundPlayStatus: status,
    }));
  }, []);

  const value: GameContextValue = {
    ...state,
    setRoundInfo,
    setGameInfo,
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
    // Round play state
    addDrawnNumber,
    setLastDrawn,
    markNumber,
    setRoundPlayStatus,
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
