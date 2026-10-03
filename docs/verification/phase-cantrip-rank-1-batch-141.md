# Cantrip / rank 1 batch 141 — Manifest Will (user decision: build it properly)

2026-09-28. This replaces the batch 120 Effect + note route.

| Rule | Spell |
| --- | --- |
| PF2e's Aura on the caster. At each creature's turn start in the 10-foot emanation (the caster's too), PF2e's Spell Effect with the caster's tradition goes on the creatures that tradition names: arcane any, divine living or undead, occult allies (Lesser Cover), primal any (−10 Speed, ended by an Escape). The caster's concealment is a GM note | Manifest Will (cantrip) |

**Kept strict (tests):** it isn't read with any of these changes:
- weakness 2;
- 3 temporary HP;
- −5 feet;
- a non-allied occult;
- an added AC bonus.

**Found live:**
- **Sustain:** without it, the record ends at the caster's first turn end (correct). The case now Sustains.
- **The token pile:** the case first stacked its tokens on older suites' tokens (moves outside the scene fail), so every token was inside. It now uses a clear corner.
- **Cover:** PF2e's Cover grant asks for a level; the module now creates the Cover Effect itself with lesser selected.

## Coverage

**Census:** **646 enabled**, up from 645.
- The b224 diff changed only Manifest Will.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 752/752 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-141-live-results.json), case `cr1Batch141`, in the `pftest` world, in combat. No PF2e prompts appeared.
- **Primal:**
  - The ally, the enemy and (on its next turn) the caster got the Effect with primal selected and an Escape end.
  - The enemy's Speed went from 25 to 15. The far creature, 20 feet out, got nothing.
  - A scripted Escape at the spell DC removed the enemy's Effect. The record stayed active with Sustain.
- **Occult:** the ally and the caster got the Effect, the ally gained Cover, and the enemy got nothing.
- **Arcane and divine** weren't cast live; their rules are proved at compile time (the unit test).
- **Cleanup:** fixtures removed, and no combats left.
