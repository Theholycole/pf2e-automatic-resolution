# Rank 3 batch 74 — Garden of Stone

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Garden of Stone (3) | A basic Reflex save at the cast: 3d10 piercing (+1d10 per rank) to the creatures in the area. A card reminder covers the rest: push them to the nearest unoccupied space; the stalagmite (AC 10, Hardness 5, 30 Hit Points, +10 per rank); the 20-foot emanation of difficult terrain while the spell lasts; and the stalagmite remaining if it survives. |

## Rules

- **Stone garden (`src/compiler/stone-garden.js`):**
  - It reads both paragraphs, the heightening, and PF2e's damage entry.
  - It rewrites the cast into the plain basic save, and puts the push, the terrain and the stalagmite in a reminder.
- **Interpretation:** the push and the terrain are the GM's on the map. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-74.test.js` is new. Its negative case is another rider (not read).

A whole-corpus compile (b564 → b565) changed only Garden of Stone.

## Evidence

[Live evidence](phase-rank-3-batch-74-live-results.json), case `rank3Batch74`, in the `pftest` world (caster level 9).

| Rank | Result | Damage | Hit Points lost | Reminder on the card |
| --- | --- | --- | --- | --- |
| 3 | failure | 3d10 piercing = 18 | 18 | yes |
| 5 | critical failure | 5d10 piercing = 34 | 68 | yes |

**Cleanup:** fixtures removed.
