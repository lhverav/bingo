# Plan 001 — Architecture Migration to game-core

**Status:** Phases 1–10 completed. Phase 11 (verification) pending.
**Created:** 2026-02-03
**Last Updated:** 2026-02-05

> General rules (approval flow, install policy, one-edit-per-step) live in `plans/RULES.md`.

---

## Goal

Extract business logic and data access from `apps/web-host` into a shared `packages/game-core` library that both `web-host` and `mobile-player/server` can import directly — no REST API roundtrip needed.

---

## Before / After

**Before:**
```
apps/web-host/src/
├── infrastructure/
│   ├── database/
│   │   ├── schemas/         ← moved to game-core
│   │   └── mappers/         ← moved to game-core
│   └── repositories/        ← moved to game-core
└── lib/
    ├── mongodb.ts           ← moved to game-core
    ├── services/            ← moved to game-core
    └── actions/             ← kept here, imports updated
```

**After:**
```
packages/
└── game-core/
    └── src/
        ├── database/
        │   ├── connection.ts
        │   ├── schemas/     (round, user)
        │   └── mappers/     (round, user)
        ├── repositories/    (round, user)
        ├── services/        (round, user)
        └── index.ts         (public API)

apps/web-host/src/lib/actions/   ← imports from @bingo/game-core
apps/mobile-player/server/src/   ← imports from @bingo/game-core
```

---

## Steps

### Phase 1 — Create game-core package structure
Initialize the new shared package so it's a valid pnpm workspace member.

| Step | File | Action | Purpose | Status | Date |
|------|------|--------|---------|--------|------|
| 1.1 | `packages/game-core/package.json` | CREATE | Defines the package name, dependencies (mongoose, @bingo/domain), and scripts. Makes it a valid workspace package. | [x] Completed | 2026-02-03 |
| 1.2 | `packages/game-core/tsconfig.json` | CREATE | TypeScript config so the package compiles and other packages can import it. | [x] Completed | 2026-02-03 |
| 1.3 | `packages/game-core/src/index.ts` | CREATE | Entry point. Starts empty; gets populated as layers are added below. | [x] Completed | 2026-02-03 |

### Phase 2 — Move database connection
Single source of truth for MongoDB connectivity across all apps.

| Step | File | Action | Purpose | Status | Date |
|------|------|--------|---------|--------|------|
| 2.1 | `packages/game-core/src/database/connection.ts` | CREATE | `connectToDatabase()` with connection pooling. Every repository calls this before querying. | [x] Completed | 2026-02-03 |

### Phase 3 — Move schemas
Mongoose document definitions — shared so both apps write to the DB with the same structure.

| Step | File | Action | Purpose | Status | Date |
|------|------|--------|---------|--------|------|
| 3.1 | `packages/game-core/src/database/schemas/user.schema.ts` | CREATE | User document: email, password hash, role. Used by UserRepository. | [x] Completed | 2026-02-03 |
| 3.2 | `packages/game-core/src/database/schemas/round.schema.ts` | CREATE | Round document: name, cardSize, numberRange, gamePattern, status, drawnNumbers. Used by RoundRepository. | [x] Completed | 2026-02-03 |
| 3.3 | `packages/game-core/src/database/schemas/index.ts` | CREATE | Barrel export so repositories import from one place. | [x] Completed | 2026-02-03 |

### Phase 4 — Move mappers
Translate between Mongoose documents (`_id`, flat fields) and pure domain entities (`id`, nested objects).

| Step | File | Action | Purpose | Status | Date |
|------|------|--------|---------|--------|------|
| 4.1 | `packages/game-core/src/database/mappers/user.mapper.ts` | CREATE | UserDocument ↔ User entity conversion. | [x] Completed | 2026-02-03 |
| 4.2 | `packages/game-core/src/database/mappers/round.mapper.ts` | CREATE | RoundDocument ↔ Round entity. Handles `minNumber`/`maxNumber` ↔ `numberRange`. | [x] Completed | 2026-02-03 |
| 4.3 | `packages/game-core/src/database/mappers/index.ts` | CREATE | Barrel export for mappers. | [x] Completed | 2026-02-03 |

### Phase 5 — Move repositories
Data Access Layer. Services never touch Mongoose directly — they go through these.

| Step | File | Action | Purpose | Status | Date |
|------|------|--------|---------|--------|------|
| 5.1 | `packages/game-core/src/repositories/user.repository.ts` | CREATE | User CRUD: findById, findByEmail, create. Returns domain entities via mapper. | [x] Completed | 2026-02-03 |
| 5.2 | `packages/game-core/src/repositories/round.repository.ts` | CREATE | Round CRUD + updateStatus + addDrawnNumber. Core data access for game management. | [x] Completed | 2026-02-03 |
| 5.3 | `packages/game-core/src/repositories/index.ts` | CREATE | Barrel export + singleton instances (`userRepository`, `roundRepository`). | [x] Completed | 2026-02-03 |

