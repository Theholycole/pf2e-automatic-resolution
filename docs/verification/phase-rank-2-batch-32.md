# Rank 2 batch 32 — a constellation's blast

2026-10-01. Follows the user's decision of 2026-10-01: a choice depending on the caster's class feature is asked when casting.

| Spell | Now |
| --- | --- |
| Shining Starlight Attack (2) | The cast asks for the caster's zodiac constellation. The dialog defaults to the one matching PF2e's Starlit Sentinel flag when it's set. The constellation sets the save (Fortitude, Reflex or Will) and the damage type, and the dialog names its area (30-foot line or 15-foot cone) and traits. Only enemies of the caster (PF2e alliances) save: 2d10 of that type (+1d10 a rank), basic. A critical failure is also Dazzled until the start of the caster's next turn. |

## Rules

- **`constellation-blast.js` (new pre-pass):**
  - The Area paragraph ("varies"), the three rule sentences, and the Heightened step.
  - Each table row "<Name> | <attack> (<area>, <save>, <damage type>; <traits>)", in any order; a row whose damage type sits among its traits takes the first one.
  - It becomes the ordinary basic save of the enemies in the area, with the Dazzled rider and the damage type as the caster's choice. The item's own rule (PF2e types the damage from the dedication flag) isn't part of the compile.
- **`basic-save-runtime.js`:**
  - `start` asks for the constellation (or takes `options.constellation`) and sets the save statistic and the damage type.
  - The damage-type replacement also accepts a roll PF2e already typed to the chosen type.
- **`basic-save-core.js`:** `validConstellations` runs on both save routes. It checks each row, and that the cast's save is the chosen constellation's.

## Tests

864/864 pass. `test/rank-2-batch-32.test.js` is new. It checks:
- the rows (including Blossom's and Archer's orders);
- the enemies-only check and the rider;
- that a cast plan with another save is refused.

A whole-corpus compile (b285 → b286) changed only Shining Starlight Attack.

## Coverage

**Census:** **1089 enabled**, up from 1088. Rank 2: 177 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-32-live-results.json), case `rank2Batch32`, in the `pftest` world.
- **Sky Dragon, with the caster's PF2e flag set to electricity:** Reflex save. The ally was ineligible. The foe failed: "2d10 electricity" (6 lost), not Dazzled.
- **Sovereign Dragon, flag cleared:** Will save. The foe critically failed: "2d10 mental" doubled (14 lost) and Dazzled.
- **Cleanup:** fixtures removed.

## Note

The browser session had lapsed on the server ("User [] does not have permission to upload files"). The client was rejoined as Gamemaster, and the case was re-run and uploaded.
