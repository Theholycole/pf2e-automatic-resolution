# Rank 3 batch 10 — Iron Rain

2026-10-02.

| Spell | Now |
| --- | --- |
| Iron Rain (3) | The GM places the 20-foot burst. Each creature inside when it's cast (the GM confirms) rolls a basic Reflex save against 6d4 piercing and 3 persistent bleed (PF2e's two damage entries). The area then becomes difficult terrain for the spell's 1 minute. The GM is whispered the note that a creature in the terrain can Interact to pick up a knife and wield it as a mundane dagger. Ending the spell removes the area. **Heightened (+1):** +2d4 piercing and +1 bleed, both checked against PF2e's data. |

## Rules

- **`compileDebrisTerrain` (`lingering-area-compiler.js`):** used for a basic-save burst or cylinder with exactly one direct and one persistent damage entry. It reads:
  - "These blades deal 6d4 piercing damage and 3 persistent bleed damage to all creatures in the area." (both entries checked);
  - "As the rain dissipates, the ground is littered with …, creating difficult terrain that lasts for the duration of the spell.";
  - "Any creature that's within the difficult terrain can Interact to pick up one of the … and wield it as a mundane ….", a note;
  - the Heightened entry's two steps, which must equal PF2e's.

  The result is a lingering area exposed only when cast, with the existing terrain support.
- **`ongoing-families.js`:** the GM's note no longer gets "End the spell in Ongoing spells when it does." when it's a pick-up note.

## Tests

976/976 pass. `test/rank-3-batch-10.test.js` is new. It checks:
- the declaration;
- that a changed persistent amount, terrain kind, pick-up rider or heightening step isn't read.

A whole-corpus compile (b347 → b348) changed only Iron Rain.

## Coverage

**Census:** **1167 enabled** (milestone; 1163 non-ritual), up from 1166. Rank 3: 119 of 261.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-10-live-results.json), case `rank3Batch10`, in the `pftest` world.
- **At the cast:** one exposure, for the creature inside. Its failure took "6d4 piercing + 3 bleed": 12 lost, plus a "3 bleed" persistent condition.
- **Terrain:** a walk across it cost 25 feet: one plain square and two in the area on a 100-pixel grid, against 15 plain.
- **The pick-up note:** whispered, without the "End the spell" suffix.
- **End:** the record ended and the region was removed.
- **Run note:** the first run's assertions expected "3 persistent bleed" in PF2e's formula display (it shows "3 bleed") and assumed a 50-pixel grid. The note suffix it exposed was fixed. The second run passed.
- **Cleanup:** fixtures removed.
