// @bingo/game-core - Shared business logic and data access

// Export all services (main public API)
export * from './services';

// Export repositories (for advanced use cases)
export { userRepository, roundRepository, cardBunchRepository, roundPlayerRepository } from './repositories';

// Export database connection (for apps that need direct access)
export { connectToDatabase } from './database/connection';
