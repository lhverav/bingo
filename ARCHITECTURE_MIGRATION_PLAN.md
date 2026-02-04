# Architecture Migration Plan: Shared Game-Core Library

> **IMPORTANT FOR AI ASSISTANT**: When resuming this plan, read this entire document first to understand the current state. Look for `[ ]` (pending) vs `[x]` (completed) checkboxes. Resume from the first unchecked step.

---

## Rules for AI Assistant (MUST FOLLOW)

### 1. Migration Plan Updates - NO APPROVAL NEEDED
- The AI **CAN and MUST** update this `ARCHITECTURE_MIGRATION_PLAN.md` file automatically after each step
- Do NOT ask the user for permission to update this file
- Update the checkboxes, dates, and progress summary immediately after completing each step
- **CONFIGURATION**: File `.claude/settings.local.json` grants automatic write permission to this file

### 2. Terminal Commands - USER TYPES THEM
- The AI must **NOT execute** terminal commands like:
  - `pnpm install`
  - `pnpm build`
  - `pnpm dev`
  - Any npm/pnpm/yarn commands
- Instead, **show the command** to the user and let them type it themselves
- Wait for the user to confirm the command was executed before proceeding

### 3. File/Folder Creation - AI CAN DO AFTER APPROVAL
- The AI **CAN create** files and folders after user approves the content
- The AI **CAN delete** files and folders after user approves
- Always show the exact content before creating

### 4. Approval Flow
```
AI: "Step X.X: I will create [file]. Here's the content: [show content]"
AI: "Do you approve?"
User: "yes"
AI: [Creates the file]
AI: [Updates this migration plan - NO approval needed for this]
AI: "Step X.X completed. Next is Step X.Y..."
```

### 5. Resuming Sessions
- When starting a new session, read this file FIRST
- Find the current step (first `[ ] Pending`)
- Continue from there without re-asking about completed steps

---

## Overview

**Goal**: Extract business logic and data access from `apps/web-host` into a shared `packages/game-core` library that both `web-host` and `mobile-player/server` can import directly (no REST API roundtrip).

**Migration Strategy**: One file at a time, each requiring user approval before proceeding.

---

## Current State (Before Migration)

```
apps/web-host/src/
├── infrastructure/
│   ├── database/
│   │   ├── schemas/
│   │   │   ├── round.schema.ts      ← TO MOVE
│   │   │   ├── user.schema.ts       ← TO MOVE
│   │   │   └── index.ts
│   │   └── mappers/
│   │       ├── round.mapper.ts      ← TO MOVE
│   │       ├── user.mapper.ts       ← TO MOVE
│   │       └── index.ts
│   ├── repositories/
│   │   ├── round.repository.ts      ← TO MOVE
│   │   ├── user.repository.ts       ← TO MOVE
│   │   └── index.ts
│   └── index.ts
├── lib/
│   ├── mongodb.ts                   ← TO MOVE
│   ├── services/
│   │   ├── roundService.ts          ← TO MOVE
│   │   └── userService.ts           ← TO MOVE
│   └── actions/
│       ├── rounds.ts                ← TO UPDATE (imports)
│       └── auth.ts                  ← TO UPDATE (imports)
```

---

## Target State (After Migration)

```
packages/
├── domain/                          # EXISTS - no changes
│   └── src/
│       ├── entities/
│       ├── value-objects/
│       └── events/
│
└── game-core/                       # NEW PACKAGE
    └── src/
        ├── database/
        │   ├── connection.ts        # MongoDB connection
        │   ├── schemas/
        │   │   ├── round.schema.ts
        │   │   ├── user.schema.ts
        │   │   └── index.ts
        │   └── mappers/
        │       ├── round.mapper.ts
        │       ├── user.mapper.ts
        │       └── index.ts
        ├── repositories/
        │   ├── round.repository.ts
        │   ├── user.repository.ts
        │   └── index.ts
        ├── services/
        │   ├── roundService.ts
        │   ├── userService.ts
        │   └── index.ts
        └── index.ts                 # Public API exports

apps/web-host/src/
├── lib/
│   └── actions/
│       ├── rounds.ts                # imports from @bingo/game-core
│       └── auth.ts                  # imports from @bingo/game-core
│   (infrastructure/ folder DELETED)

apps/mobile-player/server/src/
├── routes/                          # imports from @bingo/game-core
└── socket/                          # imports from @bingo/game-core
```

