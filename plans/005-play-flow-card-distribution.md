# Plan 005 — Play Flow: Card Distribution & Selection

**Status:** In Progress
**Created:** 2026-02-09
**Goal:** Implement the player join flow where players receive cards, select their preferred ones within a time limit, and prepare for gameplay.

> General rules (approval flow, install policy, one-edit-per-step) live in `plans/RULES.md`.

---

## Requirements Summary

From `D:\bingo\requerimientos\Flujo Jugar.pdf`:

1. Host clicks "Start Round"
2. Player clicks "Join Round"
3. Player receives configurable number of free cards for selection
4. Player has configurable time to select preferred cards (countdown visible)
5. If timeout, system auto-assigns configurable number of cards
6. System displays selected/assigned cards
7. When distribution ends, host can draw balls (automatic for now)
8. Player marks drawn numbers on their cards

---

## Configuration Fields (Per Round)

```typescript
interface CardDeliveryConfig {
  selectionTimeSeconds: number;     // Time for player to select (e.g., 60)
  freeCardsDelivered: number;       // Cards shown to player (e.g., 3)
  freeCardsToSelect: number;        // Cards player must choose (e.g., 2)
  freeCardsOnTimeout: number;       // Auto-assigned if timeout (e.g., 1)
}
```

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Card source | From linked CardBunch | Already implemented, cards pre-generated |
| Card uniqueness | Unique per player | Fair gameplay, no duplicates |
| Game phase start | Host clicks "Start Drawing" | More control for host |
| Paid cards | Deferred | Focus on free cards first |
| Configuration scope | Per Round | Flexible, host decides per game |
| Player identification | Auto-generated code | Simple, no auth needed for MVP |
| Authentication | Deferred to Plan 006 | OAuth/Google login in future plan |

---

## New Entities

### RoundPlayer

Tracks a player who joined a round and their card assignments.

```typescript
interface RoundPlayer {
  id: string;
  roundId: string;
  playerCode: string;              // Auto-generated unique code (e.g., "A7X9")
  status: 'selecting' | 'ready';   // Current state
  lockedCardIds: string[];         // Temporarily locked for selection
  selectedCardIds: string[];       // Permanently assigned after selection
  selectionDeadline: Date;         // When selection time expires
  joinedAt: Date;
}
```

**Player Code Format:**
- 4-character alphanumeric (e.g., "A7X9", "B3K2")
- Generated server-side when player joins
- Unique within a round
- Displayed to player and host for identification

**Card Locking System:**
- When player joins: Cards are TEMPORARILY LOCKED in `lockedCardIds`
- When player selects: Selected cards move to `selectedCardIds`, `lockedCardIds` is cleared
- Unselected cards are RELEASED back to pool for other players
- On timeout: Auto-assign N cards, release the rest

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLOW DIAGRAM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WEB HOST                      SOCKET SERVER                 MOBILE CLIENT  │
│  ─────────                     ─────────────                 ─────────────  │
│                                                                             │
│  [Start Round] ──► POST /api/round/start                                    │
│                         │                                                   │
│                         ▼                                                   │
│                    emit: round:started ─────────────────────► [Show Join]   │
│                                                                             │
│                                         ◄─── emit: player:join ── [Join]    │
│                         │                                                   │
│                         ▼                                                   │
│                    [Generate playerCode: "A7X9"]                            │
│                    [Assign cards from CardBunch]                            │
│                    [Create RoundPlayer]                                     │
│                         │                                                   │
│                         ▼                                                   │
│                    emit: cards:delivered ───────────────────► [Show Cards]  │
│                    { cards[], deadline }                      [Countdown]   │
│                                                                             │
│                                         ◄─ emit: cards:selected ─ [Select]  │
│                         │                                                   │
│                         ▼                                                   │
│                    [Update RoundPlayer]                                     │
│                    emit: player:ready ──────────────────────► [Show Final]  │
│                                                                             │
│  [See players] ◄── emit: player:joined                                      │
│                                                                             │
│  [Start Drawing] ─► POST /api/round/start-game                              │
│                         │                                                   │
│                         ▼                                                   │
│                    emit: game:started ──────────────────────► [Game Mode]   │
│                                                                             │
│  [Draw Ball] ────► emit: ball:drawn ────────────────────────► [Mark Card]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1 — Domain Layer

| Step | File | Action | Purpose | Status |
|------|------|--------|---------|--------|
| 1.1 | `packages/domain/src/entities/roundPlayer.ts` | CREATE | Define RoundPlayer entity interface | [x] Completed |
| 1.2 | `packages/domain/src/entities/index.ts` | UPDATE | Export RoundPlayer entity | [x] Completed |
| 1.3 | `packages/domain/src/entities/round.ts` | UPDATE | Add CardDeliveryConfig to Round, CreateRoundData, UpdateRoundData | [x] Completed |

### Phase 2 — Database Layer (game-core)

| Step | File | Action | Purpose | Status |
|------|------|--------|---------|--------|
| 2.1 | `packages/game-core/src/database/schemas/roundPlayer.schema.ts` | CREATE | Mongoose schema for RoundPlayer | [x] Completed |
| 2.2 | `packages/game-core/src/database/schemas/round.schema.ts` | UPDATE | Add cardDelivery embedded document | [x] Completed |
| 2.3 | `packages/game-core/src/database/schemas/index.ts` | UPDATE | Export RoundPlayerModel | [x] Completed |
| 2.4 | `packages/game-core/src/database/mappers/roundPlayer.mapper.ts` | CREATE | RoundPlayer document ↔ entity mapper | [x] Completed |
| 2.5 | `packages/game-core/src/database/mappers/round.mapper.ts` | UPDATE | Handle cardDelivery in toDomain/toDatabase | [x] Completed |
| 2.6 | `packages/game-core/src/database/mappers/index.ts` | UPDATE | Export RoundPlayerMapper | [x] Completed |

