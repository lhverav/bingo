=============================================================================
COMMIT: BINGO Card Generation Fix + Bug Fixes
Date: 2026-03-01
=============================================================================

SUMMARY
-------
Fixed BINGO card generation algorithm and several bugs discovered during
testing of the socket architecture refactor.

=============================================================================
CHANGES
=============================================================================

1. BINGO CARD GENERATION FIX
   File: packages/game-core/src/services/cardBunchService.ts

   Problem: Cards were generated with random numbers in any position,
            ignoring standard BINGO column rules.

   Fix: New algorithm generates cards column by column:
   | Column | Letter | Range   |
   |--------|--------|---------|
   | 0      | B      | 1-15    |
   | 1      | I      | 16-30   |
   | 2      | N      | 31-45   | (with free center)
   | 3      | G      | 46-60   |
   | 4      | O      | 61-75   |

   Added: BINGO_COLUMNS constant, generateBingoCard(), pickFromRange()

2. FREE SPACE DISPLAY
   File: apps/mobile-player/client/components/BingoCard.tsx

   Problem: Free space showed "0" instead of a visual marker.

   Fix: Free space now displays as star (★) with golden background,
        and is not clickable.

3. CARD SELECTION EVENT HANDLERS FIX
   File: apps/mobile-player/client/app/card-selection.tsx

   Problem: After cards delivered, navigation to game screen didn't work
            because event handlers were unregistered.

   Fix: Split into two useEffects:
        - One for requesting cards (depends on cards.length)
        - One for event handlers (always active)

4. CARD SELECTION VALIDATION FIX
   File: packages/game-core/src/services/roundPlayerService.ts

   Problem: Server required exactly N cards to be selected.

   Fix: Now allows selecting 1 to max cards (not exactly max).

5. STALE DATA HANDLING
   File: packages/game-core/src/services/roundPlayerService.ts

   Problem: Players with stale data (status 'selecting' but no cards/deadline)
            caused errors.

   Fix: Detect stale data and get fresh cards from bunch.

6. PLAYER STATUS FIX
   File: packages/game-core/src/database/mappers/roundPlayer.mapper.ts

   Problem: New players created with status 'selecting' instead of 'joined',
            causing timer to show 00:00 immediately.

   Fix: Changed default status from 'selecting' to 'joined'.

=============================================================================
FILES MODIFIED
=============================================================================

packages/game-core/src/services/cardBunchService.ts
  - Added BINGO column ranges and proper card generation

packages/game-core/src/services/roundPlayerService.ts
  - Fixed card selection validation (1 to max)
  - Added stale data handling

packages/game-core/src/database/mappers/roundPlayer.mapper.ts
  - Fixed default status to 'joined'

apps/mobile-player/client/components/BingoCard.tsx
  - Free space displays as star (★)

apps/mobile-player/client/app/card-selection.tsx
  - Split useEffect to keep event handlers registered

=============================================================================
TESTING NOTES
=============================================================================

- Must create NEW card bunch (old cards have wrong layout)
- Must restart server after these changes
- Old cards in database are NOT affected (keep random layout)

=============================================================================