---

## Migration Steps

---

### Phase 1: Create game-core Package Structure

**Purpose**: Initialize the new `@bingo/game-core` package that will contain all shared business logic and data access code. This package will be importable by both `web-host` and `mobile-player/server`.

| Step | File | Action | Purpose | Status | Approved By | Date |
|------|------|--------|---------|--------|-------------|------|
| 1.1 | `packages/game-core/package.json` | CREATE | Define package name (`@bingo/game-core`), dependencies (mongoose, @bingo/domain), and scripts. This makes it a valid npm workspace package. | [x] Completed | User | 2026-02-03 |
| 1.2 | `packages/game-core/tsconfig.json` | CREATE | Configure TypeScript compilation settings. Ensures the package compiles correctly and can be imported by other packages. | [x] Completed | User | 2026-02-03 |
| 1.3 | `packages/game-core/src/index.ts` | CREATE | Entry point for the package. Initially empty, will export all public APIs after other files are created. | [x] Completed | User | 2026-02-03 |

---

### Phase 2: Move Database Connection

**Purpose**: Move the MongoDB connection logic from `web-host` to `game-core`. This allows any app that imports `game-core` to connect to the database without duplicating connection code.

| Step | File | Action | Purpose | Status | Approved By | Date |
|------|------|--------|---------|--------|-------------|------|
| 2.1 | `packages/game-core/src/database/connection.ts` | CREATE | Centralized MongoDB connection. Contains `connectToDatabase()` function that manages connection pooling and reuse. Both web-host and mobile-server will use this same connection logic. | [x] Completed | User | 2026-02-03 |

---

### Phase 3: Move Schemas

**Purpose**: Move Mongoose schema definitions from `web-host` to `game-core`. Schemas define the structure of MongoDB documents (like SQL table definitions). Having them in the shared package ensures both apps use identical data structures.

| Step | File | Action | Purpose | Status | Approved By | Date |
|------|------|--------|---------|--------|-------------|------|
| 3.1 | `packages/game-core/src/database/schemas/user.schema.ts` | CREATE | Defines the User document structure in MongoDB: email, password hash, role, timestamps. Used by UserRepository to interact with the `users` collection. | [x] Completed | User | 2026-02-03 |
| 3.2 | `packages/game-core/src/database/schemas/round.schema.ts` | CREATE | Defines the Round document structure: name, cardSize, numberRange, gamePattern, status, drawnNumbers, etc. Used by RoundRepository for the `rounds` collection. | [x] Completed | User | 2026-02-03 |
| 3.3 | `packages/game-core/src/database/schemas/index.ts` | CREATE | Barrel export file. Re-exports all schemas from a single location for cleaner imports: `import { UserModel, RoundModel } from './schemas'` | [x] Completed | User | 2026-02-03 |

---

### Phase 4: Move Mappers

**Purpose**: Move mapper classes from `web-host` to `game-core`. Mappers convert between MongoDB documents (with `_id`, Mongoose types) and domain entities (with `id` as string, pure TypeScript). This keeps the domain layer clean from database concerns.

| Step | File | Action | Purpose | Status | Approved By | Date |
|------|------|--------|---------|--------|-------------|------|
| 4.1 | `packages/game-core/src/database/mappers/user.mapper.ts` | CREATE | Converts UserDocument ↔ User entity. `toDomain()`: MongoDB doc → pure User object. `toDatabase()`: User data → MongoDB format. | [x] Completed | User | 2026-02-03 |
| 4.2 | `packages/game-core/src/database/mappers/round.mapper.ts` | CREATE | Converts RoundDocument ↔ Round entity. Handles the `numberRange` object, `drawnNumbers` array, and status conversions. | [x] Completed | User | 2026-02-03 |
| 4.3 | `packages/game-core/src/database/mappers/index.ts` | CREATE | Barrel export file for all mappers. | [x] Completed | User | 2026-02-03 |

---

### Phase 5: Move Repositories

