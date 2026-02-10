# Plan 003 — Card Bunch Progress & Cancellation

**Status:** Completed
**Started:** 2026-02-05
**Completed:** 2026-02-05
**Goal:** Enable real-time progress visibility and cancellation for card bunch generation, supporting up to 1 million cards.

---

## Problem Statement

Current implementation:
- Server action blocks until all cards are generated
- No progress visibility (user sees nothing while waiting)
- Cannot cancel once started (process runs to completion)
- Browser/server may timeout or hang on large batches (e.g., 1 million cards)

User requirements:
1. Real-time progress visibility based on actual server work
2. Ability to cancel generation mid-operation
3. Accurate time remaining estimation
4. Support for very large card bunches (1 million+)

---

## Solution Architecture

**Approach:** Polling-based background jobs with in-memory progress tracking

**How it works:**
1. User submits form → API starts background job, returns job ID immediately
2. Client polls `/api/card-bunch/progress/[jobId]` every second
3. Server generates cards in chunks (1000 at a time), updating progress after each chunk
4. Progress stored in memory (Map-based singleton for dev; Redis for production later)
5. User can cancel → client sends request to `/api/card-bunch/cancel/[jobId]`
6. Server checks cancel flag before each chunk and stops if cancelled

**Progress data:**
```typescript
{
  jobId: string;
  status: 'running' | 'completed' | 'cancelled' | 'failed';
  current: number;    // Cards generated so far
  total: number;      // Total cards to generate
  startTime: number;  // Timestamp
  error?: string;     // If failed
}
```

