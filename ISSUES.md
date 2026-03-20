# Issues Tracker

This file collects all issues discovered during development and testing. These will be used to update the requirements document and implementation plan.

---

## How to Use This File

Add issues under the appropriate section with the following format:

```
### [ISSUE-XXX] Brief Title
- **Type**: Functional | Technical | UX | Performance
- **Severity**: Critical | High | Medium | Low
- **Status**: Open | In Progress | Resolved | Won't Fix
- **Discovered**: YYYY-MM-DD
- **Resolved**: YYYY-MM-DD (if applicable)

**Description:**
Detailed description of the issue.

**Expected Behavior:**
What should happen.

**Actual Behavior:**
What actually happens.

**Steps to Reproduce:**
1. Step one
2. Step two

**Proposed Solution:**
How to fix it (if known).

**Related Files:**
- `path/to/file.ts`

**Notes:**
Any additional context.
```

---

## Functional / Requirements Issues

Issues related to business logic, user requirements, or feature behavior.

### [ISSUE-009] Game Join/Leave Toggle UX Enhancement
- **Type**: Functional / UX
- **Severity**: Medium
- **Status**: Resolved
- **Discovered**: 2026-03-20
- **Resolved**: 2026-03-20

**Description:**
The current game join flow navigates away from the home screen to a separate game-lobby screen. This prevents users from joining multiple games and doesn't provide a way to leave/disjoin from a game.

**Expected Behavior:**
1. When user clicks "UNIRME", show a modal/popup with game info and player code
2. User can close the modal and return to home screen immediately
3. Game card shows "DESVINCULARSE" button if already joined (toggle)
4. Player code ("Código: A7X9") appears on game card when joined
5. User can join multiple scheduled games
6. User can leave a game before it starts

**Current Behavior:**
- Clicking "UNIRME" navigates to a full-screen game-lobby
- No way to leave/disjoin from a game
- Cannot join multiple games easily
- No visual feedback on game cards for joined status

**UI Mockup:**
```
┌─────────────────────────────────┐
│  🎮 Bingo Nocturno              │
│  📅 8:00 PM                     │
│  Rondas: 3                      │
│  Código: A7X9  ← (when joined)  │
│                                 │
│  [ DESVINCULARSE ] ← joined     │
│  [    UNIRME     ] ← not joined │
└─────────────────────────────────┘
```

**Implementation Plan:**
- [x] Add `leaveGame` to gamePlayerService
- [x] Add `game:leave` socket event
- [x] Convert game-lobby to modal component (GameLobbyModal)
- [x] Update GameCard with toggle button and player code display
- [x] Track joined games state in GameContext
- [x] Update socketEventStream with leave game events
- [x] Update home.tsx with modal integration
- [x] Fix modal state persistence bug (see below)

**Bug Fix - Modal State Persistence:**
When reopening the modal for a different game, the component retained stale state (`status: "joining"`, `joinAttemptedRef: true`) from the previous open. React Native's Modal doesn't unmount children when hidden.

**Solution:** Added a `key` prop to force complete remount:
```tsx
<GameLobbyModal
  key={selectedGameId || "no-game"}  // Forces remount on new game
  visible={lobbyModalVisible}
  gameId={selectedGameId}
  ...
/>
```
This guarantees fresh state (status="connecting", attempted=false) each time a new game is selected.

**Related Files:**
- `packages/game-core/src/services/gamePlayerService.ts`
- `packages/game-core/src/repositories/gamePlayer.repository.ts`
- `apps/mobile-player/server/src/events/gameEvents.ts`
- `apps/mobile-player/client/app/home.tsx`
- `apps/mobile-player/client/components/GameCard.tsx`
- `apps/mobile-player/client/components/GameLobbyModal.tsx` (new)
- `apps/mobile-player/client/contexts/GameContext.tsx`

---

### [ISSUE-008] Architecture Gap: Round-Centric vs Game-Centric Player Flow
- **Type**: Functional / Technical
- **Severity**: Critical
- **Status**: Resolved
- **Discovered**: 2026-03-20
- **Resolved**: 2026-03-20

**Description:**
The current player join flow uses `joinRound(roundId)` which is based on the **legacy model** where rounds were standalone. The **new game flow requirements** specify that players join a GAME (not a round), and cards are selected per-game for free rounds.

