# Cantrip / rank 1 batch 138 — Illusory Disguise, Swear Oath, Forbidding Ward

2026-09-28. This continues the push to 100%.

| Rule | Spell |
| --- | --- |
| PF2e's Impersonate modifiers (+4 status and level) on the target; the appearance rules and the ignored dissimilar-creature penalty are GM notes; Dismiss | Illusory Disguise (1) |
| PF2e's toggle on the caster; Ready, the 1-action casting and the Focus Point are notes | Swear Oath (1) |
| PF2e's Effect on the ally, marking the enemy token | Forbidding Ward (cantrip) |

**Kept strict (tests):** it isn't read with any of these changes:
- +2 instead of +4 (this first passed, so value checks were added to the disguise, Figment and Read Aura forms);
- added damage;
- added damage rolls;
- +3 on Figment or Read Aura.

## Coverage

**Census:** **642 enabled**, up from 639.
- The b221 diff changed only these three.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 749/749 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-138-live-results.json), case `cr1Batch138`, in the `pftest` world.
- **Illusory Disguise:** the target's Deception modifier to Impersonate went from 0 to 5 (+4 status and level 1); plain Deception stayed 0.
- **Swear Oath:** the caster got the Effect.
- **Forbidding Ward:** the ally got the Effect, and its TokenMark is the enemy's token; the enemy got nothing.
- **Cleanup:** fixtures removed.
