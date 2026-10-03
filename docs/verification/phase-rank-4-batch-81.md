# Rank 4 batch 81 — Shape Stone

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shape Stone (4) | The GM targets the creatures standing atop the reshaped stone. Each rolls the better of its Reflex save and Acrobatics check against the spell DC (the text's "Reflex save or Acrobatics check"). Failure: Prone. Critical failure: Prone, and a card reminder to move it off the stone where it can fall. |

## Rules

- **Stone reshape (`src/compiler/stone-reshape.js`):**
  - It reads the lead (the shaping, the "Reflex save or Acrobatics check" sentence), the target "cube of stone", and the three rows.
  - It sets `saveChoice {statistics: [reflex, acrobatics], chooser: target}`. Targeting is the creatures atop the stone.
- **A save-or-skill choice:**
  - `scripts/basic-save-core.js` accepts a skill (Acrobatics or Athletics) as the second statistic, only when the sentence says "X save or Y check".
  - `scripts/basic-save-runtime.js` compares and rolls the PF2e skill statistic for it.
- **Interpretation:** "falls off the stone" is the GM's token move. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-81.test.js` is new. Its negative cases are:

- another skill on the plan (refused);
- another skill in the text (not read).

A whole-corpus compile (b557 → b558) changed only Shape Stone.

## Evidence

[Live evidence](phase-rank-4-batch-81-live-results.json), case `rank4Batch81`, in the `pftest` world, at 4th rank.

| Creature | Roll | Result | Prone |
| --- | --- | --- | --- |
| Acrobat (Acrobatics +30, Reflex +0) | Acrobatics, modifier +30 | critical success | — |
| Set to failure | — | failure | yes |
| Set to critical failure | — | critical failure | yes |

**Cleanup:** fixtures removed.
