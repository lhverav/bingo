=============================================================================
COMMIT: Game Flow Improvements - Payment at Game Level + On-the-fly Rounds
Date: 2026-03-30
=============================================================================

SUMMARY
-------
Major refactoring to move payment configuration from Round level to Game level,
enable on-the-fly round creation, and fix mobile navigation bugs.

=============================================================================
FEATURE 1: PAYMENT MOVED FROM ROUND TO GAME LEVEL
=============================================================================

Previously: Each round had its own payment settings (isPaid, pricePerCard, currency)
Now: Payment is configured once at the Game level. Players pay once per game.

RATIONALE:
- Players pay once to participate in a game (not per round)
- Players can change cards between rounds (always free)
- Simpler UX for hosts when creating games

DOMAIN CHANGES:
---------------
packages/domain/src/entities/game.ts
  + Added: isPaid, pricePerCard, currency fields
  + Added: CreateGameData, UpdateGameData interfaces with payment fields

packages/domain/src/entities/round.ts
  - Removed: isPaid, pricePerCard, currency fields
  - Removed: payment-related interfaces

packages/domain/src/entities/gamePlayer.ts
  - Simplified card tracking structure
  - Removed: cardsPerPlayer (redundant with GeneralParameters)

SCHEMA CHANGES:
---------------
packages/game-core/src/database/schemas/game.schema.ts
  + Added: isPaid (Boolean, default: false)
  + Added: pricePerCard (Number, optional)
  + Added: currency (String enum: COP/USD, optional)

packages/game-core/src/database/schemas/round.schema.ts
  - Removed: isPaid, pricePerCard, currency fields

packages/game-core/src/database/schemas/gamePlayer.schema.ts
  - Restructured for new game-level payment flow

MAPPER CHANGES:
---------------
packages/game-core/src/database/mappers/game.mapper.ts
  + Added: isPaid, pricePerCard, currency mapping

packages/game-core/src/database/mappers/round.mapper.ts
  - Removed: payment field mapping

packages/game-core/src/database/mappers/gamePlayer.mapper.ts
  - Updated for simplified structure

SERVICE CHANGES:
----------------
packages/game-core/src/services/gameService.ts
  + Added: Payment validation in createGame()
  + Added: Payment validation in updateGame()
  + Rule: Paid games must have price and currency
  + Rule: Free games should not have price

HOST UI CHANGES:
----------------
apps/web-host/src/app/host/juegos/crear/page.tsx
  + Added: Payment toggle and fields

apps/web-host/src/app/host/juegos/crear/PaymentFields.tsx (NEW FILE)
  + Client component for payment toggle (isPaid checkbox)
  + Shows/hides price and currency fields based on toggle

apps/web-host/src/app/host/juegos/editar/[id]/page.tsx
  + Added: Payment fields for editing

apps/web-host/src/app/host/juegos/[id]/page.tsx
  + Display: Shows payment info at game level (Pago/Gratis badge)
  - Removed: Payment badges from round rows

apps/web-host/src/app/host/juegos/[id]/rondas/crear/page.tsx
  - Removed: Payment fields (now at game level)

apps/web-host/src/app/host/juegos/[id]/rondas/editar/[roundId]/page.tsx
  - Removed: Payment fields

apps/web-host/src/lib/actions/games.ts
  + Added: Payment fields handling in create/update actions

apps/web-host/src/lib/actions/gameRounds.ts
  - Removed: Payment fields from round actions

apps/web-host/src/app/globals.css
  + Added: Styles for payment toggle, form improvements

=============================================================================
FEATURE 2: ON-THE-FLY ROUND CREATION
=============================================================================

Previously: Games required at least one round before starting
Now: Games can start without rounds, rounds can be added while game is active

RATIONALE:
- Host may want to start the game and create rounds dynamically
- More flexible game management

CHANGES:
--------
packages/game-core/src/services/gameService.ts
  - Removed: Round count validation in startGame()
  - Games can now start with 0 rounds