**Purpose**: Move repository classes from `web-host` to `game-core`. Repositories abstract all database operations (CRUD). Services call repositories instead of Mongoose directly. This is the "Data Access Layer" in Clean Architecture.

| Step | File | Action | Purpose | Status | Approved By | Date |
|------|------|--------|---------|--------|-------------|------|
| 5.1 | `packages/game-core/src/repositories/user.repository.ts` | CREATE | Handles all User database operations: `findById()`, `findByEmail()`, `create()`. Uses UserMapper to return domain entities, not Mongoose documents. | [x] Completed | User | 2026-02-03 |
| 5.2 | `packages/game-core/src/repositories/round.repository.ts` | CREATE | Handles all Round database operations: `findById()`, `findByUserId()`, `create()`, `update()`, `updateStatus()`, `addDrawnNumber()`, `delete()`. Core data access for game management. | [x] Completed | User | 2026-02-03 |
| 5.3 | `packages/game-core/src/repositories/index.ts` | CREATE | Barrel export + singleton instances. Exports `userRepository` and `roundRepository` ready-to-use instances. | [x] Completed | User | 2026-02-03 |

---

### Phase 6: Move Services

**Purpose**: Move service functions from `web-host` to `game-core`. Services contain **business logic** and **validation rules**. They orchestrate repositories and enforce rules like "can only edit rounds that haven't started". This is the "Business Logic Layer".

| Step | File | Action | Purpose | Status | Approved By | Date |
|------|------|--------|---------|--------|-------------|------|
| 6.1 | `packages/game-core/src/services/userService.ts` | CREATE | User business logic: `findUserByEmail()`, `validatePassword()`. Used by auth actions to verify login credentials. | [x] Completed | User | 2026-02-03 |
| 6.2 | `packages/game-core/src/services/roundService.ts` | CREATE | Round business logic: `createRound()`, `updateRound()`, `deleteRound()`, `startRound()`, `drawNumber()`, `endRound()`. Contains rules like "number must be in range", "can't draw same number twice", "can only start rounds in 'configurada' status". | [x] Completed | User | 2026-02-03 |
| 6.3 | `packages/game-core/src/services/index.ts` | CREATE | Barrel export for all services. | [x] Completed | User | 2026-02-03 |

---

### Phase 7: Update game-core Public API

**Purpose**: Configure what `game-core` exports publicly. When apps do `import { createRound } from '@bingo/game-core'`, this file determines what's available. Only exports what external apps need; internal details stay hidden.

| Step | File | Action | Purpose | Status | Approved By | Date |
|------|------|--------|---------|--------|-------------|------|
| 7.1 | `packages/game-core/src/index.ts` | UPDATE | Add exports for all services (the main public API). Apps import business functions directly: `import { createRound, drawNumber, startRound } from '@bingo/game-core'`. | [x] Completed | User | 2026-02-03 |

---

### Phase 8: Update web-host to Use game-core

**Purpose**: Change `web-host` to import from `@bingo/game-core` instead of its local files. After this phase, `web-host` no longer has its own services/repositories—it uses the shared package.

| Step | File | Action | Purpose | Status | Approved By | Date |
|------|------|--------|---------|--------|-------------|------|
| 8.1 | `apps/web-host/package.json` | UPDATE | Add `"@bingo/game-core": "workspace:*"` to dependencies. This tells pnpm that web-host depends on the local game-core package. | [x] Completed | User | 2026-02-03 |
| 8.2 | `apps/web-host/src/lib/actions/auth.ts` | UPDATE | Change imports from `@/lib/services/userService` to `@bingo/game-core`. The auth action now uses the shared user service. | [x] Completed | User | 2026-02-03 |
| 8.3 | `apps/web-host/src/lib/actions/rounds.ts` | UPDATE | Change imports from `@/lib/services/roundService` to `@bingo/game-core`. All round operations now use the shared round service. | [x] Completed | User | 2026-02-03 |

---

### Phase 9: Update mobile-player/server to Use game-core

**Purpose**: Configure `mobile-player/server` to also use `@bingo/game-core`. This is the main goal—both apps now share the exact same business logic and data access code.

