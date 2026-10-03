# Rank 2 batch 46 — heal or harm, with persistent damage on both sides

2026-10-01.

| Spell | Now |
| --- | --- |
| Soothing Mist (2) | One roll of 2d8 vitality (+1d8 a rank): heal or harm by creature. A living target is healed by it, and one persistent acid, bleed, fire, poison or void damage on it ends (the caster picks when there are several). An undead target attempts a basic Fortitude save. On a failure (or critical failure, the damage doubled) it also takes persistent vitality damage equal to the rank, which isn't doubled. |

## Rules

- **`heal-or-harm.js`:** a second grammar for this text. It requires the item's damage to be both damage and healing, the Heightened (+1) step, and the rank formula. It becomes the dual basic save, with the harmed side's persistent rider and the healed side's `persistentRemoval`.
- **`compile-ability.js`:** the failure rows gain the persistent formula (the degree route, rows fully stated), and the plan gets `persistentRemoval`.
- **`basic-save-core.js`:** `persistentRemoval` needs the listed types on a heal-or-harm plan, with its evidence.
- **`basic-save-runtime.js`:** after healing a creature, one matching persistent damage condition is deleted (a dialog picks when there are several).

## Tests

890/890 pass. `test/rank-2-batch-46.test.js` is new. It checks the dual mode, the removal types and the rider, and that a forged removal is refused.

A whole-corpus compile (b300 → b301) changed only Soothing Mist.

## Coverage

**Census:** **1121 enabled**, up from 1120. Rank 2: 207 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-46-live-results.json), case `rank2Batch46`, in the `pftest` world (3rd rank).
- The living target was in healing mode and the undead in damage mode. The roll was "3d8 vitality" (12).
- **The living creature:** healed 12, and its persistent bleed ended.
- **The undead (failure):** lost 12 and took persistent vitality 3.
