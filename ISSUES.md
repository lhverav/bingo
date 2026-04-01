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

### [ISSUE-013] Game Created Notification Not Received by Mobile Client
- **Type**: Functional / Integration
- **Severity**: Medium
- **Status**: In Progress
- **Discovered**: 2026-03-30

**Description:**
When a game is created in the web host, the mobile app does not receive the `game:created` notification even though:
1. The mobile server receives the notification correctly
2. The server emits the event via `io.emit("game:created", ...)`
3. The user's socket is connected (verified in server logs)

**Server Log (shows notification received and emitted):**
```
A user connected: rtIEdkNs8PnzccGRAAAB
Received notification request: GAME_CREATED {
  gameId: '69cc2f5ace53cefa2fa5b5b9',
  name: 'sdfsadf',
  ...
}
New game created: sdfsadf (69cc2f5ace53cefa2fa5b5b9)
```

**Expected Behavior:**
1. Server emits `game:created` to all connected clients
2. Mobile client's `GameCarousel` receives event
3. Console shows `🎮 New game created, refreshing list...`
4. Game list refreshes automatically

**Actual Behavior:**
The game list does not refresh. No client-side log appears.

**Possible Causes:**
1. Socket ID mismatch between connected socket and the one `GameCarousel` is listening on
2. Event listener not properly set up (useEffect timing issue)
3. Socket reference changed after OAuth redirect but listeners weren't re-attached

**Investigation Notes:**
- User was on "Proximos Juegos" screen when game was created
- Socket connection was established (server shows `A user connected`)
- `GameCarousel` has listeners set up in useEffect with `[socket, loadGames]` dependencies

**Related Files:**
- `apps/mobile-player/client/components/GameCarousel.tsx`
- `apps/mobile-player/client/contexts/SocketContext.tsx`
- `apps/mobile-player/server/src/server.ts`

---

### [ISSUE-012] Mobile Navigation Returns to Google Selector Instead of Main Page
- **Type**: UX / Architecture
- **Severity**: Medium
- **Status**: Resolved
- **Discovered**: 2026-03-30
- **Resolved**: 2026-03-31

**Description:**
When pressing the Android hardware back button from the game detail screen, the app navigates to "Seleccionar cuenta de Google" (Google account selector) instead of returning to the main tabs.

**Root Cause:**
1. Auth and App flows shared the same Stack Navigator
2. Screens used `router.back()` which navigates to the previous item in the navigation stack
3. After Google OAuth login, the auth screens remain in the navigation history
4. Pressing back navigated to those auth screens
5. No visible navigation options on standalone screens like game-detail

**Solution - Navigation Architecture Overhaul:**

**1. Created Root Navigation Guard (`app/index.tsx`):**
```typescript
export default function RootIndex() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/proximos-juegos" />;
  }

  return <Redirect href="/(auth)" />;
}
```

**2. Updated Root Layout with Isolated Flows:**
```
_layout.tsx (Root - Auth Guard)
├── index           ← Navigation guard (checks auth)
├── IF NOT authenticated:
│   └── (auth)/*    ← Auth Stack (isolated)
│
├── IF authenticated:
│   └── (tabs)/*    ← App Stack (isolated)
│   └── game-detail, join-round, etc.
```

**3. Auth Completion Navigates to Root:**
All auth completion points (login, registration) now use `router.replace("/")` instead of `router.replace("/(tabs)/...")`. This resets the navigation stack completely.

**4. Added BackHandler for Android hardware back button**

**5. Added Bottom Navigation Bar** to game-detail screen

**Navigation Flow Diagram:**
```
User Opens App
      │
      ▼
   index.tsx
   (Auth Guard)
      │
      ├─── isAuthenticated=true ──► Redirect to /(tabs)
      │                              (clean stack, no auth screens)
      │
      └─── isAuthenticated=false ─► Redirect to /(auth)
                                     (auth flow begins)

After Login/Registration:
      │
      ▼
router.replace("/")
      │
      ▼
   index.tsx
   (Auth Guard)
      │
      ▼
isAuthenticated=true
      │
      ▼
Redirect to /(tabs)
(entire auth stack is replaced)
```

