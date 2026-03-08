// User services
export {
  findUserByCredentials,
  getUserById,
  createUser,
} from './userService';

// Round services
export {
  createRound,
  getRoundsByUser,
  getAllRounds,
  getRoundById,
  updateRound,
  deleteRound,
  startRound,
  endRound,
  drawNumber,
} from './roundService';

export type { CreateRoundInput, UpdateRoundInput } from './roundService';

// CardBunch services
export {
  createCardBunch,
  saveCardBunch,
  getCardBunches,
  getCardBunchesByDimensions,
  deleteCardBunch,
  generateCards,
  generateCardsInChunks,
  generateAndSaveCardsInChunks,
} from './cardBunchService';

export type { CreateCardBunchInput, SaveCardBunchInput, GenerateAndSaveInput } from './cardBunchService';

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

// Pattern services
export { checkPattern, getPatternMask } from './patternService';

// Winner services
export { checkForWinners, verifyWinner, getGameSummary } from './winnerService';

export type { WinnerInfo, WinnerCheckResult, GameSummary } from './winnerService';
