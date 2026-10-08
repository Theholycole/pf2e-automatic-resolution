# Rank 9 batch 8 — the end of group 3

2026-10-05. The last three spells of feature group 3 (lingering areas with rules of their own). Group 3 is complete.

| Spell | Now |
| --- | --- |
| Burning Blossoms | A card of parts. **The burning tree:** a placed 30-foot area for 1 minute; each creature ending its turn under the branches takes 6d6 fire (+1d6 a rank), no save. **Seeing the tree:** the Will save (emotion, mental, visual) of the enemies the GM targets. Critical success: immune for 24 hours. Failure: Fascinated until the end of its next turn. Critical failure: Fascinated for the spell. Both failing rows get the "move toward the tree" note. The GM presses it again when a creature that can still see the tree ends its turn. |
| Unfathomable Song | A sustained lingering effect on up to 5 targets: saves when cast and on the first Sustain each round (once a round). Critical success: immune for 1 minute. Each save card rolls 1d4; a failure gets that result's condition and a critical failure the result one higher: 1 Frightened 2; 2 Confused 1 round; 3 Stupefied 4 for 1 round; 4 Blinded 1 round; 5 Stunned 1 round and Stupefied 1. |
| Dread Mosquito Storm | A lingering 60-foot burst. A creature entering or starting its turn there takes 1 void damage (the module's), then saves. Success/failure: necrotic blood at stage 1; critical failure: stage 2. The disease is handed to Pseudo Afflictions or the GM. The success's 1-round recovery and the thrall on death are notes. |

New runtime:

- **`hazard` card part:** a placed area dealing its damage, no save, as turns end.
- **Rolled tables read by degree:** each condition carries the roll results that give it (`rollResults`), and a critical failure adds the offset.
- **`exposureDamage` on lingering areas:** the stated damage at each listed exposure.
- **Lingering afflictions:** the affliction handoff accepts a non-sustained lingering area when the disease has its own maximum duration.

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-9-batch-8.test.js` is new. A whole-corpus compile (b778 → b780) changed only these three spells.

## Evidence

[Live evidence](phase-rank-9-batch-8-live-results.json), case `rank9Batch8`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Burning Blossoms: a failure and a critical success seeing the tree | Fascinated with the "Drawn to the tree" note; the other immune, not fascinated |
| A creature's turn ends under the branches | 16 fire |
| Unfathomable Song: a failure and a critical failure | Rolled 2: Confused; rolled 4, result 5: Stunned and Stupefied |
| Dread Mosquito Storm: a creature walks in, fails | Exposed on entering; 1 void; afflicted with necrotic blood |