**Key Changes:**
- `apps/mobile-player/client/app/index.tsx` (NEW - root navigation guard)
- `apps/mobile-player/client/app/_layout.tsx` (updated with isolated flows)
- `apps/mobile-player/client/app/home.tsx` (simplified to redirect to root)
- `apps/mobile-player/client/app/(auth)/login/email.tsx` (uses router.replace("/"))
- `apps/mobile-player/client/app/(auth)/profile/notifications.tsx` (uses router.replace("/"))
- `apps/mobile-player/client/app/oauth-callback.tsx` (uses router.replace("/"))
- `apps/mobile-player/client/app/(tabs)/perfil.tsx` (logout uses router.replace("/"))
- `apps/mobile-player/client/app/game-detail.tsx` (BackHandler + BottomNavBar)
- `apps/mobile-player/client/app/games.tsx` (BackHandler)
- `apps/mobile-player/client/app/join-round.tsx` (BackHandler)
- `apps/mobile-player/client/app/game-lobby.tsx` (BackHandler)

---

### [ISSUE-011] On-the-fly Round Creation - Games Can Start Without Rounds
- **Type**: Functional
- **Severity**: Low
- **Status**: Resolved
- **Discovered**: 2026-03-30
- **Resolved**: 2026-03-30

**Description:**
Previously, games required at least one round to be configured before the game could start. This was too restrictive for hosts who want to create rounds dynamically during the game.

**Previous Behavior:**
- `startGame()` validated that `roundCount > 0`
- Error: "No hay rondas configuradas para este juego"
- Rounds could only be added when game status was "scheduled"

**New Behavior:**
- Games can start with zero rounds
- Rounds can be added while game is "scheduled" OR "active"
- Mobile players receive `ROUND_CREATED` notification when new rounds are added

**Implementation:**
1. Removed round count validation from `gameService.startGame()`
2. Changed `createGameRoundAction` to allow `game.status === "active"`
3. Updated UI to show "Add Round" button for both scheduled and active games
4. Round creation page accessible when game is active

**Related Files:**
- `packages/game-core/src/services/gameService.ts`
- `apps/web-host/src/lib/actions/gameRounds.ts`
- `apps/web-host/src/app/host/juegos/[id]/page.tsx`
- `apps/web-host/src/app/host/juegos/[id]/rondas/crear/page.tsx`

---

### [ISSUE-010] Payment Configuration Moved from Round to Game Level
- **Type**: Functional / Architecture
- **Severity**: High
- **Status**: Resolved
- **Discovered**: 2026-03-30
- **Resolved**: 2026-03-30

**Description:**
The payment configuration (`isPaid`, `pricePerCard`, `currency`) was previously at the Round level. This was incorrect because players should pay once per game, not per round. Players can change their cards between rounds (always free).

**Previous Architecture (Wrong):**
```
Game
  └── Round 1 (isPaid: true, pricePerCard: 5000, currency: COP)
  └── Round 2 (isPaid: false)
  └── Round 3 (isPaid: true, pricePerCard: 3000, currency: COP)
```

**New Architecture (Correct):**
```
Game (isPaid: true, pricePerCard: 5000, currency: COP)
  └── Round 1 (no payment fields)
  └── Round 2 (no payment fields)
  └── Round 3 (no payment fields)
```

**Implementation:**

**Domain Layer:**
- `game.ts`: Added `isPaid`, `pricePerCard`, `currency` fields
- `round.ts`: Removed payment fields
- `gamePlayer.ts`: Simplified, removed `cardsPerPlayer` (redundant with GeneralParameters)

**Database Layer:**
- `game.schema.ts`: Added payment fields
- `round.schema.ts`: Removed payment fields
- `gamePlayer.schema.ts`: Restructured for game-level payment

