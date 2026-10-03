# Rank 4 batch 5 — Wall of Fire, Wall of Thorns, Wall of Ice (damaging walls)

2026-10-02. Part of the user's ranks 3–5 pass. A new note family, `damaging-wall` (`src/compiler/damaging-wall.js`).

| Spell | Now |
| --- | --- |
| Wall of Fire (4) | The GM draws the wall (a selected region). A creature in it as its turn starts takes 4d6 fire automatically, +1d6 a rank. Crossing it is the GM's Ongoing control (target each creature; the module rolls and applies with PF2e's IWR). Concealment across the wall is a note. |
| Wall of Thorns (3) | The wall's spaces are difficult terrain. The control asks for the number of move actions into the wall and rolls 3d4 piercing (+1d4 a rank) for each. Cover, the sections' AC and Hardness, and their Hit Points at the cast rank (20, +5 a rank) are notes. |
| Wall of Ice (5) | The control is for passing through a destroyed section's ice: 2d6 cold, +1d6 per 2 ranks (the text's +2, not the item's +1). The sections' Hit Points at the cast rank (40, +10 per 2 ranks), opacity, immunities and weakness are notes. The GM draws the destroyed section's difficult terrain. |

## Rules

- **Compiler:** each sentence must be one of:
  - a known wall note (shape, vertical, shorter, open space, concealment, opacity, the section statistics, immunity, destroyed sections, fire weakness);
  - the one damage trigger (crossing or start of turn; per move action; destroyed section's ice);
  - the thorns' cover-and-terrain sentence;
  - at most one leading narration.
- **Checks:** the item's damage must equal the text's. The Heightened entry must step that damage's dice (and the sections' Hit Points where stated).
- **Runtime:**
  - `#executeDamagingWall` uses the selected region (or `options.region`) with `startRegionArea`.
  - `startRegionArea` now takes `events` and `hazardDamage` (Wall of Fire's turn-start damage through the existing hazard path).
  - The gm-hazard control has a `wall` kind with its label; per move action, it asks the count and rolls once each.

## Tests

1012 + 3 = 1015 pass. `test/rank-4-batch-5.test.js` is new. It includes a negative case (an extra rule in the damage sentence leaves the family) and the text-over-data interval for Wall of Ice.

A whole-corpus compile (b369 → b370) changed only these three.

## Evidence

[Live evidence](phase-rank-4-batch-5-live-results.json), case `rank4Batch5`, in the `pftest` world. It passed on the first run.
- **Wall of Fire, in combat:**
  - The creature in the wall lost 18 as its turn started.
  - The crossing control on another creature dealt 12, matching the report.
- **Wall of Thorns:** difficult terrain on the region; 2 move actions gave two rolls and 12 lost, matching the report; sections had 20 HP.
- **Wall of Ice at 7th:** 3d6 cold and sections of 50 HP.
- **Cleanup:** the combat, regions and fixtures were removed.