| Step | File | Action | Purpose | Status | Approved By | Date |
|------|------|--------|---------|--------|-------------|------|
| 9.1 | `apps/mobile-player/server/package.json` | UPDATE | Add `"@bingo/game-core": "workspace:*"` to dependencies. Mobile server can now import shared services. | [x] Completed | User | 2026-02-03 |
| 9.2 | `apps/mobile-player/server/src/server.ts` | UPDATE | Update to use game-core if there are any direct database calls. May add example route using shared service. | [x] Completed | User | 2026-02-03 |

---

### Phase 10: Cleanup - Remove Old Files from web-host

**Purpose**: Delete the original files from `web-host` that are now in `game-core`. This prevents confusion and ensures no duplicate code. After cleanup, `web-host` only has: pages, actions, and session management.

| Step | File | Action | Purpose | Status | Approved By | Date |
|------|------|--------|---------|--------|-------------|------|
| 10.1 | `apps/web-host/src/lib/mongodb.ts` | DELETE | No longer needed—connection is now in `game-core/database/connection.ts` | [x] Completed | User | 2026-02-04 |
| 10.2 | `apps/web-host/src/lib/services/roundService.ts` | DELETE | No longer needed—now in `game-core/services/roundService.ts` | [x] Completed | User | 2026-02-04 |
| 10.3 | `apps/web-host/src/lib/services/userService.ts` | DELETE | No longer needed—now in `game-core/services/userService.ts` | [x] Completed | User | 2026-02-04 |
| 10.4 | `apps/web-host/src/infrastructure/database/schemas/` | DELETE folder | No longer needed—schemas now in `game-core/database/schemas/` | [x] Completed | User | 2026-02-04 |
| 10.5 | `apps/web-host/src/infrastructure/database/mappers/` | DELETE folder | No longer needed—mappers now in `game-core/database/mappers/` | [x] Completed | User | 2026-02-04 |
| 10.6 | `apps/web-host/src/infrastructure/repositories/` | DELETE folder | No longer needed—repositories now in `game-core/repositories/` | [x] Completed | User | 2026-02-04 |
| 10.7 | `apps/web-host/src/infrastructure/` | DELETE folder | Entire infrastructure folder no longer needed in web-host | [x] Completed | User | 2026-02-04 |

---

### Phase 11: Verification (USER EXECUTES COMMANDS)

**Purpose**: Verify everything works correctly after migration. Install dependencies to link the new package, build to check for TypeScript errors, and test the application functionality.

| Step | Action | Purpose | Status | Approved By | Date |
|------|--------|---------|--------|-------------|------|
| 11.1 | USER runs `pnpm install` from root | Re-link all workspace packages so `@bingo/game-core` is recognized | [ ] Pending | | |
| 11.2 | USER runs `pnpm build` - verify no errors | Compile all packages and apps to catch any TypeScript/import errors | [ ] Pending | | |
| 11.3 | USER tests web-host: create round | Verify the create round form still works with the new shared services | [ ] Pending | | |
| 11.4 | USER tests web-host: start round | Verify starting a round and drawing numbers still works | [ ] Pending | | |
| 11.5 | USER tests mobile-server: health check | Verify mobile server starts and can import from game-core | [ ] Pending | | |

---

## Progress Summary

- **Total Steps**: 35
- **Completed**: 29
- **Pending**: 6 (Phase 11 verification only)
- **Current Phase**: 11 (Verification)
- **Current Step**: 11.1
- **Last Updated**: 2026-02-04
- **Note**: 6 import paths in app/ files were also updated from `@/lib/services/roundService` to `@bingo/game-core` (not in original plan, required before Phase 10 deletions)

---

## How to Resume

1. Read this entire document (especially "Rules for AI Assistant" section)
2. Find the first step with `[ ] Pending` status
3. Show the user what change will be made (exact file content)
4. Wait for user approval ("yes" or "no")
5. If approved: Make the change (create/edit/delete file)
6. Update this document AUTOMATICALLY (no approval needed):
   - Change `[ ] Pending` to `[x] Completed`
   - Add date and "User" to Approved By column
   - Update Progress Summary section
7. Proceed to next step

---

## Important Notes

- **ONE FILE AT A TIME**: Never change multiple files without approval
- **SHOW BEFORE CHANGE**: Always show the exact content that will be written
- **UPDATE THIS PLAN**: After each approved change, update the status in this file (NO approval needed for this)
- **TERMINAL COMMANDS**: Never execute pnpm/npm commands - show them to user to type
- **PRESERVE CONTEXT**: This document IS the context for resuming work