**Service Layer:**
- `gameService.ts`: Added payment validation rules
  - Paid games must have price and currency
  - Free games should not have price

**Host UI:**
- Game creation/edit pages now have payment fields
- Round creation/edit pages no longer have payment fields
- New `PaymentFields.tsx` client component for payment toggle
- Game detail shows payment badge at game level

**Related Files:**
- `packages/domain/src/entities/game.ts`
- `packages/domain/src/entities/round.ts`
- `packages/domain/src/entities/gamePlayer.ts`
- `packages/game-core/src/database/schemas/game.schema.ts`
- `packages/game-core/src/database/schemas/round.schema.ts`
- `packages/game-core/src/database/schemas/gamePlayer.schema.ts`
- `packages/game-core/src/database/mappers/game.mapper.ts`
- `packages/game-core/src/database/mappers/round.mapper.ts`
- `packages/game-core/src/database/mappers/gamePlayer.mapper.ts`
- `packages/game-core/src/services/gameService.ts`
- `apps/web-host/src/app/host/juegos/crear/page.tsx`
- `apps/web-host/src/app/host/juegos/crear/PaymentFields.tsx` (new)
- `apps/web-host/src/app/host/juegos/editar/[id]/page.tsx`
- `apps/web-host/src/app/host/juegos/[id]/page.tsx`
- `apps/web-host/src/app/host/juegos/[id]/rondas/crear/page.tsx`
- `apps/web-host/src/app/host/juegos/[id]/rondas/editar/[roundId]/page.tsx`
- `apps/web-host/src/lib/actions/games.ts`
- `apps/web-host/src/lib/actions/gameRounds.ts`

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

*(ISSUE-012 documented in Functional section as it involved code changes)*

---

## Feature Implementations

Features that have been implemented and should be documented for reference.

### [FEATURE-001] Mobile User Authentication System
- **Type**: Feature
- **Status**: Implemented
- **Date**: 2026-03 (multiple commits)

**Description:**
Complete authentication system for mobile players with multiple login methods.

**Authentication Methods:**
1. **Email + Password**: Traditional email/password registration and login
2. **Google OAuth**: Login via Google account with OAuth2 flow
3. **Phone + SMS**: Phone number with SMS verification (structure ready)

**Profile Setup Flow:**
1. Select auth method (email/Google/phone)
2. Enter credentials
3. Complete profile: Name, Birthdate, Gender
4. Accept terms and notification preferences

**Implementation:**
- `packages/domain/src/entities/mobileUser.ts` - MobileUser entity
- `packages/game-core/src/services/mobileUserService.ts` - Auth services
- `apps/mobile-player/client/app/(auth)/` - Auth screens:
  - `login/hub.tsx`, `login/email.tsx` - Login flows
  - `register/hub.tsx`, `register/email.tsx`, `register/password.tsx` - Registration
  - `register/google-selector.tsx` - Google OAuth
  - `register/phone.tsx`, `register/sms-verification.tsx` - Phone auth
  - `profile/name.tsx`, `profile/birthdate.tsx`, `profile/gender.tsx` - Profile setup
  - `profile/terms.tsx`, `profile/notifications.tsx` - Preferences
- `apps/mobile-player/client/contexts/AuthContext.tsx` - Auth state management
- `apps/mobile-player/server/src/routes/auth.routes.ts` - Auth API endpoints

---

### [FEATURE-002] Mobile Tab Navigation System
- **Type**: Feature
- **Status**: Implemented
- **Date**: 2026-03

**Description:**
Bottom tab navigation for the mobile app with three main sections.

**Tabs:**
1. **Proximos Juegos** - YouTube stream + scheduled games carousel
2. **Mis Juegos** - List of games the user has joined
3. **Perfil** - User profile and settings

**Implementation:**
- `apps/mobile-player/client/app/(tabs)/_layout.tsx` - Tab navigator
- `apps/mobile-player/client/app/(tabs)/proximos-juegos.tsx` - Games carousel + YouTube
- `apps/mobile-player/client/app/(tabs)/mis-juegos.tsx` - Joined games list
- `apps/mobile-player/client/app/(tabs)/perfil.tsx` - Profile screen