apps/web-host/src/lib/actions/gameRounds.ts
  - Changed: createGameRoundAction allows game.status === "active"
  - Previously only allowed "scheduled"

apps/web-host/src/app/host/juegos/[id]/page.tsx
  - Changed: "Add Round" button shows for scheduled AND active games

apps/web-host/src/app/host/juegos/[id]/rondas/crear/page.tsx
  - Changed: Page accessible when game is scheduled OR active

apps/mobile-player/server/src/server.ts
  - Cleaned up: ROUND_CREATED notification handler

=============================================================================
FEATURE 3: MOBILE NAVIGATION BUG FIX
=============================================================================

BUG: Pressing back button from game summary showed "Seleccionar cuenta de Google"
     instead of returning to main page.

CAUSE: router.back() navigated to previous item in navigation stack, which
       included auth screens after Google login.

FIX: Replace router.back() with router.replace("/(tabs)") or
     router.replace("/(tabs)/mis-juegos") for explicit navigation.

CHANGES:
--------
apps/mobile-player/client/app/game-detail.tsx
  - Line 38: onLeftGame callback -> router.replace("/(tabs)/mis-juegos")
  - Line 132: Error back button -> router.replace("/(tabs)/mis-juegos")
  - Line 146: Header back arrow -> router.replace("/(tabs)/mis-juegos")

apps/mobile-player/client/app/games.tsx
  - Line 139: Header "Volver" link -> router.replace("/(tabs)")

apps/mobile-player/client/app/join-round.tsx
  - Line 89: Error "Volver" link -> router.replace("/(tabs)")

apps/mobile-player/client/app/game-lobby.tsx
  - Line 87: Error "Volver" link -> router.replace("/(tabs)")

=============================================================================
MODIFIED FILES SUMMARY
=============================================================================

DOMAIN (packages/domain/src/entities/)
  - game.ts (+29 lines)
  - round.ts (-24 lines)
  - gamePlayer.ts (restructured)

SCHEMAS (packages/game-core/src/database/schemas/)
  - game.schema.ts (+27 lines)
  - round.schema.ts (-20 lines)
  - gamePlayer.schema.ts (restructured)

MAPPERS (packages/game-core/src/database/mappers/)
  - game.mapper.ts (+9 lines)
  - round.mapper.ts (-9 lines)
  - gamePlayer.mapper.ts (restructured)

SERVICES (packages/game-core/src/services/)
  - gameService.ts (+40 lines)

HOST UI (apps/web-host/src/)
  - app/host/juegos/crear/page.tsx
  - app/host/juegos/crear/PaymentFields.tsx (NEW)
  - app/host/juegos/editar/[id]/page.tsx
  - app/host/juegos/[id]/page.tsx
  - app/host/juegos/[id]/rondas/crear/page.tsx
  - app/host/juegos/[id]/rondas/editar/[roundId]/page.tsx
  - lib/actions/games.ts
  - lib/actions/gameRounds.ts
  - app/globals.css (+87 lines)

MOBILE (apps/mobile-player/)
  - client/app/game-detail.tsx
  - client/app/games.tsx
  - client/app/join-round.tsx
  - client/app/game-lobby.tsx
  - server/src/server.ts

TOTAL: 336 lines added, 321 lines removed across 23 modified files + 1 new file

=============================================================================
TESTING NOTES
=============================================================================

1. PAYMENT AT GAME LEVEL:
   - Create a new game with "Pago" toggle ON
   - Verify price and currency fields appear
   - Verify game detail shows payment badge
   - Create rounds - they should NOT have payment fields
   - Edit game - payment fields should be editable

2. ON-THE-FLY ROUND CREATION:
   - Create a game with NO rounds
   - Start the game (should work)
   - Add a round while game is active
   - Mobile players should receive ROUND_CREATED notification

3. NAVIGATION FIX:
   - Login with Google
   - Go to "Mis Juegos" tab
   - Open a game detail
   - Press back button
   - Should return to "Mis Juegos" (NOT Google selector screen)

=============================================================================
