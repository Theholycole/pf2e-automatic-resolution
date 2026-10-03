# Rank 3 batch 47 — Overload Connection

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Overload Connection (3) | 3d8 mental damage (+1d8 per rank) with a basic Reflex save, on the creatures the caster targets in the line between them and their familiar. The card repeats it once a round on a Sustain, for 1 minute. Notes cover the line and the repeat. |

## Rules

- **Sustain line (`sustain-bolt.js` `extractSustainLine`):** "When you Cast this Spell and the first time you Sustain this spell on subsequent turns, this magical connection flares in a line between you and your familiar, dealing @Damage[NdM[type]] damage to all creatures in the line, with a basic X save." is read after narration.
  - The spell's target must be "your familiar", and the Heightened damage step is read.
  - It becomes the sustain-bolt family's repeatable basic save (`repeatable.window: "sustain"`), with the spell's target cleared so the caster targets the line's creatures.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-47.test.js` is new. Its negative case is a line to a creature other than the familiar.

A whole-corpus compile (b458 → b459) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-47-live-results.json), case `rank3Batch47`, in the `pftest` world.

| Cast | Result | Damage taken |
| --- | --- | --- |
| At cast | failure | 3d8 mental = 15 |
| Sustain repeat | critical failure | 22 (double 11) |
| Heightened to 5th | failure | 5d8 = 23 |

The card shows the line notes.

**Cleanup:** fixtures removed.
