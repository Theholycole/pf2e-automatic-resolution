# Rank 5 batch 80 — Wall of Flesh

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Wall of Flesh (5) | **The caster's pick** (a dialog, or the `feature` option). **Mouths:** the GM's region (the wall and the squares within 5 feet) is an Ongoing area. As a creature ends its turn in it, the caster's spell attack against its AC deals 2d6 piercing (+1d6 per 2 ranks), doubled on a critical hit. **Arms:** the same region; the creature's Reflex save against the spell DC; a failure is Grabbed, a critical failure Restrained, for 1 round (the GM removes it on an Escape). **Eyes:** the caster's Effect for 1 minute: +2 circumstance to Perception, toggled for visual checks within the wall's line of sight. Each section's AC 10 and Hit Points (75, +10 per 2 ranks) and the rest are GM notes. |

## Rules

- **`src/compiler/flesh-wall.js`:** reads every sentence, the three features (the arms' result rows) and the Heightened entry; `fleshWallAt` gives the mouths' dice and a section's Hit Points.
- **`applyHazardDamage`:** `fleshMouths` and `fleshArms` branches.
- **Runtime:** new kind `flesh-wall`.

## Interpretation

- **"Any creature"** is any creature, allies included.
- **"Within 5 feet of the wall"** is the GM's region (the module can't measure to a drawn line).
- **The eyes' toggle** defaults on.

## Tests

`test/rank-5-batch-80.test.js` is new. It covers the data, the formulas by rank and an unrecognised clause (not read).

A whole-corpus compile (b688 → b689) changed only Wall of Flesh.

## Evidence

[Live evidence](phase-rank-5-batch-80-live-results.json), case `rank5Batch80`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| Mouths at 5th; a creature (AC 5) ends its turn beside it | 2d6 formula; sections 75 HP; bitten for 8 |
| Arms (another wall); a creature (Reflex −40) ends its turn beside it | Restrained for 1 round |
| Eyes | The caster's Perception +2 |
| At 7th | 3d6; sections 85 HP |

**Cleanup:** fixtures, combat, records and regions removed.
