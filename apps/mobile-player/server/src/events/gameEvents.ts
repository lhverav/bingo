import { Server, Socket } from "socket.io";

/**
 * Register game-related socket events
 */
export function registerGameEvents(io: Server, socket: Socket) {
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
