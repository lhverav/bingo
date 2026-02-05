# Plans Index

> **For AI assistant:** Read `plans/RULES.md` first, then this file. RULES.md contains the general rules that govern every plan (approval flow, one-edit-per-step, package install policy). This file tells you what is currently in progress and where to resume.

---

## Current Plan

No plan currently in progress. All plans completed.

---

## Plan Inventory

| ID | Title | File | Status | Next Step |
|----|-------|------|--------|-----------|
| 001 | Architecture Migration to game-core | `plans/001-architecture-migration.md` | Phases 1–10 done. Phase 11 (verification) pending | 11.1 — user runs `pnpm install` |
| 002 | Card Bunch Feature | `plans/002-card-bunch-feature.md` | Completed | All 22 steps done + menu added |

---

## How to Use This Index

1. **New session starts** → read `plans/index.md` (this file)
2. **Find current plan** in the "Current Plan" section above
3. **Open that plan file** and look for the first `[ ] Pending` step
4. **Resume from there** — no need to re-derive context, the plan file has design notes and exact file lists

When a plan is fully completed, change its status to `Completed` in the inventory table and update "Current Plan" to the next active plan (or remove the section if nothing is in progress).

---

## Rules

- Every new feature or multi-step task gets a plan file in this folder
- Plan IDs are sequential: `001`, `002`, `003`, …
- The index is the single source of truth for "what is the current work"
- Steps inside each plan are marked `[x] Completed` or `[ ] Pending`
- Plan files should include: goal, ordered steps with file paths, design decisions, verification checklist
