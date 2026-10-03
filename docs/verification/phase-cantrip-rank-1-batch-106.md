# Cantrip / rank 1 batch 106 — Mushroom Patch

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “When the spell is cast and at the beginning of each round, the mushroom's release a cloud of irritating spores. Creatures in the area must attempt a Fortitude save.”: a lingering burst. Creatures inside save when it's cast and as each combat round begins | Mushroom Patch (1) |
| “The area becomes difficult terrain.”: PF2e's movement cost on the region | Mushroom Patch |
| Success: Dazzled 1 round; “If the creature moves to outside area, they can spend 1 action to rub their eyes, removing the dazzled condition.”: an Ongoing control ends it | Mushroom Patch |
| Failure: Dazzled 1 round. Critical failure: Dazzled and Slowed 1 for 1 round | Mushroom Patch |
| Heightened (3rd, 6th): range and area from PF2e's data. Heightened (9th) “Blinded instead”: refused at rank 9+ (rank gate) | Mushroom Patch |

**Kept strict (tests):** it isn't read with any of these changes:
- added damage on the trigger;
- a second condition removed by the action;
- an added bonus;
- hazardous terrain.

## Coverage

**Census:** **587 enabled**, up from 586.
- The b189 corpus diff against b188 changed only Mushroom Patch.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 704/704 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-106-live-results.json), case `cr1Batch106`:
- **Region:** it has the difficult-terrain behaviour.
- **When cast:** the success became Dazzled; the critical failure became Dazzled and Slowed.
- **Outside-action control:** the success's only control was the outside-area action. After it moved out and used it, Dazzled ended.
- **In combat:** the creature inside saved at combat start and again at round 2 (two `round-start` exposures).

**Regressions:** `cr1Batch102` (the Interact and next-action ends) passed. No combats or `PFTEST` regions were left.