---

### [FEATURE-003] Card Bunch Generation System
- **Type**: Feature
- **Status**: Implemented
- **Date**: 2026-03

**Description:**
System for pre-generating large quantities of bingo cards that can be assigned to players.

**Capabilities:**
- Generate cards with configurable grid size (3-10)
- Configurable number range (1 to maxNumber)
- Generate in chunks to handle millions of cards
- Progress tracking during generation
- Card bunches stored separately from games for reuse

**Implementation:**
- `packages/domain/src/entities/cardBunch.ts` - CardBunch entity
- `packages/domain/src/entities/bunchCard.ts` - Individual cards in a bunch
- `packages/game-core/src/services/cardBunchService.ts` - Generation logic
- `apps/web-host/src/app/host/cartas/page.tsx` - Card bunch list
- `apps/web-host/src/app/host/cartas/crear/page.tsx` - Create card bunch
- `apps/web-host/src/app/host/cartas/crear/CardBunchFormWithProgress.tsx` - Progress UI

---

### [FEATURE-004] Pattern Management System
- **Type**: Feature
- **Status**: Implemented
- **Date**: 2026-03

**Description:**
System for defining and managing winning patterns for bingo games.

**Pattern Types:**
- **Preset patterns**: Line, Column, Diagonal, Corners, Full
- **Custom patterns**: User-defined cell configurations

**Features:**
- Visual pattern editor
- Pattern preview
- CRUD operations for custom patterns
- Pattern checking logic for winner verification

**Implementation:**
- `packages/domain/src/entities/pattern.ts` - Pattern entity
- `packages/game-core/src/services/patternService.ts` - Pattern CRUD + checking
- `apps/web-host/src/app/host/patrones/page.tsx` - Pattern list
- `apps/web-host/src/app/host/patrones/crear/page.tsx` - Create pattern
- `apps/web-host/src/app/host/patrones/editar/[id]/page.tsx` - Edit pattern
- `apps/web-host/src/app/host/patrones/PatternEditor.tsx` - Visual editor component

---

### [FEATURE-005] General Parameters Configuration
- **Type**: Feature
- **Status**: Implemented
- **Date**: 2026-03

**Description:**
Global configuration parameters for game settings.

**Parameters:**
- `selectionTimeSeconds`: Time limit for card selection (default: 60)
- `freeCardsDelivered`: Cards delivered in free games (default: 5)
- `freeCardsToSelect`: Cards player can select in free games (default: 2)
- `maxCardsToBuy`: Maximum cards purchasable (default: 10)
- `paidCardsToIssue`: Cards delivered in paid games (default: 5)

**Implementation:**
- `packages/domain/src/entities/generalParameters.ts` - Entity + defaults
- `packages/game-core/src/services/generalParametersService.ts` - CRUD services
- `apps/web-host/src/app/host/parametros/page.tsx` - Configuration UI

---

### [FEATURE-006] Winner Detection System
- **Type**: Feature
- **Status**: Implemented
- **Date**: 2026-03

**Description:**
Real-time winner detection when numbers are drawn.

**Capabilities:**
- Check all player cards against current pattern when number drawn
- Verify individual bingo claims
- Generate game summary with winners

**Implementation:**
- `packages/game-core/src/services/winnerService.ts`
  - `checkForWinners()` - Check all cards after each draw
  - `verifyWinner()` - Verify a specific bingo claim
  - `getGameSummary()` - Generate end-of-round summary

---

### [FEATURE-007] Playing Flow (Mobile)
- **Type**: Feature
- **Status**: Implemented
- **Date**: 2026-03

**Description:**
Complete playing experience on mobile devices.

**Flow:**
1. **Join Round** - Connect to round via socket
2. **Card Selection** - Receive cards, select within time limit
3. **Game Screen** - View cards, mark numbers, claim BINGO
4. **Winner Overlay** - Celebrate win or see results

