# Cantrip / rank 1 batch 150 — Frenzied Revelry

2026-09-28. This replaces the Effect + note route.

| Rule | Spell |
| --- | --- |
| A 1-minute emanation centred on the caster (5 feet; 10 at 4th, 15 at 7th). The caster and allies inside hold PF2e's Effect (+1/+2/+3 status to saves against mental effects), and leaving removes it. A holder's critical success at a save against an enemy's mental effect adds PF2e's critical Effect (+1 status to attacks and damage, 1 round). Data note: PF2e's bonus covers Will saves only | Frenzied Revelry (rank 1) |

**Kept strict (tests):** it isn't read with any of these changes:
- +2 base (the Effect gives +1);
- +3 at 4th (the Effect gives +2);
- added temporary HP;
- all creatures instead of allies.

## Coverage

**Census:** **655 enabled**, up from 654.
- The b233 diff changed only Frenzied Revelry.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 761/761 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-150-live-results.json), case `cr1Batch150`, in the `pftest` world.
- **Cast:** a 5-foot radius. The caster and the adjacent ally held the Effect; the far ally and the adjacent enemy didn't.
- **The rider:** the caster's Will save against a mental effect carried the enabled +1. A critical success against an enemy's mental effect added the critical Effect for 1 round.
- **Leaving:** the ally moved out and lost the Effect; the caster kept it.
- **Cleanup:** fixtures removed, and no combats left.