When a user clicks "UNIRME" on a game card, the app tries to navigate to `join-round` with a `gameId`, but the screen expects a `roundId`, causing the error "No se especificó la ronda".

**Current Architecture (Wrong):**
```
Player → joins → Round (via roundId)
                   ↓
              RoundPlayer entity (per round)
                   ↓
              Select cards for THIS round only
```

**Required Architecture (Correct):**
```
Player → joins → GAME (via gameId)
                   ↓
              GamePlayer entity (per game)
                   ↓
              Select cards for ALL free rounds
              Buy cards for paid rounds separately
```

**Root Cause:**
Plan 010 (New Game Flow) is partially implemented:
- ✅ Game entity exists
- ✅ Round has gameId reference
- ❌ No GamePlayer entity
- ❌ No joinGame() function
- ❌ join-round.tsx still expects roundId
- ❌ No Game Lobby screen

**Impact:**
- Users cannot join games from the home screen carousel
- The entire new game flow is broken
- Card selection is per-round instead of per-game

**Implementation (Completed):**

Phase 1 - Domain Layer:
- [x] Created `GamePlayer` entity in `packages/domain/src/entities/gamePlayer.ts`

Phase 2 - Database Layer:
- [x] Created `packages/game-core/src/database/schemas/gamePlayer.schema.ts`
- [x] Created `packages/game-core/src/database/mappers/gamePlayer.mapper.ts`
- [x] Created `packages/game-core/src/repositories/gamePlayer.repository.ts`

Phase 3 - Service Layer:
- [x] Created `packages/game-core/src/services/gamePlayerService.ts` with `joinGame()`, `getPlayersByGame()`, etc.

Phase 4 - Mobile Server:
- [x] Added `game:join` socket event handler in `gameEvents.ts`
- [x] Added `game:joined` response event

Phase 5 - Mobile Client:
- [x] Created `GameLobby` screen (`apps/mobile-player/client/app/game-lobby.tsx`)
- [x] Updated `home.tsx` to navigate to `/game-lobby` with gameId
- [x] Added `JoinedGameEvent` types to `socketEventStream.ts`
- [x] Created `useGameJoinSocket` hook in `useSocketEvents.ts`

