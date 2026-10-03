# Rank 3 batch 52 — Lashing Rope

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Lashing Rope (3) | The rope's Strike when the spell is cast and on each Sustain: a melee spell attack for 3d6 slashing (+2d6 per 2 ranks), repeated from the card for 1 minute. Notes cover the multiple attack penalty, the magical/reach/trip traits, and the Trip critical failure's replacement result. |

## Rules

- **Rope Strike (`sustain-attack.js` `compileRopeStrike`):** it reads "When you Cast the Spell and each time you Sustain the Spell, you can make a melee Strike with the X, which uses and contributes to your multiple attack penalty." and "These X Strikes are melee spell attacks; have the … weapon traits; and deal NdM type damage."
  - The damage must be the item's typed entry.
  - It also reads the Trip critical-failure sentences and "Heightened (+N) The damage from your X Strikes increases by …", against the item's step.

  The result is the sustain-attack family's repeated spell attack of the fixed type; the rest are notes.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-52.test.js` is new. Its negative case is a damage type other than the item's.

A whole-corpus compile (b467 → b468) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-52-live-results.json), case `rank3Batch52`, in the `pftest` world.

| Cast | Result | Damage |
| --- | --- | --- |
| 3rd | hit | 3d6 slashing = 12 |
| 3rd | critical hit | 3d6 slashing, doubled to 20 |
| 5th | hit | 5d6 = 14 |

The card shows the notes.

**Cleanup:** fixtures removed.
