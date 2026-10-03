# Cantrip / rank 1 batch 115 — Exchange Image

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Target “you and 1 other humanoid”: the save target must have the humanoid trait | Exchange Image (1) |
| Success / failure / critical failure: “the same effects as a 1st-rank Illusory Disguise”: PF2e's Illusory Disguise Effect on the target and on the caster, for 1 minute / 1 hour / 24 hours | Exchange Image |
| “or until Dismissed”: the caster's Dismiss ends both | Exchange Image |
| “Willing and Unconscious targets automatically critically fail this saving throw.”: a GM reminder | Exchange Image |

**Kept strict (tests):** it isn't read with any of these changes:
- another rank of the copied spell;
- an added condition;
- an added critical-failure condition;
- “fail” instead of “critically fail”.

## Coverage

**Census:** **596 enabled**, up from 595.
- The b198 corpus diff against b197 changed only Exchange Image.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 721/721 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-115-live-results.json), case `cr1Batch115`:
- **A non-humanoid:** refused.
- **The humanoid's failure:** Illusory Disguise for 1 hour on it and on the caster. Dismissing ended both.
- **Card:** it carried the reminder.
