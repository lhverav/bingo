import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface Card {
  id: string;
  cells: number[][];
}

interface GameState {
  roundId: string | null;
  playerId: string | null;
  playerCode: string | null;
  cards: Card[];
  deadline: Date | null;
  selectedCardIds: string[];
}

interface GameContextValue extends GameState {
  // Actions
  setRoundInfo: (roundId: string, playerId: string, playerCode: string) => void;
  setCards: (cards: Card[], deadline: Date) => void;
  setSelectedCards: (cardIds: string[]) => void;
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

  const clearGame = useCallback(() => {
    setState(initialState);
  }, []);

  const value: GameContextValue = {
    ...state,
    setRoundInfo,
    setCards,
    setSelectedCards,
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
