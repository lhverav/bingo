import { Server, Socket } from "socket.io";
import {
  joinRound,
  selectCards,
  handleTimeout,
  getPlayerById,
  getRoundById,
} from "@bingo/game-core";

/**
 * Register round-related socket events
 */
export function registerRoundEvents(io: Server, socket: Socket) {
  /**
   * Player joins a round
   * Input: { roundId: string }
   * Output: { player, cards, deadline } or { error }
   */
  socket.on("player:join", async (data: { roundId: string }) => {
    try {
      const { roundId } = data;

      // Join the round (creates player, locks cards)
      const result = await joinRound({ roundId });

      // Join a socket room for this round
      socket.join(`round:${roundId}`);

      // Store player info on socket for later use
      (socket as any).playerId = result.player.id;
      (socket as any).roundId = roundId;

      // Send cards to the player
      socket.emit("cards:delivered", {
        player: result.player,
        cards: result.cards,
        deadline: result.player.selectionDeadline,
      });

      // Notify host that a player joined
      io.to(`round:${roundId}`).emit("player:joined", {
        playerCode: result.player.playerCode,
        status: result.player.status,
      });

      console.log(`Player ${result.player.playerCode} joined round ${roundId}`);

      // Set timeout for auto-assignment
      const round = await getRoundById(roundId);
      if (round?.cardDelivery) {
        const timeoutMs = round.cardDelivery.selectionTimeSeconds * 1000;

        setTimeout(async () => {
          try {
            const player = await getPlayerById(result.player.id);
            if (player && player.status === "selecting") {
              // Player didn't select in time, auto-assign
              const updated = await handleTimeout(result.player.id);
              socket.emit("cards:autoAssigned", {
                player: updated,
                selectedCardIds: updated.selectedCardIds,
              });
              io.to(`round:${roundId}`).emit("player:ready", {
                playerCode: updated.playerCode,
                cardCount: updated.selectedCardIds.length,
              });
              console.log(`Player ${updated.playerCode} timed out, auto-assigned cards`);
            }
          } catch (err) {
            console.error("Error handling timeout:", err);
          }
        }, timeoutMs);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al unirse a la ronda";
      socket.emit("error", { message });
      console.error("player:join error:", error);
    }
  });

  /**
   * Player selects their cards
   * Input: { selectedCardIds: string[] }
   * Output: { player } or { error }
   */
  socket.on("cards:selected", async (data: { selectedCardIds: string[] }) => {
    try {
      const playerId = (socket as any).playerId;
      const roundId = (socket as any).roundId;

      if (!playerId) {
        throw new Error("No has ingresado a una ronda");
      }

      const player = await selectCards({
        playerId,
        selectedCardIds: data.selectedCardIds,
      });

      // Confirm selection to player
      socket.emit("cards:confirmed", {
        player,
        selectedCardIds: player.selectedCardIds,
      });

      // Notify host that player is ready
      io.to(`round:${roundId}`).emit("player:ready", {
        playerCode: player.playerCode,
        cardCount: player.selectedCardIds.length,
      });

      console.log(`Player ${player.playerCode} selected ${player.selectedCardIds.length} cards`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al seleccionar cartones";
      socket.emit("error", { message });
      console.error("cards:selected error:", error);
    }
  });

  /**
   * Handle disconnect - clean up player data
   */
  socket.on("disconnect", () => {
    const playerCode = (socket as any).playerCode;
    const roundId = (socket as any).roundId;
    if (playerCode && roundId) {
      console.log(`Player ${playerCode} disconnected from round ${roundId}`);
    }
  });
}