---

## Rollback Instructions

If something goes wrong:
1. Check git status: `git status`
2. Discard changes: `git restore .`
3. Remove untracked files: `git clean -fd`
4. Reset this plan's checkboxes to last known good state

---

## File Contents Reference

Below are the current file contents that will be moved. This serves as reference and backup.

### Current: apps/web-host/src/lib/mongodb.ts
```typescript
// Will be captured when we reach step 2.1
```

### Current: apps/web-host/src/infrastructure/database/schemas/user.schema.ts
```typescript
// Will be captured when we reach step 3.1
```

### Current: apps/web-host/src/infrastructure/database/schemas/round.schema.ts
```typescript
// Will be captured when we reach step 3.2
```

(Additional file contents will be captured as we progress through the migration)

---

## Changelog

| Date | Step | Action | Notes |
|------|------|--------|-------|
| 2026-02-03 | - | Created migration plan | Initial version |
| 2026-02-03 | - | Added "Rules for AI Assistant" section | AI can update this file without approval, terminal commands typed by user |
| 2026-02-03 | - | Added "Purpose" column to all steps | Each step now explains WHY it's needed, not just WHAT it does |
| 2026-02-03 | 1.1 | Created `packages/game-core/package.json` | Package definition with dependencies |
| 2026-02-03 | - | Created `.claude/settings.local.json` | Grants AI auto-write permission to migration plan file |
| 2026-02-03 | 1.2 | Created `packages/game-core/tsconfig.json` | TypeScript configuration |
| 2026-02-03 | 1.3 | Created `packages/game-core/src/index.ts` | Package entry point (placeholder) |
| 2026-02-03 | 2.1 | Created `packages/game-core/src/database/connection.ts` | MongoDB connection logic |
| 2026-02-03 | 3.1 | Created `packages/game-core/src/database/schemas/user.schema.ts` | User Mongoose schema |
| 2026-02-03 | 3.2 | Created `packages/game-core/src/database/schemas/round.schema.ts` | Round Mongoose schema |
| 2026-02-03 | 3.3 | Created `packages/game-core/src/database/schemas/index.ts` | Schemas barrel export |
| 2026-02-03 | 4.1 | Created `packages/game-core/src/database/mappers/user.mapper.ts` | User mapper |
| 2026-02-03 | 4.2 | Created `packages/game-core/src/database/mappers/round.mapper.ts` | Round mapper |
| 2026-02-03 | 4.3 | Created `packages/game-core/src/database/mappers/index.ts` | Mappers barrel export |
| 2026-02-03 | 5.1 | Created `packages/game-core/src/repositories/user.repository.ts` | User repository |
| 2026-02-03 | 5.2 | Created `packages/game-core/src/repositories/round.repository.ts` | Round repository |
| 2026-02-03 | 5.3 | Created `packages/game-core/src/repositories/index.ts` | Repositories barrel export |
| 2026-02-03 | 6.1 | Created `packages/game-core/src/services/userService.ts` | User service + added bcryptjs to package.json |
| 2026-02-03 | 6.2 | Created `packages/game-core/src/services/roundService.ts` | Round service with business rules |
| 2026-02-03 | 6.3 | Created `packages/game-core/src/services/index.ts` | Services barrel export |
| 2026-02-03 | 7.1 | Updated `packages/game-core/src/index.ts` | Public API exports |
| 2026-02-03 | 8.1 | Updated `apps/web-host/package.json` | Added @bingo/game-core dependency |
| 2026-02-03 | 8.2 | Updated `apps/web-host/src/lib/actions/auth.ts` | Changed import to @bingo/game-core |
| 2026-02-03 | 8.3 | Updated `apps/web-host/src/lib/actions/rounds.ts` | Changed import to @bingo/game-core |
| 2026-02-03 | 9.1 | Updated `apps/mobile-player/server/package.json` | Added @bingo/game-core and @bingo/domain dependencies |
| 2026-02-03 | 9.2 | Updated `apps/mobile-player/server/src/server.ts` | Added game-core import and example route |

