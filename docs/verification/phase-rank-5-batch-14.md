# Rank 5 batch 14 — Quicken Time

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Quicken Time (5) | A placed 20-foot burst for 1 minute. Creatures inside are Concealed, and those outside are concealed to them. A creature whose turn starts inside is Quickened until the end of that turn. Its note says the extra action can only be used to Stride or Strike. |

## Rules

- **Concealing areas (`concealing-area.js`):** two sentences are now read.
  - "…; creatures inside the area are Concealed to those outside it, and vice versa." (narration may lead the clause) is the same concealment as Mist's.
  - "Any creature that begins its turn in the area is Quickened until the end of its turn and can use the extra action only to X or Y." is a turn condition.
- **Turn conditions (`ongoing-families.js` `startCloud`, `applyTurnEffect`):** the cloud's record exposes creatures at their turn start. Each gets an Effect granting the condition until the end of that turn (0 rounds, turn-end), replacing the cast's earlier one.

## Tests

1104 pass. `test/rank-5-batch-14.test.js` is new, with a negative case: another duration isn't read.

A whole-corpus compile (b434 → b435) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-14-live-results.json), case `rank5Batch14`, in the `pftest` world.
- The creature inside is Concealed but not Quickened when the spell is cast.
- On the caster's turn, nobody is Quickened. On the creature's own turn, it's Quickened (0 rounds, turn-end) with the note.
- **Cleanup:** fixtures removed.
