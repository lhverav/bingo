=============================================================================
COMMIT: Playing Flow 2 - Bug Fixes
Date: 2026-03-02
=============================================================================

SUMMARY
-------
Bug fixes found during testing of the BINGO game flow.

=============================================================================
BUG FIXES
=============================================================================

1. GAME STATUS NOT CHANGING TO "PLAYING"
   File: apps/mobile-player/client/app/game.tsx

   Problem:
   - gameStatus started as "waiting" and never changed to "playing"
   - "game:started" event was never emitted from server
   - BINGO button was hidden (required gameStatus === "playing")
   - Cards were disabled (required gameStatus === "playing")

   Fix:
   - Set gameStatus to "playing" when first ball:announced is received
   - Now cards enable and BINGO button appears after first number drawn

2. PATTERN VERIFICATION MISMATCHES
   File: packages/game-core/src/services/patternService.ts

   Problem:
   - Visualization showed one pattern, but validation checked different logic
   - linea: UI showed middle row, but code accepted ANY row
   - columna: UI showed middle column, but code accepted ANY column
   - diagonal: UI showed BOTH diagonals, but code accepted EITHER one
   - figura_especial: UI showed X shape, but code checked ALL cells

   Fix:
   - linea: Now only checks middle row
   - columna: Now only checks middle column
   - diagonal: Now requires BOTH diagonals complete
   - figura_especial: Now checks X shape (both diagonals)

3. WINNER OVERLAY BUTTON NOT CLICKABLE
   File: apps/mobile-player/client/app/game.tsx

   Problem:
   - "Volver al inicio" button rendered behind winner overlay
   - Button was not clickable due to overlay z-index

   Fix:
   - Moved button INSIDE the winner overlay component
   - Button now appears below "Ganaste!!" text and is clickable

4. JOIN ROUND REQUIRES MULTIPLE CLICKS
   File: apps/mobile-player/client/app/join-round.tsx

   Problem:
   - On subsequent rounds, join button needed multiple clicks
   - Socket already connected, so connect() returned early
   - No state change triggered, useEffect didn't re-run
   - player:join was never emitted

   Fix:
   - Use socket.connected instead of isConnected state
   - Use ref to prevent duplicate join attempts
   - Call clearGame() before joining new round

5. "PLAYER ALREADY SELECTED CARDS" ERROR ON NEW ROUND
   File: apps/mobile-player/client/app/join-round.tsx

   Problem:
   - Joining NEW round showed error about cards already selected
   - Old game state from previous round was not cleared
   - Reconnecting players sent to card-selection even if status "ready"

   Fix:
   - Call clearGame() at start of join-round screen
   - Check player status on join response
   - If status "ready", navigate to game screen (not card-selection)

6. PATTERN NOT UPDATING ON NEW ROUNDS
   Files:
   - apps/mobile-player/server/src/events/roundEvents.ts
   - apps/mobile-player/client/app/join-round.tsx

   Problem:
   - When joining a new round with different pattern, old pattern displayed
   - Server never sent pattern in player:joined response
   - Client never called setRoundPattern with new pattern

   Fix:
   - Server now includes roundPattern in player:joined response
   - Client reads roundPattern and calls setRoundPattern()

7. JOIN ROUND TIMING ISSUES (ADDITIONAL FIX)
   File: apps/mobile-player/client/app/join-round.tsx

   Problem:
   - Even with previous fixes, join sometimes needed multiple attempts
   - Race condition between socket connection state and useEffect execution

   Fix:
   - Added 500ms fallback timer to retry join if not attempted
   - Ensures join happens even if initial check missed connection

