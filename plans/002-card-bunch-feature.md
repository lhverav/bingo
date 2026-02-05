# Plan 002 — Card Bunch Feature

**Status:** COMPLETED — All 22 steps done
**Created:** 2026-02-05
**Last Updated:** 2026-02-05

---

## Goal
Allow the host to create "card bunches" — named, pre-generated sets of bingo cards saved to the database. When creating a round, a combobox appears (only after cardSize + maxNumber are filled in) showing matching card bunches by name. The selected bunch is referenced by the round via `cardBunchId`.

---

## Steps

Each step is a single file. See `plans/RULES.md` for the approval flow and general rules.

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `packages/domain/src/entities/cardBunch.ts` | CREATE | Defines the pure domain shape of a CardBunch (name, cardSize, maxNumber, cards grid). This is the contract every other layer works against — schema, mapper, repo, and service all derive from this. | [x] Completed | 2026-02-05 |
| 2 | `packages/domain/src/entities/index.ts` | EDIT | Re-exports CardBunch so it's available via `@bingo/domain`. Without this, no other package can import the entity. | [x] Completed | 2026-02-05 |
| 3 | `packages/domain/src/entities/round.ts` | EDIT | Adds optional `cardBunchId` to Round, CreateRoundData, and UpdateRoundData. This is what links a round to its card bunch at the domain level. | [x] Completed | 2026-02-05 |
| 4 | `packages/game-core/src/database/schemas/cardBunch.schema.ts` | CREATE | Mongoose schema that defines how CardBunch is stored in MongoDB. Uses the same patterns as round.schema.ts (flat minNumber/maxNumber, mongoose import from connection, safe model registration). | [x] Completed | 2026-02-05 |
| 5 | `packages/game-core/src/database/schemas/round.schema.ts` | EDIT | Adds `cardBunchId` field (ObjectId ref to CardBunch) to the Round schema and its Document interface. This persists the link between a round and its bunch. | [x] Completed | 2026-02-05 |
| 6 | `packages/game-core/src/database/schemas/index.ts` | EDIT | Barrel export for the new CardBunch schema and document type. Required so repositories can import it cleanly. | [x] Completed | 2026-02-05 |
| 7 | `packages/game-core/src/database/mappers/cardBunch.mapper.ts` | CREATE | Converts CardBunch documents ↔ domain entities. Handles the _id → id translation, same pattern as RoundMapper. | [x] Completed | 2026-02-05 |
| 8 | `packages/game-core/src/database/mappers/round.mapper.ts` | EDIT | Adds cardBunchId handling in toDomain (`.toString()`), toDatabase, and toUpdateDatabase. Keeps the round mapper in sync with the schema change from step 5. | [x] Completed | 2026-02-05 |
| 9 | `packages/game-core/src/database/mappers/index.ts` | EDIT | Barrel export for CardBunchMapper. | [x] Completed | 2026-02-05 |
| 10 | `packages/game-core/src/repositories/cardBunch.repository.ts` | CREATE | Data access for CardBunch: findById, findAll, findByDimensions (the key query — filters by cardSize + maxNumber), create, delete. Each method calls connectToDatabase() first, follows RoundRepository exactly. | [x] Completed | 2026-02-05 |
| 11 | `packages/game-core/src/repositories/index.ts` | EDIT | Barrel export for the new cardBunchRepository singleton. | [x] Completed | 2026-02-05 |
| 12 | `packages/game-core/src/services/cardBunchService.ts` | CREATE | Business logic + card generation. Contains `generateCards()` (pure function: given cardSize, maxNumber, count → produces N card grids with free center for odd sizes) and the CRUD functions that call the repository. This is the main public API for card bunches. | [x] Completed | 2026-02-05 |
| 13 | `packages/game-core/src/services/roundService.ts` | EDIT | Adds `cardBunchId` to CreateRoundInput and UpdateRoundInput interfaces, and passes it through in createRound() and updateRound(). Connects the round service to the bunch reference. | [x] Completed | 2026-02-05 |
| 14 | `packages/game-core/src/services/index.ts` | EDIT | Barrel export for cardBunch service functions and types. | [x] Completed | 2026-02-05 |
| 15 | `packages/game-core/src/index.ts` | EDIT | Adds cardBunchRepository to the public API exports. Apps can now import card bunch functions from `@bingo/game-core`. | [x] Completed | 2026-02-05 |
| 16 | `apps/web-host/src/lib/actions/cardBunches.ts` | CREATE | Server actions for card bunch CRUD (create, delete) and a getter that fetches all bunches — used by the round creation page to populate the combobox. | [x] Completed | 2026-02-05 |
| 17 | `apps/web-host/src/app/host/cartas/crear/page.tsx` | CREATE | The form page where the host enters bunch name, card size, number range, and how many cards to generate. Submits to createCardBunchAction. | [x] Completed | 2026-02-05 |
| 18 | `apps/web-host/src/app/host/cartas/page.tsx` | CREATE | Lists all existing card bunches with name, dimensions, card count, and a delete button. This is the management view for bunches. | [x] Completed | 2026-02-05 |
| 19 | `apps/web-host/src/app/host/rondas/crear/CardBunchSelector.tsx` | CREATE | Client component (`"use client"`). Receives all bunches as props, listens to cardSize and maxNumber changes on the form, filters bunches that match, and renders a combobox. Hidden until both fields have values. | [x] Completed | 2026-02-05 |
| 20 | `apps/web-host/src/app/host/rondas/crear/page.tsx` | EDIT | Fetches all card bunches server-side and passes them to CardBunchSelector. Integrates the combobox into the existing round creation form. | [x] Completed | 2026-02-05 |
| 21 | `apps/web-host/src/lib/actions/rounds.ts` | EDIT | Extracts the optional `cardBunchId` from the form submission and passes it to `createRound()`. This is what actually saves the bunch reference on the round. | [x] Completed | 2026-02-05 |
| 22 | Build + verify | — | Run `pnpm build` and test the full flow end to end. | [x] Completed | 2026-02-05 |

