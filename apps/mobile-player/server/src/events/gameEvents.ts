import { Server, Socket } from "socket.io";
import { joinGame, leaveGame, getGameById } from "@bingo/game-core";

/**
 * Register game-related socket events
 */
export function registerGameEvents(io: Server, socket: Socket) {
  /**
   * Player joins a game (new flow)
   * Input: { gameId: string, mobileUserId?: string }
   * Emits: game:joined with player data
   */
  socket.on("game:join", async (data: { gameId: string; mobileUserId?: string }) => {
    try {
      const { gameId, mobileUserId } = data;
      console.log(`[game:join] Player joining game ${gameId}, mobileUserId: ${mobileUserId}`);

      // Join the game using the service
      const result = await joinGame({ gameId, mobileUserId });

      // Get game details
      const game = await getGameById(gameId);

      // Join the socket to the game room
      socket.join(`game:${gameId}`);

      // Store player info on socket for later use
      (socket as any).playerId = result.player.id;
      (socket as any).playerCode = result.player.playerCode;
      (socket as any).gameId = gameId;

      // Send success response
      socket.emit("game:joined", {
        player: result.player,
        game,
        isReconnect: result.isReconnect,
        message: result.isReconnect
          ? "¡Bienvenido de nuevo!"
          : "¡Te has unido al juego exitosamente!",
      });

      console.log(
        `[game:join] Player ${result.player.playerCode} joined game ${gameId} (reconnect: ${result.isReconnect})`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al unirse al juego";
      socket.emit("game:join:error", { message });
      console.error("[game:join] Error:", error);
    }
  });

  /**
   * Player leaves a game (new flow)
   * Input: { gameId: string, mobileUserId: string }
   * Emits: game:left on success
   */
  socket.on("game:leave", async (data: { gameId: string; mobileUserId: string }) => {
    try {
      const { gameId, mobileUserId } = data;
      console.log(`[game:leave] Player leaving game ${gameId}, mobileUserId: ${mobileUserId}`);

      // Leave the game using the service
      await leaveGame(gameId, mobileUserId);

      // Leave the socket room
      socket.leave(`game:${gameId}`);

      // Clear player info from socket
      (socket as any).playerId = null;
      (socket as any).playerCode = null;
      (socket as any).gameId = null;

      // Send success response
      socket.emit("game:left", {
        gameId,
        message: "Has salido del juego exitosamente",
      });

      console.log(`[game:leave] Player left game ${gameId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al salir del juego";
      socket.emit("game:leave:error", { message });
      console.error("[game:leave] Error:", error);
    }
  });

  /**
   * Host starts the game (ball drawing phase)
   * Input: { roundId: string }
   * Broadcasts to all players in the round
   */
  socket.on("game:start", async (data: { roundId: string }) => {
    try {
      const { roundId } = data;

      // Broadcast to all players in the round that game has started
      io.to(`round:${roundId}`).emit("game:started", {
        roundId,
        message: "El juego ha comenzado. Prepárate para marcar tus cartones.",
      });

      console.log(`Game started for round ${roundId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al iniciar el juego";
      socket.emit("error", { message });
      console.error("game:start error:", error);
    }
  });

  /**
   * Host draws a ball (number)
   * Input: { roundId: string, number: number }
   * Broadcasts to all players in the round
   */
  socket.on("ball:drawn", async (data: { roundId: string; number: number }) => {
    try {
      const { roundId, number } = data;

      // Broadcast the drawn number to all players
      io.to(`round:${roundId}`).emit("ball:announced", {
        number,
        timestamp: new Date().toISOString(),
      });

      console.log(`Ball ${number} drawn for round ${roundId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al anunciar número";
      socket.emit("error", { message });
      console.error("ball:drawn error:", error);
    }
  });

  /**
   * Host ends the game
   * Input: { roundId: string }
   * Broadcasts to all players in the round
   */
  socket.on("game:end", async (data: { roundId: string }) => {
    try {
      const { roundId } = data;

      // Broadcast game end to all players
      io.to(`round:${roundId}`).emit("game:ended", {
        roundId,
        message: "El juego ha finalizado.",
      });

      console.log(`Game ended for round ${roundId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al finalizar el juego";
      socket.emit("error", { message });
      console.error("game:end error:", error);
    }
  });

  /**
   * Player claims bingo
   * Input: { roundId: string, cardId: string }
   * Broadcasts to host for verification
   */
  socket.on("bingo:claim", async (data: { roundId: string; cardId: string }) => {
    try {
      const { roundId, cardId } = data;
      const playerCode = (socket as any).playerCode || "Unknown";

      // Broadcast bingo claim to the round (host will see this)
      io.to(`round:${roundId}`).emit("bingo:claimed", {
        playerCode,
        cardId,
        timestamp: new Date().toISOString(),
      });

      console.log(`Bingo claimed by ${playerCode} for card ${cardId} in round ${roundId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al reclamar bingo";
      socket.emit("error", { message });
      console.error("bingo:claim error:", error);
    }
  });
}
