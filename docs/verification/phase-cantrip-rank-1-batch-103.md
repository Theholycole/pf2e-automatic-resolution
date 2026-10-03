# Cantrip / rank 1 batch 103 — Discomfiting Whispers

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Each creature that starts their turn within the area of this spell must succeed at a Will save or roll twice on their first attack roll that round and take the lower result.”: a sustained 5-foot aura around the caster. A creature starting its turn in it saves; a failure or critical failure gets PF2e's Effect (RollTwice, keep lower, attacks, removed after the roll) | Discomfiting Whispers (1) |
| “If an attack roll modified in this way results in a failure, the creature that rolled the failed attack takes 1d6 void damage.”: an Ongoing-spells control while the Effect lasts, dealing the item's damage at the cast rank (Heightened (+2) +1d6) | Discomfiting Whispers |

**Data:** PF2e's Effect ends at the end of the creature's turn (the text says “that round”). The control lasts just as long.

**Kept strict (tests):** it isn't read with any of these changes:
- other damage dice;
- “higher” instead of “lower”;
- another roll;
- an added condition;
- an added bonus.

A changed Effect rule (keep higher) is also refused.

## Coverage

**Census:** **584 enabled**, up from 583.
- The b186 corpus diff against b185 changed only Discomfiting Whispers.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 698/698 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-103-live-results.json), case `cr1Batch103`. The cast was at rank 3 (2d6):
- **When cast:** no save was asked.
- **The failing creature's turn start:** it saved with a failure and got the Effect (`RollTwice:lower:attack`).
- **Failed-attack control:** 8 was rolled and 8 lost. The control then cleared.
- **After its turn:** PF2e had removed the Effect.
- **The successful creature's turn:** it succeeded and got nothing.

No combats or `PFTEST` regions were left.
