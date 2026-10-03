# Cantrip / rank 1 batch 143 — Inside Ropes

2026-09-28. This replaces the Effect + note route.

| Rule | Spell |
| --- | --- |
| An Effect on the caster for 10 minutes: a Climb note (half distance, minimum 5 feet); on a critically failed Climb, the module rolls the DC 5 flat check to prevent the fall; from rank 3, the linked Effect's +1 item bonus to Climb. Other climbers and the ending conditions are notes | Inside Ropes (cantrip) |

**Kept strict (tests):** it isn't read with any of these changes:
- minimum 10 feet;
- a +2 bonus that doesn't match the Effect's +1;
- an added AC bonus;
- a number in the narration.

## Coverage

**Census:** **648 enabled**, up from 647.
- The b226 diff changed only Inside Ropes.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 754/754 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-143-live-results.json), case `cr1Batch143`, in the `pftest` world.
- **Rank 1:** a 10-minute Effect. A Climb check critically failed, and the module rolled the DC 5 flat check once (it failed, so the fall happens). The check carried the spell's note and no bonus.
- **Rank 3:** recasting replaced the Effect (1 left). A Climb check got the +1 item bonus; a plain Athletics check didn't, and triggered no flat check.
- **Cleanup:** fixtures removed, and no combats left.
