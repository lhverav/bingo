# Play Flow Debug Guide

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PLAY FLOW                                            │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │    MongoDB      │
                                    │  (port 27017)   │
                                    │                 │
                                    │ Collections:    │
                                    │ - rounds        │
                                    │ - roundplayers  │◄──────────────────────┐
                                    │ - bunchcards    │                       │
                                    └────────┬────────┘                       │
                                             │                                │
                         ┌───────────────────┼───────────────────┐            │
                         │                   │                   │            │
                         ▼                   ▼                   ▼            │
              ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
              │   game-core      │ │   game-core      │ │   game-core      │  │
              │  (shared pkg)    │ │  (shared pkg)    │ │  (shared pkg)    │  │
              └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘  │
                       │                    │                    │            │
                       ▼                    ▼                    ▼            │
┌──────────────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────┐
│      WEB HOST (Next.js)      │  │  MOBILE SERVER      │  │      MOBILE CLIENT          │
│        PORT 3000             │  │  PORT 3001          │  │        (Expo)               │
│                              │  │  (Socket.io)        │  │                             │
│  ┌────────────────────────┐  │  │                     │  │  ┌───────────────────────┐  │
│  │ Host starts round      │  │  │                     │  │  │ Player sees popup     │  │
│  │ POST /api/rounds/start │──┼──┼──► emit: round:     │──┼──┼─► notification        │  │
│  └────────────────────────┘  │  │       started       │  │  └───────────────────────┘  │
│                              │  │                     │  │              │              │
│                              │  │                     │  │              ▼              │
│                              │  │  ┌───────────────┐  │  │  ┌───────────────────────┐  │
│                              │  │  │ player:join   │◄─┼──┼──┤ Player clicks "Jugar" │  │
│                              │  │  │ handler       │  │  │  │ join-round.tsx        │  │
│                              │  │  └───────┬───────┘  │  │  └───────────────────────┘  │
│                              │  │          │          │  │                             │
│                              │  │          ▼          │  │                             │
│                              │  │  ┌───────────────┐  │  │                             │
│                              │  │  │ joinRound()   │──┼──┼──────────────────────────┐  │
│                              │  │  │ service       │  │  │                          │  │
│                              │  │  └───────┬───────┘  │  │                          │  │
│                              │  │          │          │  │                          │  │
│                              │  │          ▼          │  │                          ▼  │
│                              │  │  ┌───────────────┐  │  │  ┌───────────────────────┐  │
│                              │  │  │ cards:        │──┼──┼─►│ CardSelectionScreen   │  │
│                              │  │  │ delivered     │  │  │  │ card-selection.tsx    │  │
│                              │  │  └───────────────┘  │  │  └───────────────────────┘  │
│                              │  │                     │  │                             │
│  ┌────────────────────────┐  │  │                     │  │                             │
│  │ GameBoard.tsx          │  │  │                     │  │                             │
│  │ POLLS every 3 seconds  │  │  │  (No socket conn)   │  │                             │
│  │ GET /api/round/[id]/   │  │  │                     │  │                             │
│  │     players            │  │  │                     │  │                             │
│  └────────────────────────┘  │  │                     │  │                             │
│                              │  │                     │  │                             │
└──────────────────────────────┘  └─────────────────────┘  └─────────────────────────────┘
```

---

## Files to Debug (with console.log locations)

### 1. MOBILE SERVER - Socket Events

**File:** `apps/mobile-player/server/src/events/roundEvents.ts`

```typescript
// Line 19-24: After player:join event starts
socket.on("player:join", async (data: { roundId: string }) => {
  try {
    const { roundId } = data;
    console.log("🔵 [roundEvents] player:join received, roundId:", roundId);  // ADD THIS

    const result = await joinRound({ roundId });
    console.log("✅ [roundEvents] Player created:", {                          // ADD THIS
      playerCode: result.player.playerCode,
      playerId: result.player.id,
      cardsCount: result.cards.length,
      lockedCardIds: result.player.lockedCardIds,
    });

// Line 74-78: Error handler
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al unirse a la ronda";
    console.error("❌ [roundEvents] player:join ERROR:", error);               // ALREADY EXISTS
    socket.emit("error", { message });
  }
```

---

### 2. GAME-CORE - Service Layer

**File:** `packages/game-core/src/services/roundPlayerService.ts`

```typescript
// Line 101-146: joinRound function
export async function joinRound(input: JoinRoundInput): Promise<JoinRoundResult> {
  console.log("🔵 [roundPlayerService] joinRound called, roundId:", input.roundId);  // ADD THIS

  const round = await roundRepository.findById(input.roundId);
  console.log("📋 [roundPlayerService] Round found:", {                               // ADD THIS
    exists: !!round,
    status: round?.status,
    cardBunchId: round?.cardBunchId,
    cardDelivery: round?.cardDelivery,
  });

  if (!round) {
    throw new Error('Ronda no encontrada');
  }
  // ... rest of validation

  // Line 143: After player creation
  const player = await roundPlayerRepository.create(createData);
  console.log("✅ [roundPlayerService] Player saved to DB:", player.id);              // ADD THIS

  return { player, cards };
}
```

---

### 3. GAME-CORE - Repository Layer

**File:** `packages/game-core/src/repositories/roundPlayer.repository.ts`

```typescript
// Line 32-36: findByRoundId (used by API polling)
async findByRoundId(roundId: string): Promise<RoundPlayer[]> {
  await connectToDatabase();
  console.log("🔍 [roundPlayerRepo] Finding players for round:", roundId);     // ADD THIS
  const docs = await RoundPlayerModel.find({ roundId }).sort({ joinedAt: 1 });
  console.log("📊 [roundPlayerRepo] Found players:", docs.length);             // ADD THIS
  return docs.map(RoundPlayerMapper.toDomain);
}

// Line 40-45: create
async create(data: CreateRoundPlayerData): Promise<RoundPlayer> {
  await connectToDatabase();
  console.log("💾 [roundPlayerRepo] Creating player:", data);                  // ADD THIS
  const dbData = RoundPlayerMapper.toDatabase(data);
  const doc = await RoundPlayerModel.create(dbData);
  console.log("✅ [roundPlayerRepo] Player created with _id:", doc._id);       // ADD THIS
  return RoundPlayerMapper.toDomain(doc);
}
```

---

### 4. WEB HOST - API Endpoint

**File:** `apps/web-host/src/app/api/round/[id]/players/route.ts`

```typescript
// Line 15-17: After getting players
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ... session check

  try {
    console.log("🔵 [API /players] Fetching players for round:", params.id);   // ADD THIS
    const players = await getPlayersByRound(params.id);
    console.log("📊 [API /players] Returning players:", {                      // ADD THIS
      count: players.length,
      codes: players.map(p => p.playerCode),
    });
    return NextResponse.json({ players });
  } catch (error) {
    // ...
  }
}
```

---

### 5. WEB HOST - GameBoard Component

**File:** `apps/web-host/src/app/host/rondas/[id]/jugar/GameBoard.tsx`

```typescript
// Line 38-48: Polling effect
const fetchPlayers = async () => {
  try {
    console.log("🔄 [GameBoard] Polling players...");                          // ADD THIS
    const response = await fetch(`/api/round/${roundId}/players`);
    if (response.ok) {
      const data = await response.json();
      console.log("📊 [GameBoard] Received players:", data.players.length);    // ADD THIS
      setPlayers(data.players);
    }
  } catch (err) {
    console.error("❌ [GameBoard] Error fetching players:", err);
  }
};
```

---

### 6. MOBILE CLIENT - Join Round Screen

**File:** `apps/mobile-player/client/app/join-round.tsx`

```typescript
// Line 31-35: Socket connection
newSocket.on("connect", () => {
  console.log("🔵 [join-round] Connected to server, joining round...");       // ALREADY EXISTS
  setStatus("joining");
  console.log("📤 [join-round] Emitting player:join for roundId:", roundId);  // ADD THIS
  newSocket.emit("player:join", { roundId });
});

// Line 37-47: cards:delivered handler
newSocket.on("cards:delivered", (data) => {
  console.log("✅ [join-round] Cards received:", {                             // ADD THIS
    playerCode: data.player.playerCode,
    cardsCount: data.cards.length,
    deadline: data.deadline,
  });
  // ... navigate to card-selection
});

// Line 49-53: error handler
newSocket.on("error", (data: { message: string }) => {
  console.error("❌ [join-round] Server error:", data.message);                // ALREADY EXISTS
  // ...
});
```

---

## Debug Flow Checklist

When a player joins, you should see logs in this order:

| Step | Location | Log Prefix | What to Check |
|------|----------|------------|---------------|
| 1 | Mobile Client | `[join-round]` | Socket connected, emitting player:join |
| 2 | Mobile Server | `[roundEvents]` | player:join received |
| 3 | game-core | `[roundPlayerService]` | Round found with correct status |
| 4 | game-core | `[roundPlayerRepo]` | Player created in DB |
| 5 | Mobile Server | `[roundEvents]` | Player created, cards assigned |
| 6 | Mobile Client | `[join-round]` | Cards received |
| 7 | Web Host (poll) | `[GameBoard]` | Polling triggered |
| 8 | Web Host API | `[API /players]` | Players fetched from DB |
| 9 | Web Host | `[GameBoard]` | Players state updated |

---

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Round not started | "La ronda no esta disponible" | Start round from web host first |
| No cardBunch linked | "La ronda no tiene un lote de cartones" | Link a card bunch when creating round |
| No cardDelivery config | "La ronda no tiene configuracion" | Fill card delivery fields in round form |
| Different DB connections | Players created but not visible | Check MONGODB_URI in both apps' .env |
| Socket not connecting | No logs after "Connecting..." | Check SERVER_URL in mobile client |

---

## Quick Test Commands

```bash
# Check MongoDB for players directly
mongosh bingo_dev --eval "db.roundplayers.find().pretty()"

# Test API endpoint directly
curl http://localhost:3000/api/round/{ROUND_ID}/players

# Watch mobile server logs
cd apps/mobile-player/server && pnpm dev

# Watch web host logs
cd apps/web-host && pnpm dev
```
