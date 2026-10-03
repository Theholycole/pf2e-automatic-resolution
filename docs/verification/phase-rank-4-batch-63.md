# Rank 4 batch 63 — Bestial Curse

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Bestial Curse (4) | Fortitude. **Success:** Clumsy 1 for 1 round. **Failure:** for 1 hour, Clumsy 1, PF2e's silver-weakness Effect, and notes for the bestial Strike (caster's choice) and the flat check on manipulate actions. **Critical failure:** the same, unlimited. |

## Rules

- **Bestial rows (`src/compiler/bestial-rows.js` `rewriteBestialRows`):**
  - It reads the four rows; the Effect link paragraphs are kept.
  - It writes Clumsy rows with "gains weakness 1 to silver" on the failing rows.
  - Post-compile: the two notes per failing row and the outcome lifecycle.
- **Weakness curse Effects (`compileWeaknessCurseEffects`):** PF2e's two Effects, each with exactly the stated weakness, bound by duration (the hours' one for a failure, the unlimited one for a critical failure). The proof kind is `weakness-curse-effect`.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-63.test.js` is new. Its negative case is another weakness (not read).

A whole-corpus compile (b524 → b525) changed only Bestial Curse.

## Evidence

[Live evidence](phase-rank-4-batch-63-live-results.json), case `rank4Batch63`, in the `pftest` world, on living humanoids.

| Result | Clumsy | Silver weakness | Notes |
| --- | --- | --- | --- |
| Success | 1 | — | — |
| Failure | 1 | 1 | 2 (1 hour) |
| Critical failure | 1 | 1 | 2 (unlimited) |

**Cleanup:** fixtures removed.
