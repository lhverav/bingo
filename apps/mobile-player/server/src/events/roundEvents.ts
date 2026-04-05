import { Server, Socket } from "socket.io";
import {
  joinRound,
  requestCards,
  selectCards,
  handleTimeout,
  getPlayerById,
  getPlayerCards,
  roundRepository,
  patternRepository,
} from "@bingo/game-core";

/**
 * Register round-related socket events
 */
export function registerRoundEvents(io: Server, socket: Socket) {
  /**
   * Player joins a round
   * Input: { roundId: string, mobileUserId?: string }
   * Output: { player, isReconnect } or { error }
   */
  socket.on("player:join", async (data: { roundId: string; mobileUserId?: string }) => {
    try {
      const { roundId, mobileUserId } = data;

      // ALWAYS clear previous state before joining any round
      const previousRoundId = (socket as any).roundId;
      if (previousRoundId) {
        socket.leave(`round:${previousRoundId}`);
        console.log(`Socket left previous room: round:${previousRoundId}`);
      }

      // Clear socket properties BEFORE joining new round
      (socket as any).playerId = null;
      (socket as any).roundId = null;
      (socket as any).playerCode = null;

      // Join the round (creates player or returns existing)
      const result = await joinRound({ roundId, mobileUserId });

      // Get round and pattern info
      const round = await roundRepository.findById(roundId);
      let roundPattern: string | null = null;
      let patternCells: boolean[][] | null = null;
      if (round?.patternId) {
        const pattern = await patternRepository.findById(round.patternId);
        roundPattern = pattern?.name || null;
        patternCells = pattern?.cells || null;
      }

      // Join a socket room for this round
      socket.join(`round:${roundId}`);

      // Store player info on socket for later use
      (socket as any).playerId = result.player.id;
      (socket as any).roundId = roundId;
      (socket as any).playerCode = result.player.playerCode;

      // If player is already ready (has game-level cards), fetch the card data
      let cards: { id: string; cells: number[][] }[] = [];
      if (result.player.status === "ready" && result.player.selectedCardIds.length > 0) {
        const playerCards = await getPlayerCards(result.player.id);
        cards = playerCards.map((c) => ({ id: c.id, cells: c.cells }));
      }

      // Send confirmation to the player with pattern info and cards (if ready)
      socket.emit("player:joined", {
        player: {
          id: result.player.id,
          playerCode: result.player.playerCode,
          status: result.player.status,
          selectedCardIds: result.player.selectedCardIds,
        },
        isReconnect: result.isReconnect,
        roundPattern,
        patternCells,
        cards, // Include cards if player is ready
      });

      // Notify others in the round (only for new players, not reconnects)
      if (!result.isReconnect) {
        socket.to(`round:${roundId}`).emit("player:new", {
          playerCode: result.player.playerCode,
        });
      }

      console.log(
        `Player ${result.player.playerCode} ${result.isReconnect ? "reconnected to" : "joined"} round ${roundId}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al unirse a la ronda";
      socket.emit("error", { message });
      console.error("player:join error:", error);
    }
  });

  /**
   * Player requests cards (on card-selection screen)
   * Input: { playerId?: string }
   * Output: { player, cards, deadline } or { error }
   */
  socket.on("cards:request", async (data: { playerId?: string }) => {
    try {
      const playerId = data.playerId || (socket as any).playerId;
      const roundId = (socket as any).roundId;

      if (!playerId) {
        throw new Error("No has ingresado a una ronda");
      }

      // Request cards (locks cards, sets deadline)
      const result = await requestCards({ playerId });

      // Send cards to the player
      socket.emit("cards:delivered", {
        player: result.player,
        cards: result.cards,
        deadline: result.deadline,
      });

      // Notify host that player is now selecting
      io.to(`round:${roundId}`).emit("player:selecting", {
        playerCode: result.player.playerCode,
      });

      console.log(`Player ${result.player.playerCode} requested cards, deadline: ${result.deadline}`);

      // Set timeout for auto-assignment
      if (!result.deadline) {
        console.error('No deadline returned from requestCards');
        return;
      }
      const timeoutMs = result.deadline.getTime() - Date.now();
      if (timeoutMs > 0) {
        setTimeout(async () => {
          try {
            const player = await getPlayerById(playerId);
            if (player && player.status === "selecting") {
              // Player didn't select in time, auto-assign
              const updated = await handleTimeout(playerId);
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
      const message = error instanceof Error ? error.message : "Error al solicitar cartones";
      socket.emit("error", { message });
      console.error("cards:request error:", error);
    }
  });

  /**
   * Player selects their cards
   * Input: { selectedCardIds: string[] }
   * Output: { player } or { error }
   */
  socket.on("cards:selected", async (data: { selectedCardIds: string[]; playerId?: string }) => {
    try {
      const playerId = data.playerId || (socket as any).playerId;
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
   * Player explicitly leaves the round (going home, etc.)
   * This allows leaving a round without fully disconnecting
   */
  socket.on("player:leave", () => {
    const playerCode = (socket as any).playerCode;
    const roundId = (socket as any).roundId;

    if (roundId) {
      socket.leave(`round:${roundId}`);
      console.log(`Player ${playerCode || 'unknown'} left round ${roundId}`);
    }

    // Clean up socket properties
    (socket as any).playerId = null;
    (socket as any).roundId = null;
    (socket as any).playerCode = null;

    // Confirm leave to client
    socket.emit("player:left");
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
    // Clean up socket properties
    (socket as any).playerId = null;
    (socket as any).roundId = null;
    (socket as any).playerCode = null;
  });
}
