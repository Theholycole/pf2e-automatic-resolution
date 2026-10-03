# Rank 4 batch 20 — Talking Corpse (and the "1 corpse" notes)

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Talking Corpse (4) | Will save by the corpse the GM targets (using its statistics at death). Each row is a GM note: what it may say, and the haunting on a critical success. The critical failure's −2 Deception "to deceive or mislead you" applies only against the caster, so it's in the note. |
| Grave Impressions (2), Peaceful Rest (2), Fate's Travels (3) | Already note-shaped, these were held only by their "1 corpse" target. They are now note cards on the caster. |

## Rules

- **Targets (`target-predicate-compiler.js`):** "1 corpse" is the dead creature's token.
- **Note clauses (`note-effects.js`):** "a −N status penalty to Deception checks to deceive or mislead you" is scoped to the caster, the GM's.

## Tests

1078 pass. `test/rank-4-batch-20.test.js` is new, with a negative case: a penalty to all Deception checks stays blocked.

A whole-corpus compile (b408 → b409) changed these four.

## Evidence

[Live evidence](phase-rank-4-batch-20-live-results.json), case `rank4Batch20`, in the `pftest` world.
- Talking Corpse on a corpse (0 HP): the critical failure's note includes the penalty.
- Grave Impressions, Peaceful Rest and Fate's Travels each posted a note card.
- **Cleanup:** fixtures removed.
