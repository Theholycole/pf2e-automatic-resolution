# Rank 3 batch 34 — Rouse Skeletons

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Rouse Skeletons (3) | A sustained placed 10-foot burst that is difficult terrain. Each creature in it saves when cast (basic Reflex, 2d6 slashing). Each round's first Sustain repeats the save; the GM moves the region up to 20 feet first. Two GM notes: leave flying creatures out (only creatures on the ground), and move the region before the Sustain. |

## Rules

- **Appearing damage and Sustain moves (`lingering-area-compiler.js`):** three sentences are read.
  - "Their … deal NdM type damage to creatures on the ground in the area when the … first appear with a basic X save." is the cast's save.
  - "On subsequent rounds, the first time you Sustain the Spell each round, you can move the area of … up to N feet within the range of the spell and deal NdM type damage with a basic X save to each creature in the new area." is the Sustain's save. Both must be the item's damage entry.
  - "Damaging or destroying the … is irrelevant, …" is narration.
- **Terrain is never narration:** "difficult terrain" is now a rule word, so a terrain sentence the area doesn't read refuses it. Before, it could be swallowed as one of the two opening narration sentences. "The area they fill is difficult terrain." is read. A whole-corpus compile showed no other spell affected.

## Tests

1087 pass. `test/rank-3-batch-34.test.js` is new, with a negative case: an unread terrain sentence ("greater difficult terrain") refuses the area.

A whole-corpus compile (b416 → b417) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-34-live-results.json), case `rank3Batch34`, in the `pftest` world.
- The region has difficult terrain.
- **Cast:** the creature inside was reviewed once and failed: 5 slashing.
- **Sustain:** in combat, the GM moved the region and the caster Sustained. The creature's `sustain` exposure, critically failed, did 24, an even number (double).
- **Cleanup:** the record ended; fixtures removed.
