# Rank 4 batch 70 — Compel True Name

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Compel True Name (4) | Will. The target must be one whose true name the caster knows (GM-confirmed on the card). Each result's temporary immunity covers only this caster's castings: 1 week on a critical success, 1 day on a success, 1 hour on a failure, none on a critical failure. Failure: a "Compelled" note for 10 minutes (the GM ends it early once a finite instruction is done or the instructions become self-destructive); critical failure: 8 hours. What the target learns of the caster's true name is a card reminder. |

## Rules

- **True-name command (`src/compiler/true-name-command.js`):**
  - It reads the lead (no self-destructive instructions, the linguistic note, the save) and all four rows.
  - The rows become "unaffected", with the Compelled note on the failing rows.
  - The immunity is `temporaryImmunity` with `byDegree` and `byCaster`.
- **Temporary immunity, generalized (`scripts/basic-save-core.js`, `scripts/basic-save-runtime.js`):**
  - `byDegree` gives each listed result its own time. The validator requires exactly the listed results, each with a positive whole time in minutes, hours or days.
  - `byCaster` keys the immunity by the caster's actor, so other casters can still target the creature.
- **Interpretation:** what the target learns is a reminder, not tracked. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-70.test.js` is new. Its negative cases are:

- a per-result time outside the listed results (refused);
- another learning wording (not read).

A whole-corpus compile (b531 → b532) changed only Compel True Name.

## Evidence

[Live evidence](phase-rank-4-batch-70-live-results.json), case `rank4Batch70`, in the `pftest` world.

| Result | Immunity (keyed to this caster) | Compelled note | Second cast by the same caster |
| --- | --- | --- | --- |
| Critical success | 7 days | — | immune |
| Success | 1 day | — | immune |
| Failure | 1 hour | 10 minutes | immune |
| Critical failure | — | 8 hours | eligible |

**Cleanup:** fixtures removed.
