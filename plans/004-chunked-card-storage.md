# Plan 004 — Chunked Card Storage

**Status:** Completed
**Created:** 2026-02-06
**Completed:** 2026-02-06
**Goal:** Fix the 16MB document limit issue by storing cards in a separate collection and saving in chunks to support unlimited card generation.

> General rules (approval flow, install policy, one-edit-per-step) live in `plans/RULES.md`.

---

## Problem Statement

Current implementation stores all cards embedded in one `CardBunch` document:

```typescript
// Current (broken for large batches)
{
  _id: "bunch-123",
  name: "My Cards",
  cards: [
    [[1,2,3,4,5], ...],  // card 1
    [[6,7,8,9,10], ...], // card 2
    ... 100,000 cards embedded here
  ]
}
```

This fails when:
- **BSON serialization** exceeds 16MB (~100,000+ cards)
- **Node.js memory** runs out (~1,000,000+ cards)

Error seen:
```
error: 'The value of "offset" is out of range. It must be >= 0 && <= 17825792'
```

---

## Solution Architecture

### Before (Embedded)

```
CardBunch collection:
┌────────────────────────────────────────┐
│ { _id, name, cards: [100,000 cards] }  │  ← 15MB document, FAILS
└────────────────────────────────────────┘
```

### After (Referenced + Chunked)

```
CardBunch collection:
┌────────────────────────────────────────┐
│ { _id, name, cardSize, maxNumber,      │  ← ~200 bytes
│   cardCount: 100000 }                  │
└────────────────────────────────────────┘
              │
              │ bunchId reference
              ▼
Card collection:
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ { bunchId,       │ │ { bunchId,       │ │ { bunchId,       │
│   index: 0,      │ │   index: 1,      │ │   index: 99999,  │
│   cells: [...] } │ │   cells: [...] } │ │   cells: [...] } │
└──────────────────┘ └──────────────────┘ └──────────────────┘
     ~150 bytes           ~150 bytes           ~150 bytes
```

### Generation Flow (Chunked)

```
for each chunk of 1000 cards:
  1. Generate 1000 cards in memory (~200KB)
  2. Save immediately: CardModel.insertMany(chunk)
  3. Memory freed (garbage collected)
  4. Update progress
  5. Check cancellation
  → Repeat

Memory usage: Always ~200KB (constant)
Can handle: Unlimited cards
```

---

## Implementation Steps

### Step 1 — BunchCard Domain Entity

**File:** `packages/domain/src/entities/bunchCard.ts` (CREATE)

**Purpose:** Define the BunchCard entity interface. This represents a pre-generated bingo card stored in a CardBunch (different from `Card` which is a player's active card in a round). Separating cards into their own entity allows them to be stored individually in the database.

**Status:** [x] Completed

---

### Step 2 — Export BunchCard Entity

**File:** `packages/domain/src/entities/index.ts` (UPDATE)

**Purpose:** Add BunchCard to the barrel export so other packages can import it from `@bingo/domain`.

**Status:** [x] Completed

---

### Step 3 — BunchCard Mongoose Schema

**File:** `packages/game-core/src/database/schemas/bunchCard.schema.ts` (CREATE)

**Purpose:** Define the MongoDB schema for storing individual cards. Includes `bunchId` as a reference to the parent CardBunch, `index` for ordering, and `cells` for the card grid.

**Status:** [x] Completed

---

### Step 4 — Export BunchCard Schema

**File:** `packages/game-core/src/database/schemas/index.ts` (UPDATE)

**Purpose:** Export BunchCardModel from the schemas barrel so repositories can use it.

**Status:** [x] Completed

---

### Step 5 — BunchCard Mapper

**File:** `packages/game-core/src/database/mappers/bunchCard.mapper.ts` (CREATE)

**Purpose:** Convert between MongoDB BunchCardDocument and domain BunchCard entity. Handles `_id` → `id` conversion and ObjectId → string for bunchId.

**Status:** [x] Completed

---

### Step 6 — Export BunchCard Mapper

**File:** `packages/game-core/src/database/mappers/index.ts` (UPDATE)

**Purpose:** Export BunchCardMapper from the mappers barrel.

**Status:** [x] Completed

---

### Step 7 — BunchCard Repository

**File:** `packages/game-core/src/repositories/bunchCard.repository.ts` (CREATE)

**Purpose:** Data access layer for BunchCards. Key method is `insertMany()` which efficiently inserts chunks of cards. Also includes `findByBunchId()` for retrieving cards.

**Status:** [x] Completed

---

### Step 8 — Export BunchCard Repository

**File:** `packages/game-core/src/repositories/index.ts` (UPDATE)

**Purpose:** Export bunchCardRepository singleton from the repositories barrel.

**Status:** [x] Completed

---

### Step 9 — Chunked Generation Service

**File:** `packages/game-core/src/services/cardBunchService.ts` (UPDATE)

**Purpose:** Add `generateAndSaveCardsInChunks()` function that:
- Generates cards in chunks of 1000
- Saves each chunk immediately via `bunchCardRepository.insertMany()`
- Frees memory after each chunk
- Calls progress callback after each chunk
- Checks cancellation between chunks

This replaces the current approach of generating all cards in memory then saving.

**Status:** [x] Completed

---

### Step 10 — Export New Service Function

**File:** `packages/game-core/src/services/index.ts` (UPDATE)

**Purpose:** Export `generateAndSaveCardsInChunks` and `GenerateAndSaveInput` from the services barrel.

**Status:** [x] Completed

---

### Step 11 — Update API Route

**File:** `apps/web-host/src/app/api/card-bunch/create/route.ts` (UPDATE)

**Purpose:** Replace current flow with chunked approach:
- Create CardBunch (metadata only, empty cards array)
- Call `generateAndSaveCardsInChunks()` with bunchId
- Progress updates happen automatically via callbacks

**Status:** [x] Completed

---

### Step 12 — Remove Debug Logs

**Files:** Multiple files (UPDATE)

**Purpose:** Remove all `[DEBUG X]` console.log statements added during troubleshooting:
- `CardBunchFormWithProgress.tsx`
- `cardBunchJobService.ts`
- `create/route.ts`
- `progress/[jobId]/route.ts`

**Status:** [ ] Skipped (keeping logs for now)

---

### Step 13 — Update CardBunch Schema

**File:** `packages/game-core/src/database/schemas/cardBunch.schema.ts` (UPDATE)

**Purpose:** Make `cards` optional (for backwards compatibility), add `cardCount` field. New cards are stored in BunchCard collection.

**Status:** [x] Completed

---

### Step 14 — Update CardBunch Entity

**File:** `packages/domain/src/entities/cardBunch.ts` (UPDATE)

**Purpose:** Add optional `cardCount` field to match new schema.

**Status:** [x] Completed

---

## Verification Steps

After all steps complete:

1. **Small batch (100 cards):**
   - Progress bar appears
   - Cards saved to Card collection
   - CardBunch has cardCount: 100

2. **Medium batch (10,000 cards):**
   - Progress bar updates smoothly
   - Memory stays stable
   - Can cancel mid-generation

3. **Large batch (100,000 cards):**
   - No BSON error
   - Progress continues to 100%
   - Cards queryable by bunchId

4. **Very large batch (1,000,000 cards):**
   - No memory crash
   - Completes in ~2 minutes
   - Memory usage stays constant

---

## Rollback

If something goes wrong:
```bash
git status          # see what changed
git restore .       # discard all modifications
git clean -fd       # remove untracked files
```

Then reset the relevant step checkboxes in this file.
