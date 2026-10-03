# Cantrip / rank 1 batch 147 — Spirit Ward

2026-09-28. This replaces the Effect + note route.

| Rule | Spell |
| --- | --- |
| The action count sets the recipients: 1 touches one creature, 2 targets one within 30 feet, 3 wards the caster and allies in a 30-foot emanation. PF2e's Effect goes on each with the count selected (+1 status to saves, or +2 for a living target at 2 actions). The cast is sustained, up to 1 minute. Data note: PF2e's bonus covers every spell | Spirit Ward (rank 1) |

**Kept strict (tests):** it isn't read with any of these changes:
- +2 base (the Effect gives +1);
- +3 living (the Effect gives +2);
- all creatures instead of allies;
- added temporary HP.

## Coverage

**Census:** **652 enabled**, up from 651.
- The b230 diff changed only Spirit Ward.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 758/758 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-147-live-results.json), case `cr1Batch147`, in the `pftest` world.
- **2 actions:**
  - An ally 50+ feet away was refused ("beyond 30 feet").
  - The ally 20 feet away got the Effect, and its Will save against a spell carried the enabled +2 status bonus (living).
- **1 action:** the ally 20 feet away was refused ("beyond touch").
- **3 actions:**
  - The caster and the near ally got the Effect. The enemy and the far ally didn't.
  - The ally's spell save carried +1.
  - The Ongoing record is sustained.
- **Cleanup:** fixtures removed, and no combats left.
