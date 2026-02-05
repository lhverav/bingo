# Plans — General Rules

> **For AI assistant:** These rules apply to EVERY plan AND to ALL work in this codebase. Read this file once at session start alongside `index.md`. Never repeat these rules inside individual plan files.

---

## ⚠️ CRITICAL RULE — NO CHANGES WITHOUT EXPLICIT APPROVAL

**The AI must NEVER make file changes (create, edit, delete) without explicit user approval FIRST.**

This applies to:
- ✅ Code files (`.ts`, `.tsx`, `.js`, etc.)
- ✅ Configuration files (`package.json`, `tsconfig.json`, etc.)
- ✅ Documentation files (`.md` files)
- ✅ ANY file in the codebase
- ✅ Plan execution steps AND ad-hoc requests

**Mandatory flow for ALL changes:**

1. **Explain**: Describe the problem and proposed solution
2. **Ask**: "Should I proceed with this change?"
3. **Wait**: Stop and wait for explicit "yes" from user
4. **Only then**: Make the change using Write/Edit tool

**Examples of what requires approval:**
- "I'll add validation to the form" → ❌ MUST ask first
- "Let me fix this bug" → ❌ MUST explain + ask first
- "I'll update the RULES.md file" → ❌ MUST ask first
- "Should I proceed?" → ✅ CORRECT, now wait for "yes"

**Exception:** Updating plan file status (`[ ]` → `[x]`) after completing an approved step does NOT require separate approval (see Rule 4 below).

---

## 1. Package Installation — Never Executed by AI

The AI must **never run** `pnpm install`, `npm install`, or any package-manager commands. When a step requires installing dependencies, the AI shows the exact command and waits for the user to run it manually before continuing.

Example output format:
```
Run this command:
  pnpm install
Tell me when it's done so I can continue.
```

---

## 2. Every Step Must Explain Its Purpose

Each step in a plan is not just "what to do" but "why". The explanation must connect directly to the overall goal of that specific plan. The reader (or a future AI session) must understand why this step exists before touching the file.

Example:
> **Step 3 — CardBunch mapper**
> Purpose: Translates between the flat DB fields (`minNumber`, `maxNumber`) and the domain shape (`numberRange: { min, max }`). Without this, the repository would leak Mongoose internals into business logic — same pattern used by `RoundMapper`.

---

## 3. One Edit Per Step — Approval Required Before Each

- Each step covers **exactly one file change** (one create or one edit).
- If a logical action touches multiple files (e.g., "create schema + update barrel export"), it must be split into separate steps.
- The AI shows the exact change (full file content for creates, exact diff for edits) **before** making it.
- The AI **waits for explicit approval** ("yes") before writing anything.
- After approval, the AI executes the single change, marks that step `[x] Completed` in the plan file, and presents the next step.

Flow:
```
AI: "Step X — [title]"
AI: "Purpose: [why this matters for the plan goal]"
AI: "Here is what will be changed: [show content / diff]"
AI: "Do you approve?"
User: "yes"
AI: [writes the single file]
AI: [marks step X as completed in the plan]
AI: "Step X done. Next is Step Y — [title]"
```

---

## 4. Plan File Update — No Approval Needed

After each approved step is executed, the AI updates the step's status from `[ ] Pending` to `[x] Completed` in the plan file automatically. This does **not** count as a step and does **not** require approval — it is bookkeeping only.

---

## 5. Resuming a Session

1. Read `plans/index.md` → find the current plan
2. Read `plans/RULES.md` (this file)
3. Open the current plan file → find the first `[ ] Pending` step
4. Resume from that step using the approval flow above
