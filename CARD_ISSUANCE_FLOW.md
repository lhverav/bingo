# Card Issuance Flow

> **Status**: ✅ Defined - Ready for implementation

This document describes the flow for issuing cards to players in the Bingo app.

## Overview

Cards are issued at the **Game level**, not the Round level. Players select their cards once when joining a game, and can optionally change them between rounds.

## General Parameters (Web Host)

The following parameters from `GeneralParameters` control card issuance for **free games**:

| Parameter | Description |
|-----------|-------------|
| `selectionTimeSeconds` | Time limit for player to select cards (default: 60s) |
| `freeCardsDelivered` | Number of cards delivered to player for selection |
| `freeCardsToSelect` | Maximum cards player can select from delivered cards |

## Mobile UI Structure

### Game List Screen
- Shows **all games** (upcoming/scheduled)
- Each game card shows indicator if player is already joined
- Player can be joined to **multiple games** simultaneously

### Game Detail View
- Shows game info (name, date, rounds, etc.)
- **"Mis Cartones" button** - above the join/leave button
  - Disabled if player has not joined
  - Enabled after joining
- **"Unirse" / "Desinscribirse" button** - join or leave game

### Leave Game ("Desinscribirse")
- **Free games**: Player can leave at any moment
- When leaving: selected cards are released back to the pool
- _Paid games: TBD_

---

## Flow: Free Games

### 1. Player Joins Game
1. Player sees list of upcoming games
2. Player taps "Unirse" (Join) on a game
3. Player is registered as `GamePlayer`
4. **Immediately** navigates to card selection screen

### Card Selection Screen (same as round-centric approach)
```
┌─────────────────────────────────┐
│  Selecciona tus cartones        │
│  Tiempo restante: 0:45          │
│  Seleccionados: 2/3             │
├─────────────────────────────────┤
│                                 │
│   [Confirmar Selección]         │
│                                 │
├─────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│ │Card1│ │Card2│ │Card3│ │Card4││
│ │  ✓  │ │  ✓  │ │     │ │     ││
│ └─────┘ └─────┘ └─────┘ └─────┘│
│         (horizontal scroll)     │
└─────────────────────────────────┘
```
- Timer countdown at top
- Selection counter (e.g., "2/3")
- "Confirmar Selección" button (disabled until at least 1 card selected)
- Cards displayed at bottom (horizontal scroll)
- Tap card to select/deselect (shows checkmark)
- **Minimum**: 1 card | **Maximum**: `freeCardsToSelect`

### After Card Selection
1. Player taps "Confirmar Selección"
2. **Confirmation screen** appears: simple "Cartones seleccionados" message with OK button
3. Player taps OK → Navigate back to **game list**

---

### 2. "Mis Cartones" - No Cards Yet
When player taps "Mis Cartones" and has **not yet selected cards**:

1. Opens **card selection screen** (same as initial join flow)
2. System delivers `freeCardsDelivered` random cards from the game's `CardBunch`
3. Timer starts with `selectionTimeSeconds` countdown
4. Player must select **at least 1** card, up to `freeCardsToSelect`
5. **On selection**: Cards are confirmed, player status becomes `ready`
6. **On timeout**: System auto-assigns `freeCardsToSelect` cards

### 3. "Mis Cartones" - Cards Already Selected
When player taps "Mis Cartones" and **already has selected cards**:

```
┌─────────────────────────────────┐
│  Mis Cartones                   │
├─────────────────────────────────┤
│                                 │
│   [Cambiar Cartones]            │
│                                 │
├─────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │Card1│ │Card2│ │Card3│        │
│ │     │ │     │ │     │        │
│ └─────┘ └─────┘ └─────┘        │
│         (horizontal scroll)     │
└─────────────────────────────────┘
```
- Shows selected cards at bottom (horizontal scroll)
- "Cambiar Cartones" button above cards
- No timer (view mode only)

### 4. Changing Cards
When player taps "Cambiar Cartones":

1. **Allowed when**: Round is NOT actively playing (before game starts OR between rounds)
2. **Immediately** shows card selection screen with timer (same as initial selection)
3. **New cards**: Completely new random cards are delivered from the CardBunch
4. **Timer restarts**: Player has `selectionTimeSeconds` to select again
5. **Previous cards**: Released back to the pool (available for other players)
6. **If timer expires**: Keep previous cards (change is cancelled)

