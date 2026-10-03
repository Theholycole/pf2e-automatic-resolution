# Rank 3 batch 44 — Unbreaking Wave Advance

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Unbreaking Wave Advance (3) | A 15-foot cone with a Fortitude save. Failure: pushed 10 feet. Critical failure: pushed 20 feet. Both are GM reminders. The push note gives the collision damage at the cast rank (3d6, +1d6 per rank) if the creature would hit a solid barrier or another creature. |

## Rules

- **Collision damage (`compile-ability.js`, the push rows):** "If a creature pushed by … would be pushed into a solid barrier or another creature, it stops at that point and takes NdM damage." is read.
  - It must use the item's one untyped damage entry, with "Heightened (+1) The damage for pushing a creature into a solid barrier increases by …" equal to the item's own step.
  - It becomes `resolution.collisionDamage` plus a push note with the dice at the cast rank.
- **Validation:** the unused-shared-damage check accepts it when a push row and its note exist (`basic-save-core.js`).
- **Note text:** the push note shows "(3 + (@item.rank - 3) * 1)d6" as dice at the cast rank (`forcedMovementNoteText`).
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-44.test.js` is new. Its negative case is a collision step other than the item's.

A whole-corpus compile (b448 → b449) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-44-live-results.json), case `rank3Batch44`, in the `pftest` world, cast at 5th rank.
- The save card used Fortitude. A critical failure showed the 20-foot push and the collision note with 5d6.
- The card dealt no damage (the target lost 0).
- **Cleanup:** fixtures removed.