### Phase 6 — Move services
Business Logic Layer. Validation rules and orchestration sit here, not in repos or actions.

| Step | File | Action | Purpose | Status | Date |
|------|------|--------|---------|--------|------|
| 6.1 | `packages/game-core/src/services/userService.ts` | CREATE | Login logic: find by email, validate password. | [x] Completed | 2026-02-03 |
| 6.2 | `packages/game-core/src/services/roundService.ts` | CREATE | Round lifecycle: create, update, delete, start, draw, end. Enforces rules like "can't draw same number twice". | [x] Completed | 2026-02-03 |
| 6.3 | `packages/game-core/src/services/index.ts` | CREATE | Barrel export for all service functions. | [x] Completed | 2026-02-03 |

### Phase 7 — Wire up public API
What apps actually see when they `import from '@bingo/game-core'`.

| Step | File | Action | Purpose | Status | Date |
|------|------|--------|---------|--------|------|
| 7.1 | `packages/game-core/src/index.ts` | UPDATE | Re-exports services and repositories as the public surface. | [x] Completed | 2026-02-03 |

### Phase 8 — Point web-host at game-core
web-host stops using its own local services; imports from the shared package instead.

| Step | File | Action | Purpose | Status | Date |
|------|------|--------|---------|--------|------|
| 8.1 | `apps/web-host/package.json` | UPDATE | Add `@bingo/game-core: workspace:*` dependency. | [x] Completed | 2026-02-03 |
| 8.2 | `apps/web-host/src/lib/actions/auth.ts` | UPDATE | Import user functions from `@bingo/game-core`. | [x] Completed | 2026-02-03 |
| 8.3 | `apps/web-host/src/lib/actions/rounds.ts` | UPDATE | Import round functions from `@bingo/game-core`. | [x] Completed | 2026-02-03 |

### Phase 9 — Point mobile-player/server at game-core
The main goal: mobile server now shares the same business logic as web-host.

| Step | File | Action | Purpose | Status | Date |
|------|------|--------|---------|--------|------|
| 9.1 | `apps/mobile-player/server/package.json` | UPDATE | Add `@bingo/game-core` and `@bingo/domain` dependencies. | [x] Completed | 2026-02-03 |
| 9.2 | `apps/mobile-player/server/src/server.ts` | UPDATE | Use game-core imports for any database operations. | [x] Completed | 2026-02-03 |

### Phase 10 — Delete old files from web-host
Remove everything that was moved. Prevents duplicate code and import confusion.

| Step | File | Action | Purpose | Status | Date |
|------|------|--------|---------|--------|------|
| 10.1 | `apps/web-host/src/lib/mongodb.ts` | DELETE | Connection now lives in game-core. | [x] Completed | 2026-02-04 |
| 10.2 | `apps/web-host/src/lib/services/roundService.ts` | DELETE | Moved to game-core. | [x] Completed | 2026-02-04 |
| 10.3 | `apps/web-host/src/lib/services/userService.ts` | DELETE | Moved to game-core. | [x] Completed | 2026-02-04 |
| 10.4 | `apps/web-host/src/infrastructure/database/schemas/` | DELETE | Moved to game-core. | [x] Completed | 2026-02-04 |
| 10.5 | `apps/web-host/src/infrastructure/database/mappers/` | DELETE | Moved to game-core. | [x] Completed | 2026-02-04 |
| 10.6 | `apps/web-host/src/infrastructure/repositories/` | DELETE | Moved to game-core. | [x] Completed | 2026-02-04 |
| 10.7 | `apps/web-host/src/infrastructure/` | DELETE | Entire folder now empty after above deletions. | [x] Completed | 2026-02-04 |

> **Extra work done outside the original plan:** 6 additional files in `apps/web-host/src/app/` still had imports pointing to `@/lib/services/roundService`. These were updated to `@bingo/game-core` before Phase 10 deletions could proceed.

### Phase 11 — Verification
These steps are commands the user runs manually (see RULES.md rule 1).

| Step | Action | Purpose | Status |
|------|--------|---------|--------|
| 11.1 | Run `pnpm install` from repo root | Re-link workspace so `@bingo/game-core` is resolved | [ ] Pending |
| 11.2 | Run `pnpm build` | Catch any TypeScript or import errors across all packages | [ ] Pending |
| 11.3 | Test web-host: create a round | Confirm the create-round form works end to end | [ ] Pending |
| 11.4 | Test web-host: start a round + draw numbers | Confirm game flow still works | [ ] Pending |
| 11.5 | Test mobile-server: starts without errors | Confirm it can import from game-core | [ ] Pending |

---

## Progress Summary

- **Phases 1–10:** All completed (29 steps + 6 extra import fixes)
- **Phase 11:** 5 verification steps pending — these are manual checks by the user
- **Next step:** 11.1 — run `pnpm install`

---

## Rollback

If something goes wrong at any point:
```bash
git status          # see what changed
git restore .       # discard all modifications
git clean -fd       # remove untracked files
```
Then reset the relevant step checkboxes in this file.