**Features:**
- Real-time ball announcements with haptic feedback
- Tap-to-mark numbers on cards
- BINGO button for claiming wins
- Pattern visualization popup
- Auto-assignment on timeout
- Winner detection and notification

**Implementation:**
- `apps/mobile-player/client/app/join-round.tsx` - Join flow
- `apps/mobile-player/client/app/card-selection.tsx` - Card selection
- `apps/mobile-player/client/app/game.tsx` - Game screen
- `apps/mobile-player/client/components/BingoCard.tsx` - Card component
- `apps/mobile-player/client/components/CountdownTimer.tsx` - Selection timer

---

### [FEATURE-008] RxJS Socket Event Stream
- **Type**: Feature / Technical
- **Status**: Implemented
- **Date**: 2026-03

**Description:**
Centralized reactive socket event handling using RxJS Observables.

**Benefits:**
- Clean separation of socket event logic
- Composable event streams
- Easy cleanup on unmount
- Type-safe event handling

**Event Streams:**
- `roundJoined$` - Player joined round
- `cardsDelivered$` - Cards received
- `cardsConfirmed$` - Card selection confirmed
- `ballAnnounced$` - Number drawn
- `winnersDetected$` - Winners found
- `gameEnding$` - Round ending
- `notification$` - General notifications

**Implementation:**
- `apps/mobile-player/client/services/socketEventStream.ts` - Event stream service
- `apps/mobile-player/client/hooks/useSocketEvents.ts` - React hooks for streams

---

### [FEATURE-009] Legacy Standalone Rounds System
- **Type**: Feature
- **Status**: Implemented (Legacy)
- **Date**: 2026-03

**Description:**
Original round management system where rounds were standalone entities (not tied to games). Kept for backwards compatibility.

**Note:** The new flow uses Games with Rounds. This legacy system allows creating/playing rounds without a parent game.

**Implementation:**
- `apps/web-host/src/app/host/rondas/page.tsx` - Round list
- `apps/web-host/src/app/host/rondas/crear/page.tsx` - Create round
- `apps/web-host/src/app/host/rondas/editar/[id]/page.tsx` - Edit round
- `apps/web-host/src/app/host/rondas/[id]/page.tsx` - Round details
- `apps/web-host/src/app/host/rondas/[id]/jugar/page.tsx` - Play round
- `apps/web-host/src/app/host/rondas/[id]/jugar/GameBoard.tsx` - Game board

---

### [FEATURE-010] Game-Round Playing System (New)
- **Type**: Feature
- **Status**: Implemented
- **Date**: 2026-03

**Description:**
New game playing system where rounds belong to games.

**Implementation:**
- `apps/web-host/src/app/host/juegos/[id]/rondas/[roundId]/jugar/page.tsx` - Play round in game
- `apps/web-host/src/app/host/juegos/[id]/rondas/[roundId]/jugar/GameRoundBoard.tsx` - Game board

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

### Issues
| Category | Open | In Progress | Resolved |
|----------|------|-------------|----------|
| Functional | 0 | 1 | 7 |
| Technical | 0 | 0 | 3 |
| UX | 0 | 0 | 1 |
| Integration | 0 | 0 | 1 |
| Data | 0 | 0 | 0 |

### Features Documented
| Feature | Status |
|---------|--------|
| FEATURE-001: Mobile User Authentication | Implemented |
| FEATURE-002: Tab Navigation System | Implemented |
| FEATURE-003: Card Bunch Generation | Implemented |
| FEATURE-004: Pattern Management | Implemented |
| FEATURE-005: General Parameters Config | Implemented |
| FEATURE-006: Winner Detection System | Implemented |
| FEATURE-007: Playing Flow (Mobile) | Implemented |
| FEATURE-008: RxJS Socket Event Stream | Implemented |
| FEATURE-009: Legacy Standalone Rounds | Implemented (Legacy) |
| FEATURE-010: Game-Round Playing System | Implemented |

Last Updated: 2026-03-30
