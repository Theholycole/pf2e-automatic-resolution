# Cantrip / rank 1 batch 144 — Flashy Disappearance

2026-09-28. This replaces the Effect + note route.

| Rule | Spell |
| --- | --- |
| PF2e's Effect on the caster (Invisible, +2 status to Hide). After the Stride, the card's **Hide** rolls Stealth with the Hide option against each non-allied observer's Perception DC (Hidden to those it meets; PF2e's Hidden when it meets all). The Effect then ends. **No cover** just ends it | Flashy Disappearance (rank 1) |

**Kept strict (tests):** it isn't read with any of these changes:
- +3 (the Effect has +2);
- "Stride twice";
- an added AC bonus;
- "cover" only.

## Coverage

**Census:** **649 enabled**, up from 648.
- The b227 diff changed only Flashy Disappearance.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 755/755 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-144-live-results.json), case `cr1Batch144`, in the `pftest` world.
- **Hide (in combat):**
  - The caster was Invisible with the Effect.
  - The Stealth check carried the enabled +2 status bonus, and its total was 21.
  - The only observer was the foe, a combatant with DC 10, so the result was Hidden and the caster got PF2e's Hidden condition.
  - The Effect and Invisible ended.
- **No cover:** the Effect and Invisible ended, the caster wasn't Hidden, and the card says the caster is Observed.
- **A first run out of combat** listed every leftover scene token as an observer, which led to the combat-first rule.
- **Cleanup:** fixtures removed, and no combats left.