8. EVENT LISTENER ACCUMULATION (CRITICAL BUG)
   Files:
   - apps/mobile-player/client/contexts/SocketContext.tsx
   - apps/mobile-player/client/app/join-round.tsx
   - apps/mobile-player/client/app/card-selection.tsx
   - apps/mobile-player/client/app/game.tsx
   - apps/mobile-player/server/src/events/roundEvents.ts

   Problem:
   - Each round required N clicks (where N = round number)
   - Round 2 needed 2 clicks, Round 3 needed 3 clicks, etc.
   - Socket event listeners accumulated across rounds
   - socket.off(event, handler) failed because React re-created handler functions
   - Server: sockets joined rooms but never left them
   - Socket reuse kept all accumulated listeners

   Root Cause (Client):
   - Same socket was reused across rounds
   - React creates NEW function references on each render
   - socket.off("event", newHandler) doesn't remove the OLD handler
   - connect() returned early if already connected, keeping stale listeners

   Root Cause (Server):
   - socket.join(`round:${roundId}`) added rooms but never removed old ones
   - Socket properties (playerId, roundId) kept old values

   Fix (Client - Most Important):
   - Added `reconnect()` function to SocketContext
   - reconnect() creates FRESH socket (removeAllListeners + disconnect + new socket)
   - join-round.tsx now uses reconnect() instead of connect()
   - Each round starts with a completely clean socket
   - Use removeAllListeners() for screen-specific events

   Fix (Server):
   - Clear socket properties BEFORE joining new round
   - Leave previous room when joining new round
   - Add player:leave event for explicit room cleanup
   - Clean socket properties on disconnect

=============================================================================
MODIFIED FILES
=============================================================================

apps/mobile-player/client/contexts/SocketContext.tsx
  - Added reconnect() function for fresh socket connection
  - reconnect() removes all listeners, disconnects, and creates new socket
  - This ensures each round starts with clean state

apps/mobile-player/client/app/game.tsx
  - Set gameStatus = "playing" in handleBallAnnounced
  - Moved "Volver al inicio" button inside winner overlay
  - Use removeAllListeners() for game-specific events
  - Use socket.emit("player:leave") when going home

apps/mobile-player/client/app/join-round.tsx
  - Use reconnect() instead of connect() for fresh socket each round
  - Use removeAllListeners("player:joined") for cleanup
  - Add joinAttemptedRef to prevent duplicate joins
  - Read roundPattern from response and call setRoundPattern()
  - Add 500ms fallback timer to ensure join happens

apps/mobile-player/client/app/card-selection.tsx
  - Use removeAllListeners() for card-specific events

apps/mobile-player/server/src/events/roundEvents.ts
  - Clear socket properties (playerId, roundId, playerCode) BEFORE joining
  - Include roundPattern in player:joined response
  - Leave previous round room when joining new round
  - Added player:leave event for explicit room cleanup

packages/game-core/src/services/patternService.ts
  - checkLine(): Only checks middle row
  - checkColumn(): Only checks middle column
  - checkDiagonal(): Requires BOTH diagonals
  - figura_especial case: Uses checkDiagonal (X shape)

=============================================================================
PENDING (TO BE REMOVED BEFORE COMMIT)
=============================================================================

Debug console.log statements in:
  - packages/game-core/src/services/winnerService.ts
  - apps/mobile-player/client/app/game.tsx
  - apps/mobile-player/server/src/server.ts

=============================================================================
TESTING NOTES
=============================================================================

1. Restart both servers (web-host and mobile-player server)

2. **CRITICAL TEST - Event Listener Accumulation:**
   - Create 3+ rounds in sequence
   - Join round 1, play, go home
   - Join round 2 - should work on FIRST click (not 2 clicks)
   - Join round 3 - should work on FIRST click (not 3 clicks)
   - Cards should arrive quickly (not hang or timeout)
   - No messy behavior or delays

3. Test multiple rounds in sequence:
   - Join round 1 (e.g., with "linea" pattern), play, win/lose, go home
   - Join round 2 (e.g., with "columna" pattern) - should work on first click
   - Verify no "already selected cards" error
   - Verify pattern shown matches round 2's pattern (not round 1's)

4. Test pattern verification:
   - linea = middle row only
   - columna = middle column only
   - diagonal = both diagonals (X shape)

5. Test winner flow:
   - "Ganaste!!" overlay appears
   - "Volver al inicio" button is clickable
   - Returns to home screen properly

6. Test pattern updates:
   - Create two rounds with DIFFERENT patterns
   - Join first round, note the pattern shown
   - Finish or exit, go home
   - Join second round, pattern should update to new value

=============================================================================
