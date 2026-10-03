# Cantrip / rank 1 batch 105 — Wildfire

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “A creature that ends its turn in the area must succeed at a Reflex save or take @Damage[1[persistent,fire]] damage.”: a sustained lingering burst. A creature ending its turn inside saves; a failure or critical failure takes the persistent fire, +1 per 2 ranks (the heightened text) | Wildfire (1) |
| “The area becomes hazardous terrain. A creature that moves on the ground through the area takes 1 fire damage for every square of that area it moves into.”: a GM control (target, number of squares) dealing the item's damage (+1 per 2 ranks) once per square | Wildfire |
| “Each time you sustain this spell, the radius of the burst increases by 5 feet.”: each Sustain widens the region | Wildfire |

**Kept strict (tests):** it isn't read with any of these changes:
- other per-square damage;
- an added condition on the growth;
- a heightening that doesn't raise both damages;
- added difficult terrain;
- an added bonus.

## Coverage

**Census:** **586 enabled**, up from 585.
- The b188 corpus diff against b187 changed only Wildfire.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 702/702 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-105-live-results.json), case `cr1Batch105`. The cast was at rank 3 with a level 5 caster (PF2e clamps an NPC's spell rank to its level):
- **When cast:** no save was asked.
- **Hazard control:** a creature moving into 3 squares took 2 fire three times (6 lost).
- **Sustain:** the region grew from 10 to 15 feet.
- **Turn end:** a creature ending its turn in the burst got a turn-end exposure, failed and took persistent `2` fire.

The first run used a level 1 caster, so the persistent damage was 1; the harness now raises the caster's level. No combats or `PFTEST` regions were left.
