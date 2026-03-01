=============================================================================
COMMIT: Socket Architecture Refactor (Plan 008)
Date: 2026-02-28
=============================================================================

SUMMARY
-------
Refactored mobile app socket communication to use shared context, separated
join from card request, and added server-side duplicate protection.

=============================================================================
PROBLEM SOLVED
=============================================================================
- Mobile app created new socket connection on each screen
- player:join emitted multiple times, creating duplicate players
- Timeout started at join, not when cards were delivered (unfair)
- No server-side protection against duplicate player creation

=============================================================================
CHANGES BY FILE
=============================================================================

DOMAIN LAYER
------------
packages/domain/src/entities/roundPlayer.ts
  - Added "joined" status to RoundPlayerStatus type
  - Made selectionDeadline optional (set when cards requested, not at join)

DATABASE LAYER
--------------
packages/game-core/src/database/schemas/roundPlayer.schema.ts
  - Added "joined" to status enum

REPOSITORY LAYER
----------------
packages/game-core/src/repositories/roundPlayer.repository.ts
  - Added findByRoundAndMobileUser() for duplicate detection
  - Added updateForCardRequest() to lock cards and set deadline

SERVICE LAYER
-------------
packages/game-core/src/services/roundPlayerService.ts
  - Refactored joinRound(): now only creates player (no cards)
  - Added requestCards(): locks cards, sets deadline, starts timer
  - Added upsert logic: returns existing player if already joined
  - Added stale data handling for inconsistent player states

packages/game-core/src/services/index.ts
  - Exported new requestCards function

SERVER EVENT HANDLERS
---------------------
apps/mobile-player/server/src/events/roundEvents.ts
  - Refactored player:join: only creates player, emits player:joined
  - Added cards:request handler: delivers cards, starts timeout
  - Added guard for undefined deadline

MOBILE CLIENT - NEW FILES
-------------------------
apps/mobile-player/client/contexts/SocketContext.tsx (NEW)
  - Shared socket provider with connect/disconnect
  - Uses useRef to prevent infinite re-render loop
  - Single socket instance shared across all screens

apps/mobile-player/client/contexts/GameContext.tsx (NEW)
  - Stores playerId, playerCode, roundId, cards, deadline
  - Persists game state between screen navigations

apps/mobile-player/client/contexts/index.ts (NEW)
  - Exports all context providers and hooks

MOBILE CLIENT - UPDATED FILES
-----------------------------
apps/mobile-player/client/app/_layout.tsx
  - Wrapped app with SocketProvider and GameProvider

apps/mobile-player/client/app/join-round.tsx
  - Uses shared socket from context
  - Only emits player:join (no cards)
  - Sends mobileUserId for duplicate protection
  - Stores player info in GameContext

apps/mobile-player/client/app/card-selection.tsx
  - Uses shared socket from context
  - Emits cards:request to get cards
  - Removed duplicate join logic

apps/mobile-player/client/app/game.tsx
  - Uses shared socket from context

CONFIG
------
.vscode/settings.json (NEW)
  - Hides tmpclaude-* temp files from VS Code explorer

=============================================================================
BUGS FIXED DURING IMPLEMENTATION
=============================================================================

1. INFINITE SOCKET RECONNECTIONS
   File: SocketContext.tsx
   Cause: connect() callback depended on socket state, causing re-renders
   Fix: Used useRef to track socket without triggering re-renders

2. NaN:NaN TIMER / "Cannot read properties of undefined (reading 'getTime')"
   File: roundEvents.ts, roundPlayerService.ts
   Cause: selectionDeadline was undefined when calling .getTime()
   Fix: Added null checks and guards for undefined deadline

3. "Jugador en estado de seleccion sin fecha limite"
   File: roundPlayerService.ts
   Cause: Stale data - player in 'selecting' status but no deadline
   Fix: Reset deadline for stale players instead of throwing error

4. CARDS NOT DISPLAYING (timer shows but no cards)
   File: roundPlayerService.ts
   Cause: Stale data - player in 'selecting' but lockedCardIds empty
   Fix: Get NEW cards from bunch if lockedCardIds is empty

=============================================================================
NEW PLAYER STATUS FLOW
=============================================================================

  "joined" --> "selecting" --> "ready"
      |             |             |
      |             |             +-- Cards confirmed (final)
      |             +-- Cards delivered, timer running
      +-- Player created, no cards yet

=============================================================================
NEW SOCKET EVENTS
=============================================================================

| Event           | Direction | Purpose                          |
|-----------------|-----------|----------------------------------|
| player:join     | C -> S    | Create player record only        |
| player:joined   | S -> C    | Confirm player created           |
| cards:request   | C -> S    | Request cards, start timer       |
| cards:delivered | S -> C    | Cards ready for selection        |

=============================================================================
TESTING NOTES
=============================================================================
- Start a FRESH ROUND for testing (old data may be inconsistent)
- Player count should remain 1 throughout join -> card-selection -> game
- Timer should start when cards are delivered, not when joining
- Reconnecting player should get same playerId (upsert protection)

=============================================================================
RELATED DOCUMENTATION
=============================================================================
- Plan details: docs/plans/008-socket-architecture-refactor.md
- Architecture: CLAUDE.md

=============================================================================