**New Entity: GamePlayer**
```typescript
interface GamePlayer {
  id: string;
  gameId: string;
  mobileUserId?: string;
  playerCode: string;
  status: 'joined' | 'cards_selected' | 'playing';
  freeCardIds: string[];           // Cards for ALL free rounds
  paidRoundCards: {                // Cards per paid round
    roundId: string;
    cardIds: string[];
  }[];
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Related Files:**
- `packages/domain/src/entities/gamePlayer.ts` (created)
- `packages/game-core/src/database/schemas/gamePlayer.schema.ts` (created)
- `packages/game-core/src/database/mappers/gamePlayer.mapper.ts` (created)
- `packages/game-core/src/repositories/gamePlayer.repository.ts` (created)
- `packages/game-core/src/services/gamePlayerService.ts` (created)
- `apps/mobile-player/server/src/events/gameEvents.ts` (updated)
- `apps/mobile-player/client/app/game-lobby.tsx` (created)
- `apps/mobile-player/client/app/home.tsx` (updated)
- `apps/mobile-player/client/services/socketEventStream.ts` (updated)
- `apps/mobile-player/client/hooks/useSocketEvents.ts` (updated)

**Notes:**
The legacy `RoundPlayer` entity remains for backwards compatibility. New code uses `GamePlayer` for the game-centric flow. Players now join games via the Game Lobby screen, which shows the game info and player code while waiting for rounds to start.

---

### [ISSUE-007] Mobile App Not Notified When Round is Created/Updated/Deleted
- **Type**: Functional
- **Severity**: Medium
- **Status**: Resolved
- **Discovered**: 2026-03-20
- **Resolved**: 2026-03-20

**Description:**
When a host creates, updates, or deletes a round within a game, the mobile app does not update. The game carousel shows the old rounds list until the user manually refreshes.

**Expected Behavior:**
When a round is created/updated/deleted:
1. Web host sends notification to mobile server
2. Mobile server broadcasts event to all connected clients
3. Mobile app refreshes the game carousel to show updated rounds

**Actual Behavior:**
The rounds list in the game card only loads on initial mount. Changes to rounds are not reflected in real-time.

**Implementation (Completed):**

**Step 1 - Web Host:** Added notifications in `gameRounds.ts`:
- `createGameRoundAction` → POST `ROUND_CREATED`
- `updateGameRoundAction` → POST `ROUND_UPDATED`
- `deleteGameRoundAction` → POST `ROUND_DELETED`

**Step 2 - Mobile Server:** Added handlers in `/notify`:
- `ROUND_CREATED` → emits `round:created`
- `ROUND_UPDATED` → emits `round:updated`
- `ROUND_DELETED` → emits `round:deleted`

**Step 3 - Mobile Client:** Added socket listeners in GameCarousel:
```typescript
socket.on("round:created", () => loadGames());
socket.on("round:updated", () => loadGames());
socket.on("round:deleted", () => loadGames());
```

**Related Files:**
- `apps/web-host/src/lib/actions/gameRounds.ts` (updated)
- `apps/mobile-player/server/src/server.ts` (updated)
- `apps/mobile-player/client/components/GameCarousel.tsx` (updated)

---

### [ISSUE-006] Mobile App Not Notified When New Game is Created
- **Type**: Functional
- **Severity**: Medium
- **Status**: Resolved
- **Discovered**: 2026-03-20
- **Resolved**: 2026-03-20

**Description:**
When a user is already logged in and viewing the home screen, creating a new game through the web host does not notify the mobile app. The user must manually refresh or re-enter the screen to see new scheduled games.

**Expected Behavior:**
When a new game is created in the web host:
1. Web host sends notification to mobile server
2. Mobile server broadcasts `game:created` event to all connected clients
3. Mobile app receives event and refreshes the game carousel automatically

**Actual Behavior:**
The game carousel only loads games on initial mount. New games created while the user is on the home screen are not displayed until the user navigates away and returns.

**Root Cause:**
Missing real-time notification flow:
1. Web host `/api/games` POST action doesn't notify mobile server
2. Mobile server doesn't have a `GAME_CREATED` notification handler
3. Mobile app `GameCarousel` doesn't listen for game creation events

**Implementation (Completed):**

**Step 1 - Web Host:** Added notification after game creation in `createGameAction`:
```typescript
await fetch(`${MOBILE_SERVER_URL}/notify`, {
  method: 'POST',
  body: JSON.stringify({ type: 'GAME_CREATED', data: { gameId, name, cardType, scheduledAt } })
});
```

**Step 2 - Mobile Server:** Added handlers for game lifecycle events:
- `GAME_CREATED` → emits `game:created`
- `GAME_STARTED` → emits `game:started`
- `GAME_FINISHED` → emits `game:finished`
- `GAME_CANCELLED` → emits `game:cancelled`

**Step 3 - Mobile Client:** Added socket listeners in GameCarousel:
```typescript
socket.on("game:created", () => loadGames());
socket.on("game:started", () => loadGames());
socket.on("game:finished", () => loadGames());
socket.on("game:cancelled", () => loadGames());
```

**Related Files:**
- `apps/web-host/src/lib/actions/games.ts` (updated)
- `apps/mobile-player/server/src/server.ts` (updated)
- `apps/mobile-player/client/components/GameCarousel.tsx` (updated)

**Notes:**
This follows the same pattern already used for `ROUND_STARTED` notifications. Also added handlers for game started/finished/cancelled for complete lifecycle coverage.

---

### [ISSUE-005] Home Screen Missing Game Schedule Carousel
- **Type**: Functional
- **Severity**: Medium
- **Status**: Resolved
- **Discovered**: 2026-03-20
- **Resolved**: 2026-03-20

**Description:**
According to `new-game-flow-requirements.md`, the home screen should display a carousel of scheduled games below the YouTube player. Currently, only the YouTube player and connection status are shown.

**Expected Behavior (from requirements):**
```
┌─────────────────────────────────────────────────┐
│           YOUTUBE STREAM                        │
│  ─────────── Próximos Juegos ───────────────   │
│  ┌───────────────────────────────────────────┐  │
│  │  🎮 Bingo Nocturno                        │  │
│  │  📅 15 Mar 2026 - 8:00 PM                 │  │
│  │  Rondas:                                  │  │
│  │  • Ronda 1 - Gratis                       │  │
│  │  • Ronda 2 - Pago ($5.000 COP)            │  │
│  │  [         UNIRME          ]              │  │
│  └───────────────────────────────────────────┘  │
│        [  ◄  ]              [  ►  ]            │
└─────────────────────────────────────────────────┘
```

**Actual Behavior:**
Home screen only shows YouTube player and connection status. No game schedule visible.

**Root Cause:**
This feature is part of Plan 010 - Phase 14, which has not been implemented yet. Plan 010 is currently at Phase 1.

**Implementation Plan:**
- [x] 14.1 Create GameCarousel component
- [x] 14.2 Create GameCard component
- [x] 14.3 Update home screen with carousel
- [x] 14.4 Create games API client
- [x] Server-side: Add `/games` endpoint to mobile server

**Related Files:**
- `apps/mobile-player/client/app/home.tsx` (updated)
- `apps/mobile-player/client/components/GameCarousel.tsx` (created)
- `apps/mobile-player/client/components/GameCard.tsx` (created)
- `apps/mobile-player/client/api/games.ts` (created)
- `apps/mobile-player/server/src/routes/games.routes.ts` (created)
- `apps/mobile-player/server/src/controllers/games.controller.ts` (created)
- `apps/mobile-player/server/src/server.ts` (updated)
- `docs/requerimientos/new-game-flow-requirements.md` (requirements)
- `docs/plans/010-new-game-flow.md` (implementation plan)

---

## Technical Issues

Issues related to code, architecture, performance, or infrastructure.

### [ISSUE-001] NEXT_REDIRECT Error When Creating New Game
- **Type**: Technical
- **Severity**: High
- **Status**: Resolved
- **Discovered**: 2026-03-19
- **Resolved**: 2026-03-19

**Description:**
When creating a new game in the web-host application, the error "NEXT_REDIRECT" appears instead of redirecting to the game details page.

**Expected Behavior:**
After successfully creating a game, the user should be redirected to `/host/juegos/{gameId}`.

**Actual Behavior:**
The error "NEXT_REDIRECT" is displayed to the user, and the redirect does not occur properly.

**Root Cause:**
In Next.js 14, the `redirect()` function works by throwing a special internal error called `NEXT_REDIRECT`. When `redirect()` is placed inside a try-catch block, this error is caught and treated as a regular error, preventing the redirect from working.

**Affected Files:**
- `apps/web-host/src/lib/actions/games.ts`
- `apps/web-host/src/lib/actions/gameRounds.ts`
- `apps/web-host/src/lib/actions/patterns.ts`

**Solution:**
Move `redirect()` and `revalidatePath()` calls outside of try-catch blocks. Store the result (e.g., `gameId`) in a variable inside the try block, then call redirect after the try-catch.

**Before (incorrect):**
```typescript
try {
  const game = await createGame({...});
  revalidatePath("/host/juegos");
  redirect(`/host/juegos/${game.id}`);  // THROWS NEXT_REDIRECT - gets caught!
} catch (error) {
  redirect(`/host/juegos/crear?error=${message}`);
}
```

**After (correct):**
```typescript
let gameId: string;
try {
  const game = await createGame({...});
  gameId = game.id;
} catch (error) {
  redirect(`/host/juegos/crear?error=${message}`);
}
revalidatePath("/host/juegos");
redirect(`/host/juegos/${gameId}`);
```

**Notes:**
This is a common gotcha in Next.js 14 Server Actions. Error redirects inside catch blocks are fine because they are intentional. Only success redirects need to be moved outside.

---

---

## UX Issues

Issues related to user experience, UI design, or usability.

<!-- Add UX issues here -->

---

## Integration Issues

Issues related to communication between components (web-host, mobile-player, server, etc.)

### [ISSUE-004] Socket.io "xhr poll error" When Using Ngrok Tunnel
- **Type**: Integration
- **Severity**: High
- **Status**: Resolved
- **Discovered**: 2026-03-20
- **Resolved**: 2026-03-20

**Description:**
After login, the home screen shows "Socket connection error: xhr poll error" even though the ngrok tunnel is active and HTTP requests (like OAuth) work correctly.

**Expected Behavior:**
Socket.io should connect successfully through the ngrok tunnel.

**Actual Behavior:**
Socket.io connection fails with "xhr poll error". Server logs show `GET /socket.io/ 200 OK` but the client can't parse the response.

**Root Cause:**
Ngrok free tier displays an interstitial "Visit Site" warning page for browser requests. Socket.io's polling mechanism receives this HTML page instead of the expected socket.io response, causing a parse error.

**Solution:**
Add the `ngrok-skip-browser-warning` header to socket.io connection options:

```typescript
const newSocket = io(serverConfig.baseUrl, {
  // ... other options
  extraHeaders: {
    "ngrok-skip-browser-warning": "true",
  },
});
```

**Affected Files:**
- `apps/mobile-player/client/contexts/SocketContext.tsx`

**Notes:**
This only affects ngrok free tier. Paid ngrok plans or local network testing don't have this issue.

---

## Data / Database Issues

Issues related to data models, database schema, or data integrity.

<!-- Add data issues here -->

---

## Pending Clarifications

Questions that need answers from stakeholders before proceeding.

<!-- Add clarification requests here -->

---

## Resolved Issues Log

Moved here after resolution for historical tracking.

<!-- Move resolved issues here with resolution notes -->

### [ISSUE-002] Client-Only Module Error on Create Round Page
- **Type**: Technical
- **Severity**: High
- **Status**: Resolved
- **Discovered**: 2026-03-19
- **Resolved**: 2026-03-19

**Description:**
When clicking "create round" inside a game, the page fails to compile with the error: `'client-only' cannot be imported from a Server Component module`.

**Expected Behavior:**
The create round page should load normally as a Server Component.

**Actual Behavior:**
Compilation error with path showing `../../node_modules` indicating incorrect module resolution.

**Root Cause:**
The `@bingo/game-core` package was not included in the `transpilePackages` configuration in next.config.js. In a pnpm monorepo, workspace packages that use TypeScript must be explicitly listed in `transpilePackages` for Next.js to properly resolve and transpile them.

**Affected Files:**
- `apps/web-host/next.config.js`

**Solution:**
Added `@bingo/game-core` to the `transpilePackages` array:

```javascript
const nextConfig = {
  transpilePackages: ['@bingo/shared', '@bingo/domain', '@bingo/game-core'],
};
```

**Notes:**
After fixing, may need to delete `.next` cache folder and restart dev server.

---

### [ISSUE-003] Styled-JSX in Server Components Causes Build Error
- **Type**: Technical
- **Severity**: High
- **Status**: Resolved
- **Discovered**: 2026-03-19
- **Resolved**: 2026-03-19

**Description:**
Multiple pages fail to compile with the error `'client-only' cannot be imported from a Server Component module` when using `<style jsx>` tags.

**Root Cause:**
`<style jsx>` is a client-side styling feature from styled-jsx that cannot be used in React Server Components. Server Components cannot use browser-only APIs or client-side libraries.

**Affected Files:**
- `apps/web-host/src/app/host/juegos/[id]/rondas/crear/page.tsx`
- `apps/web-host/src/app/host/juegos/[id]/rondas/editar/[roundId]/page.tsx`
- `apps/web-host/src/app/host/parametros/page.tsx`
- `apps/web-host/src/app/host/patrones/page.tsx`

**Solution:**
1. Moved all styles from `<style jsx>` blocks to `globals.css`
2. Removed the `<style jsx>` blocks from the Server Component files
3. Client Components (files with `"use client"`) can keep using styled-jsx

**Notes:**
When creating new pages, either:
- Use CSS modules or global CSS for Server Components
- Add `"use client"` directive if styled-jsx is needed

---

## Summary Stats

| Category | Open | In Progress | Resolved |
|----------|------|-------------|----------|
| Functional | 0 | 0 | 5 |
| Technical | 0 | 0 | 3 |
| UX | 0 | 0 | 0 |
| Integration | 0 | 0 | 1 |
| Data | 0 | 0 | 0 |

Last Updated: 2026-03-20
