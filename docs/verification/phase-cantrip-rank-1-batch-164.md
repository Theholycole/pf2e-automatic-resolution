# Cantrip / rank 1 batch 164 — PF2e rule Effects (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Song of Marching | +1 status to initiative for the caster and allies within 60 feet, a Performance toggle for the caster's initiative, then 1-day immunity |
| Share Lore | The targets become trained in the caster's Lore (a Lore item removed with the Effect) |
| Tentacular Limbs | The caster's unarmed Strikes gain the reach trait |

## Tests

779/779 pass. A whole-corpus compile changed only these 3 spells. Batch-8 is updated.

## Coverage

**Census:** **686 enabled**, up from 683.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-164-live-results.json), case `cr1Batch164`, in the `pftest` world.
- **Song of Marching** (on a temporary empty scene):
  - The bard and the near ally got +1 initiative; the far ally didn't.
  - The toggle set the bard's initiative statistic to Performance.
  - A second cast was refused (immunity).
- **Tentacular Limbs:** the unarmed Strike's traits include reach.
- **Share Lore:** the target got "Pftest Lore" (trained), which was removed when the Effect ended.
- **Found live:** a first run on the lab scene gave the song to many older suites' "party" actors within 60 feet. The case now uses a temporary scene, and those Effects and markers (172 items) were removed.
- **Cleanup:** fixtures removed, the temporary scene deleted, and no combats left.
