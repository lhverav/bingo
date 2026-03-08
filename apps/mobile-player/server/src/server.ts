import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { getRoundById } from "@bingo/game-core";
import { registerRoundEvents } from "./events/roundEvents";
import { registerGameEvents } from "./events/gameEvents";
import authRoutes from "./routes/auth.routes";

// Load environment variables from .env file

dotenv.config();

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Example route using game-core
app.get("/rounds/:id", async (req, res) => {
  try {
    const round = await getRoundById(req.params.id);
    if (!round) {
      return res.status(404).json({ error: "Round not found" });
    }
    res.json(round);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// TODO: Add routes
// - Auth routes
// - Game routes
// - Player routes

// app.listen(PORT, () => {
//   console.log(`Mobile player server running on port ${PORT}`);
// });

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Register event handlers
  registerRoundEvents(io, socket);
  registerGameEvents(io, socket);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

let counter = 0;

// setInterval(() => {
//   counter++;
//   io.emit("notification", {
//     type: "TEST",
//     message: `Test notification
//   #${counter}`,
//     timestamp: new Date().toISOString(),
//   });
//   console.log(`Sent notification
//   #${counter}`);
// }, 5000);

httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

app.post("/notify", (req, res) => {
  const { type, data } = req.body;
  console.log("Received notification request:", type, data);

  const timestamp = new Date().toISOString();

  switch (type) {
    case "NUMBER_DRAWN":
      // Notify all players in the round about the drawn number
      console.log("[server] NUMBER_DRAWN received:", data);
      if (data?.roundId && typeof data?.number === "number") {
        const roomName = `round:${data.roundId}`;
        const room = io.sockets.adapter.rooms.get(roomName);
        console.log(`[server] Room ${roomName} has ${room?.size || 0} sockets`);

        io.to(roomName).emit("ball:announced", {
          number: data.number,
          timestamp,
        });

        // If there are winners, notify them
        if (data.winners && data.winners.length > 0) {
          console.log(`[server] Emitting winners:detected to ${roomName}`);
          io.to(roomName).emit("winners:detected", {
            winningCardIds: data.winners.map((w: { cardId: string }) => w.cardId),
            winners: data.winners,
            timestamp,
          });
          console.log(`[server] Winners detected in round ${data.roundId}:`, data.winners);
        } else {
          console.log(`[server] No winners in this draw`);
        }

        console.log(`[server] Ball ${data.number} announced to round ${data.roundId}`);
      }
      break;

    case "ROUND_ENDED":
      // Notify all players that the round has ended with summary
      if (data?.roundId) {
        io.to(`round:${data.roundId}`).emit("game:ending", {
          roundId: data.roundId,
          summary: {
            winners: data.winners || [],
            pattern: data.pattern,
            totalPlayers: data.totalPlayers,
            numbersDrawn: data.numbersDrawn,
          },
          timestamp,
        });
        console.log(`Round ${data.roundId} ended, notified players`);
      }
      break;

    case "ROUND_STARTED":
      // Broadcast to all connected clients
      io.emit("notification", {
        type: "ROUND_STARTED",
        message: "¡Nueva ronda disponible!",
        roundId: data?.roundId,
        timestamp,
      });
      break;

    default:
      // Generic notification
      io.emit("notification", {
        type: type || "UNKNOWN",
        message: "Notificación",
        roundId: data?.roundId,
        timestamp,
      });
  }

  res.json({ success: true, message: "Notification sent" });
});