**Chunk generation:**
- Generate 1000 cards per chunk
- After each chunk: update progress in memory
- Check cancel flag before starting next chunk
- On completion: save all cards to DB at once
- On cancel: discard all generated cards (don't save partial batch)

---

## Files to Create

### 1. `apps/web-host/src/lib/types/cardBunchJob.ts`
TypeScript types for job progress tracking.

### 2. `apps/web-host/src/lib/services/cardBunchJobService.ts`
In-memory job manager singleton. Manages running jobs, progress updates, cancel flags.

### 3. `apps/web-host/src/app/api/card-bunch/create/route.ts`
POST endpoint to start background job. Returns `{ jobId }`.

### 4. `apps/web-host/src/app/api/card-bunch/progress/[jobId]/route.ts`
GET endpoint to fetch progress for a job.

### 5. `apps/web-host/src/app/api/card-bunch/cancel/[jobId]/route.ts`
POST endpoint to set cancel flag for a job.

### 6. `apps/web-host/src/app/host/cartas/crear/CardBunchFormWithProgress.tsx`
Client component with progress bar, polling, and cancel button.

---

## Files to Modify

### 7. `packages/game-core/src/services/cardBunchService.ts`
Add `generateCardsInChunks()` function that:
- Generates cards in chunks of 1000
- Accepts progress callback `onProgress(current, total)`
- Accepts cancel check callback `shouldCancel()`
- Returns all generated cards or throws if cancelled

### 8. `apps/web-host/src/app/host/cartas/crear/page.tsx`
Replace form with `CardBunchFormWithProgress` component.

---

## Implementation Steps

### Step 1 — Job Types
**File:** `apps/web-host/src/lib/types/cardBunchJob.ts` (create)

**Purpose:** Define TypeScript interfaces for job progress tracking. Shared by job service, API routes, and client component to ensure type safety.

**Content:**
```typescript
export type JobStatus = 'running' | 'completed' | 'cancelled' | 'failed';

export interface CardBunchJobProgress {
  jobId: string;
  status: JobStatus;
  current: number;
  total: number;
  startTime: number;
  endTime?: number;
  error?: string;
}

export interface CreateCardBunchJobInput {
  name: string;
  cardSize: number;
  maxNumber: number;
  count: number;
}
```

**Status:** [x] Completed

---

### Step 2 — Job Service
**File:** `apps/web-host/src/lib/services/cardBunchJobService.ts` (create)

**Purpose:** Singleton service managing in-memory job state. Provides methods to create jobs, update progress, check cancellation, and retrieve status. This is the core coordination layer between API routes and card generation.

**Key methods:**
- `createJob(input)` → returns jobId
- `getProgress(jobId)` → returns progress object
- `updateProgress(jobId, current)` → updates current count
- `setStatus(jobId, status)` → changes job status
- `shouldCancel(jobId)` → checks cancel flag
- `cancelJob(jobId)` → sets cancel flag
- `completeJob(jobId)` → marks as completed
- `failJob(jobId, error)` → marks as failed

**Storage:** In-memory Map (replace with Redis later for production)

**Status:** [x] Completed

---

### Step 3 — Chunk Generation in game-core
**File:** `packages/game-core/src/services/cardBunchService.ts` (modify)

**Purpose:** Add `generateCardsInChunks()` function that generates cards incrementally with progress callbacks. This allows cancellation between chunks and enables real-time progress updates without blocking.

**Changes:**
- Keep existing `generateCards()` function (used for small batches)
- Add new `generateCardsInChunks()` function:
  - Accepts `chunkSize` parameter (default 1000)
  - Accepts `onProgress(current, total)` callback
  - Accepts `shouldCancel()` callback (returns boolean)
  - Generates cards in chunks, calling callbacks after each
  - Throws error if `shouldCancel()` returns true
  - Returns all generated cards on success

**Status:** [x] Completed

---

### Step 4 — Create Job API Endpoint
**File:** `apps/web-host/src/app/api/card-bunch/create/route.ts` (create)

**Purpose:** API endpoint that starts a background job for card generation. Returns immediately with jobId, allowing client to poll for progress.

**Logic:**
1. Validate session (must be logged in)
2. Parse request body (name, cardSize, maxNumber, count)
3. Create job using `cardBunchJobService.createJob()`
4. Start async task:
   - Call `generateCardsInChunks()` with progress/cancel callbacks
   - On progress: `updateProgress(jobId, current)`
   - On completion: save to DB via `createCardBunch()`, then `completeJob(jobId)`
   - On error/cancel: `failJob(jobId, error)` or `setStatus(jobId, 'cancelled')`
5. Return `{ jobId }` immediately (don't await task)

**Status:** [x] Completed

---

### Step 5 — Progress API Endpoint
**File:** `apps/web-host/src/app/api/card-bunch/progress/[jobId]/route.ts` (create)

**Purpose:** GET endpoint that returns current progress for a job. Polled by client every second to update UI.

**Logic:**
1. Validate session
2. Extract jobId from params
3. Call `cardBunchJobService.getProgress(jobId)`
4. Return progress object as JSON

**Status:** [x] Completed

---

### Step 6 — Cancel API Endpoint
**File:** `apps/web-host/src/app/api/card-bunch/cancel/[jobId]/route.ts` (create)

**Purpose:** POST endpoint that sets cancel flag for a running job. Server checks this flag between chunks and stops generation.

**Logic:**
1. Validate session
2. Extract jobId from params
3. Call `cardBunchJobService.cancelJob(jobId)`
4. Return success response

**Status:** [x] Completed

---

### Step 7 — Client Form with Progress
**File:** `apps/web-host/src/app/host/cartas/crear/CardBunchFormWithProgress.tsx` (create)

**Purpose:** Client component that submits form to API, polls for progress, displays progress bar, and allows cancellation.

**UI elements:**
- Form fields (name, cardSize, maxNumber, count)
- Submit button → disabled during generation
- Progress section (shown when job is running):
  - Progress bar (visual percentage)
  - "X / Y cards generated (Z%)"
  - "Time remaining: ~N seconds/minutes"
  - Cancel button
- Success/error messages

**Logic:**
1. On submit: POST to `/api/card-bunch/create`, get jobId
2. Start polling `/api/card-bunch/progress/[jobId]` every 1 second
3. Update UI with progress data
4. Calculate time remaining: `(total - current) / rate` where `rate = current / elapsedTime`
5. On cancel click: POST to `/api/card-bunch/cancel/[jobId]`, stop polling
6. On completion: redirect to `/host/cartas` with success message
7. On error: show error message, stop polling

**Status:** [x] Completed

---

### Step 8 — Update Page to Use New Form
**File:** `apps/web-host/src/app/host/cartas/crear/page.tsx` (modify)

**Purpose:** Replace server-action form with new client component that supports progress and cancellation.

**Changes:**
- Remove `createCardBunchAction` import
- Import `CardBunchFormWithProgress`
- Replace `<form action={createCardBunchAction}>` with `<CardBunchFormWithProgress />`

**Status:** [x] Completed

---

## Verification Steps

After all steps are complete:

1. **Small batch (10 cards):**
   - Should generate quickly
   - Progress bar appears briefly
   - Redirects to list page

2. **Large batch (10,000 cards):**
   - Progress bar shows incremental updates
   - Time remaining updates accurately
   - Can cancel mid-generation
   - Cancelled jobs don't save to DB

3. **Very large batch (1,000,000 cards):**
   - Progress continues smoothly
   - Time remaining is accurate
   - Can cancel at any point
   - No browser/server timeout

4. **Refresh during generation:**
   - Progress should persist (job continues on server)
   - Can resume polling with same jobId

---

## Future Enhancements (Not in This Plan)

- Replace in-memory storage with Redis for production
- Add job cleanup (delete old completed/cancelled jobs)
- Support multiple concurrent jobs per user
- Add "resume" functionality for failed jobs
- Show generation rate (cards/second) in UI

---

## Notes

- In-memory storage is acceptable for dev/demo
- For production, migrate to Redis using same interface
- Chunk size of 1000 is tunable (can adjust based on performance testing)
- Cancel discards ALL work (intentional - prevents partial/corrupted bunches)
