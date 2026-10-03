# Rank 4 batch 56 — Dreamer's Call

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Dreamer's Call (4) | Will (PF2e's item). Success: Fascinated until the end of the target's next turn. Failure and critical failure: also the caster's pick on the card — flee (Fleeing), drop prone (Prone), or approach / release (notes). A critical failure's "every action" is a note. |

## Rules

- **Course of action (`src/compiler/course-of-action.js` `rewriteCourseOfAction`):**
  - It reads the narration and the four rows.
  - It writes rows with Fascinated for the spell's duration and the Fleeing and Prone options.
  - Post-compile: `casterChoice {kind: "option", rows: failure, criticalFailure}`, tagging Fleeing and Prone and adding the approach and release notes.
- **Validator:** an option row's entries may last as the row's Fascinated does, or Prone until it Stands, when the course-of-action evidence is there.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-56.test.js` is new. Its negative case is another list (not read). Overwhelming Memory's option tests still pass.

A whole-corpus compile (b516 → b517) changed only Dreamer's Call.

## Evidence

[Live evidence](phase-rank-4-batch-56-live-results.json), case `rank4Batch56`, in the `pftest` world.

| Pick, result | Result |
| --- | --- |
| Flee, failure | Fascinated, Fleeing |
| Drop prone, critical failure | Fascinated, Prone, "Every action" note |

**Cleanup:** fixtures removed.
