# Rank 4 batch 32 — Perfected Body

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Perfected Body (4) | A reaction to the caster's failed or critically failed save. The newest module save card still being resolved where the caster failed is corrected one degree better (critical failure → failure, failure → success). Otherwise, PF2e's newest failed save of the caster within a minute is named with its new result for the GM to apply. A GM reminder lists the qualifying traits and conditions. With no failed save, it's refused. |

## Rules

- **Save upgrade (`check-helpers.js` `compileSaveUpgrade`, kind `save-upgrade`):** reads "Trigger You fail or critically fail a saving throw against an effect that has the <traits> trait, or that would make you <conditions>." with "You get a failure if you rolled a critical failure or a success if you rolled a failure." One narration sentence is allowed.
- **Runtime (`effect-runtime.js`):** the card correction uses the save runtime's `correctTarget` (degree).
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

1103 pass. `test/rank-4-batch-32.test.js` is new, with a negative case: another upgrade isn't read.

A whole-corpus compile (b433 → b434) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-32-live-results.json), case `rank4Batch32`, in the `pftest` world.
- With no failed save, it was refused.
- On a Fear card with the caster's failure set, the reaction corrected it to a success.
- After a plain Fortitude roll against DC 60 (a critical failure), the card named failure as the new result, with the GM reminder.
- **Cleanup:** fixtures removed.
