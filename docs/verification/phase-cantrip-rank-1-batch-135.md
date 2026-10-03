# Cantrip / rank 1 batch 135 — Magic Stone, Object Memory, Untamed Form, Muscle Barrier

2026-09-28. This continues the push to 100%. These four were on the Effect + note route.

| Rule | Spell |
| --- | --- |
| PF2e's sling alterations on the carrier (the caster or a willing ally); the stone count and single use are GM notes | Magic Stone (1) |
| PF2e's weapon proficiency Effect on the caster; the tool branch is a GM note | Object Memory (1) |
| PF2e's form choice on the caster; the 10-minute Pest Form shapes are a data note | Untamed Form (1) |
| PF2e's temporary HP and Athletics Effect on the willing creature; removing the thrall is a data note | Muscle Barrier (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- added damage on the stones or the thrall;
- an added teleport.

An older test's Effect + note example is now Figment.

## Coverage

**Census:** **632 enabled**, up from 628.
- The b218 diff changed only these four.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 745/745 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-135-live-results.json), case `cr1Batch135`, in the `pftest` world.
- **Magic Stone:** the caster, targeting itself, got the Effect.
- **Object Memory:** PF2e selected the caster's one weapon without a prompt; the Effect is on the caster.
- **Untamed Form:** the caster got the Effect.
- **Muscle Barrier:** the ally got the Effect and 10 temporary HP; the caster got nothing.
- **Cleanup:** fixtures removed.