### Phase 3 — Repository Layer (game-core)

| Step | File | Action | Purpose | Status |
|------|------|--------|---------|--------|
| 3.1 | `packages/game-core/src/repositories/roundPlayer.repository.ts` | CREATE | CRUD operations for RoundPlayer | [x] Completed |
| 3.2 | `packages/game-core/src/repositories/index.ts` | UPDATE | Export roundPlayerRepository | [x] Completed |

### Phase 4 — Service Layer (game-core)

| Step | File | Action | Purpose | Status |
|------|------|--------|---------|--------|
| 4.1 | `packages/game-core/src/services/roundPlayerService.ts` | CREATE | Business logic: joinRound, selectCards, handleTimeout | [x] Completed |
| 4.2 | `packages/game-core/src/services/roundService.ts` | UPDATE | Add cardDelivery to CreateRoundInput/UpdateRoundInput | [x] Completed |
| 4.3 | `packages/game-core/src/services/index.ts` | UPDATE | Export roundPlayer service functions | [x] Completed |
| 4.4 | `packages/game-core/src/index.ts` | UPDATE | Export roundPlayerRepository and service | [x] Completed |

### Phase 5 — Web Host (Round Configuration UI)

| Step | File | Action | Purpose | Status |
|------|------|--------|---------|--------|
| 5.1 | `apps/web-host/src/app/host/rondas/crear/page.tsx` | UPDATE | Add card delivery config fields to form | [x] Completed |
| 5.2 | `apps/web-host/src/lib/actions/rounds.ts` | UPDATE | Handle cardDelivery in create/update actions | [x] Completed |

### Phase 6 — Web Host (Game Management UI)

| Step | File | Action | Purpose | Status |
|------|------|--------|---------|--------|
| 6.1 | `apps/web-host/src/app/api/round/[id]/players/route.ts` | CREATE | API to get players in round | [x] Completed |
| 6.2 | `apps/web-host/src/app/host/rondas/[id]/jugar/page.tsx` | UPDATE | Fetch and pass players to GameBoard | [x] Completed |
| 6.3 | `apps/web-host/src/app/host/rondas/[id]/jugar/GameBoard.tsx` | UPDATE | Add players section to show joined players | [x] Completed |

> **Note:** Game page already exists with ball drawing functionality. We're enhancing it to show players.

### Phase 7 — Mobile Server (Socket.io Events)

| Step | File | Action | Purpose | Status |
|------|------|--------|---------|--------|
| 7.1 | `apps/mobile-player/server/src/events/roundEvents.ts` | CREATE | Handle round:started, player:join, cards:selected | [x] Completed |
| 7.2 | `apps/mobile-player/server/src/events/gameEvents.ts` | CREATE | Handle game:started, ball:drawn | [x] Completed |
| 7.3 | `apps/mobile-player/server/src/server.ts` | UPDATE | Register event handlers | [x] Completed |

### Phase 8 — Mobile Client (Player UI)

| Step | File | Action | Purpose | Status |
|------|------|--------|---------|--------|
| 8.1 | `apps/mobile-player/client/app/join-round.tsx` | CREATE | Screen to join a round | [x] Completed |
| 8.2 | `apps/mobile-player/client/app/card-selection.tsx` | CREATE | Show delivered cards, countdown, selection UI | [x] Completed |
| 8.3 | `apps/mobile-player/client/app/game.tsx` | CREATE | Display final cards, mark drawn numbers | [x] Completed |
| 8.4 | `apps/mobile-player/client/components/BingoCard.tsx` | CREATE | Reusable card component with tap-to-mark | [x] Completed |
| 8.5 | `apps/mobile-player/client/components/CountdownTimer.tsx` | CREATE | Visual countdown component | [x] Completed |
| 8.6 | `apps/mobile-player/client/app/_layout.tsx` | UPDATE | Add new screens to navigation | [x] Completed |

### Phase 9 — Verification

| Step | Action | Purpose | Status |
|------|--------|---------|--------|
| 9.1 | `pnpm build` | Verify no TypeScript errors | [x] Completed |
| 9.2 | Test: Create round with card delivery config | Verify form works | [ ] Pending |
| 9.3 | Test: Player joins round | Verify cards delivered | [ ] Pending |
| 9.4 | Test: Player selects cards | Verify selection saved | [ ] Pending |
| 9.5 | Test: Selection timeout | Verify auto-assignment | [ ] Pending |
| 9.6 | Test: Host starts game | Verify ball drawing works | [ ] Pending |
| 9.7 | Test: Player marks cards | Verify real-time sync | [ ] Pending |

---

## Progress Summary

- **Total Steps:** 34
- **Completed:** 30
- **Next Step:** 9.2-9.7 — Manual testing of game flow

---

## Rollback

If something goes wrong:
```bash
git status          # see what changed
git restore .       # discard all modifications
git clean -fd       # remove untracked files
```

Then reset the relevant step checkboxes in this file.