**Extra:** Added navigation menu to `/host` page for accessing card bunch management.

---

## Design Notes

### Card generation algorithm (step 12)
- Input: `cardSize`, `maxNumber` (numbers are always 1 to maxNumber), `count`
- For each card: pick `cardSize * cardSize` unique random numbers from [1, maxNumber], shuffle, lay out row by row
- If `cardSize` is odd: center cell = free space, stored as `0` in DB
- Output: `number[][][]` — array of cards, each card a 2D grid

### Free center convention
- `0` in the database = free space
- When displayed on the card: shows "FREE"

### Combobox filtering (step 19)
- CardBunchSelector is a `"use client"` component
- It receives ALL bunches as a prop from the server component
- It attaches `change` listeners to the `cardSize` select and `maxNumber` input inside the same `<form>`
- Filters: `bunch.cardSize === cardSize && bunch.maxNumber === maxNumber`
- The combobox (`<select name="cardBunchId">`) is hidden until both values are set

### Patterns to follow (all from existing code)
- Domain: pure interfaces, `id: string`
- **CardBunch uses `maxNumber: number`** (not `numberRange`) — numbers always start at 1, matches the UI
- Schema: flat fields, `import { mongoose } from '../connection'`, `mongoose.models.X || mongoose.model(...)`
- Mapper: `toDomain()` / `toDatabase()` / `toUpdateDatabase()` static methods
- Repository: class + singleton export, every method starts with `await connectToDatabase()`
- Service: plain exported async functions, imports repository singleton
- Barrel exports: runtime values in `export { }`, types in `export type { }`

---

## Verification Checklist (step 22)
- [ ] `pnpm build` passes with zero errors
- [ ] `/host/cartas/crear` — fill form, submit → bunch saved in DB
- [ ] `/host/cartas` — bunch appears in list, delete works
- [ ] `/host/rondas/crear` — fill cardSize + maxNumber matching a bunch → combobox appears
- [ ] Select bunch, create round → round in DB has `cardBunchId`
