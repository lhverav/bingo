// User services
export {
  findUserByCredentials,
  getUserById,
  createUser,
} from './userService';

// Game services
export {
  createGame,
  getAllGames,
  getAllGamesWithRoundCount,
  getGamesByStatus,
  getGamesByUser,
  getUpcomingGames,
  getGameById,
  updateGame,
  startGame,
  finishGame,
  cancelGame,
  deleteGame,
} from './gameService';

export type { CreateGameInput, UpdateGameInput, GameWithRoundCount } from './gameService';

// Round services
export {
  startRound,
  endRound,
  drawNumber,
  deleteRound,
} from './roundService';

// CardBunch services
export {
  getCardBunches,
  getCardBunchesByType,
  deleteCardBunch,
  generateCardByType,
  generateAndSaveCardsInChunks,
} from './cardBunchService';

export type { CreateCardBunchInput, GenerateAndSaveInput } from './cardBunchService';

// RoundPlayer services
export {
  joinRound,
  requestCards,
  selectCards,
  handleTimeout,
  getPlayersByRound,
  getPlayerById,
  getPlayerByCode,
  countPlayersInRound,
  getPlayerCards,
} from './roundPlayerService';

export type { JoinRoundInput, JoinRoundResult, RequestCardsInput, RequestCardsResult, SelectCardsInput } from './roundPlayerService';

// MobileUser services
export {
  register,
  loginWithEmail,
  loginWithOAuth,
  verifyToken,
  getMobileUserById,
  updateProfile,
  checkEmailExists,
  checkPhoneExists,
} from './mobileUserService';

// Pattern services (CRUD + checking)
export {
  createPattern,
  getAllPatterns,
  getPatternsByCardType,
  getPresetPatterns,
  getCustomPatterns,
  getPatternById,
  updatePattern,
  deletePattern,
  checkCustomPattern,
} from './patternService';

export type { CreatePatternInput, UpdatePatternInput } from './patternService';

// GeneralParameters services
export {
  getGeneralParameters,
  updateGeneralParameters,
  resetGeneralParameters,
} from './generalParametersService';

// Winner services
export { checkForWinners, verifyWinner, getGameSummary } from './winnerService';

export type { WinnerInfo, WinnerCheckResult, GameSummary } from './winnerService';

// GamePlayer services
export {
  joinGame,
  leaveGame,
  getPlayersByGame,
  getGamePlayerById,
  getGamePlayerByCode,
  getGamePlayerByMobileUser,
  countPlayersInGame,
  updateGamePlayerStatus,
  getJoinedGames,
} from './gamePlayerService';

export type { JoinGameInput } from './gamePlayerService';
