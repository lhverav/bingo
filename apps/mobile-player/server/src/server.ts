import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { getRoundById } from "@bingo/game-core";
import { registerRoundEvents } from "./events/roundEvents";
import { registerGameEvents } from "./events/gameEvents";

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

  io.emit("notification", {
    type: type || "UNKNOWN",
    message: type === "ROUND_STARTED" ? "¡Nueva ronda disponible!" : "Notificación",
    roundId: data?.roundId,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: "Notification sent" });
});