**During active round**: "Cambiar Cartones" button is **disabled (grayed out)**

---

### 8. When Round Starts (Player Has Cards)
When host starts a round and player has selected cards:

1. Player's screen **automatically changes** to the playing screen
2. No manual navigation needed
3. Player sees their cards and can start marking numbers
4. **Works the same for all rounds** (Round 1, 2, 3... all auto-navigate)

### 9. Player Reopens App During Active Round
If player has cards, closes app, and reopens while a round is active:

1. App detects there's an active round for this player
2. **Automatically navigates** to the playing screen
3. Player can continue marking numbers

### 10. Round Ends
When a round ends (host ends it or winner declared):

1. **Results overlay/modal** appears on playing screen:
   ```
   ┌─────────────────────────────┐
   │      ¡Ronda Terminada!      │
   ├─────────────────────────────┤
   │  Ganador: PLAYER_CODE       │  ← or "Sin ganador"
   │  Patrón: Línea Horizontal   │  ← or multiple winners:
   │  Números cantados: 23       │     "Ganadores: A1B2, C3D4"
   ├─────────────────────────────┤
   │        [Continuar]          │
   └─────────────────────────────┘
   ```
   - **No winner**: Shows "Sin ganador"
   - **Multiple winners**: Shows all winner codes (e.g., "Ganadores: A1B2, C3D4, E5F6")
2. Player taps "Continuar"
3. Navigate to **game detail screen**
4. Player can now:
   - View "Mis Cartones"
   - Change cards (if desired) before next round
   - Wait for next round to start

### 11. Between Rounds
After round ends and before next round:

- Player is on **game detail screen**
- "Cambiar Cartones" button is **enabled**
- Player can change cards or keep current ones
- When host starts next round → auto-navigate to playing screen

### 12. Game Ends (All Rounds Completed)
When the entire game finishes:

1. **Final results screen** appears
   - Shows game summary, winners per round, etc.
2. Player dismisses/acknowledges
3. Navigate to **game list**

### 5. Player Without Cards When Round Starts
If a player joined the game but hasn't selected cards when host starts a round:

- Player is **excluded from that round**
- Player can still select cards and participate in the **next round**
- Player remains in the game as `GamePlayer`

### 6. Cards Across Multiple Rounds
- Player uses the **same cards for all rounds** in a game
- Changing cards between rounds is **optional**
- If player changes cards, new selection applies to all subsequent rounds

### 7. Timer Expiration Behavior

| Scenario | Timer Expires → Result |
|----------|------------------------|
| **First time selection** (no cards yet) | System auto-assigns `freeCardsToSelect` cards (maximum allowed) |
| **Changing cards** (already had cards) | Keep previous cards, cancel the change |

### Connection Lost During Selection
- Timer **continues running** on server
- If player reconnects before timeout: can continue selecting
- If timeout occurs while disconnected: auto-assign rules apply

---

## Playing Screen

- Player sees their cards (same layout as round-centric approach)
- Cards show marked numbers as balls are drawn
- No "Mis Cartones" button needed - cards are already visible
- "Cambiar Cartones" is disabled during active round

---

## Assumptions

### CardBunch Sizing
- CardBunch must have **enough cards** for all expected players
- Formula: `cardsNeeded = maxPlayers × freeCardsDelivered`
- Host is responsible for generating sufficient cards
- If cards run out → error (should not happen with proper planning)

---

## Deferred (Paid Games)

_The following will be defined later for paid games:_
- Payment flow before card selection
- Different parameters (`paidCardsToIssue`, `maxCardsToBuy`)
- Leave game restrictions for paid games

---

## Technical Implementation Notes

### Current Architecture
- `Game.cardBunchId` - Links game to pre-generated card bunch
- `GamePlayer` - Player's registration in a game
- `RoundPlayer` - Player's participation in a specific round
- `GeneralParameters` - Global card delivery settings

### Services Involved
- `gamePlayerService.joinGame()` - Register player in game
- `roundPlayerService.requestCards()` - Deliver cards with timer
- `roundPlayerService.selectCards()` - Confirm card selection
- `roundPlayerService.handleTimeout()` - Auto-assign on timeout

---

## Notes from Discussion

_This section will be updated as we discuss the flow._

