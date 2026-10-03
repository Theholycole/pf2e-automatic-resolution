# Rank 4 batch 67 — Seal Fate

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Seal Fate (4) | Fortitude. PF2e's Effect gives weakness floor(rank/2) to the caster's chosen type (picked on the card): until the end of the caster's next turn on a success, 1 minute on a failure, unlimited on a critical failure. The failing rows' death rule (level 7 or less, +4 every 2 ranks) is a note at the cast rank. |

## Rules

- **Chosen weakness (`compileChosenWeaknessEffects`):**
  - It reads the listed types, the success row's weakness (it must equal floor(rank/2) at the spell's rank), the failing rows' durations and PF2e's one Effect (linked outside the rows).
  - The Effect's ChoiceSet must be exactly those types, and its Weakness of the selected type `floor(@item.level/2)`.
  - Each row gets it with its duration override. The proof kind is `chosen-weakness-effect`; it returns the caster choice to preset.
- **Plan:**
  - `casterChoice {flag: damageType}` (the flag form now also accepts this kind).
  - The death rule as a `rankAmount` note.
  - The outcome lifecycle.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-67.test.js` is new. Its negative case is another list (not read).

A whole-corpus compile (b528 → b529) changed only Seal Fate.

## Evidence

[Live evidence](phase-rank-4-batch-67-live-results.json), case `rank4Batch67`, in the `pftest` world, at 6th rank, fire picked.

| Result | Fire weakness | Effect | Death note |
| --- | --- | --- | --- |
| Success | 3 | 1 round, turn end | — |
| Failure | 3 | 1 minute | level 11 or less |
| Critical failure | 3 | unlimited | level 11 or less |

**Cleanup:** fixtures removed.
