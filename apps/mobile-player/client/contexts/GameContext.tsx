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
  gameSummary: GameSummary | null;
}

interface GameContextValue extends GameState {
  // Actions
  setRoundInfo: (roundId: string, playerId: string, playerCode: string) => void;
  setCards: (cards: Card[], deadline: Date) => void;
  setSelectedCards: (cardIds: string[]) => void;
  setRoundPattern: (pattern: string) => void;
  setWinningCards: (cardIds: string[]) => void;
  setIsWinner: (isWinner: boolean) => void;
  setGameEnded: (summary: GameSummary) => void;
  clearGame: () => void;
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
  gameSummary: null,
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

  const setRoundPattern = useCallback((pattern: string) => {
    setState(prev => ({
      ...prev,
      roundPattern: pattern,
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
    setState(initialState);
  }, []);

  const value: GameContextValue = {
    ...state,
    setRoundInfo,
    setCards,
    setSelectedCards,
    setRoundPattern,
    setWinningCards,
    setIsWinner,
    setGameEnded,
    clearGame,
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
