# Cantrip / rank 1 batch 142 — Practice Makes Perfect

2026-09-28. This replaces the Effect + note route.

| Rule | Spell |
| --- | --- |
| A reaction on a failed skill check: +2 status (+3 at master or better) to the triggering check, replacing a smaller status bonus, and the check is re-graded. PF2e's Effect (for later checks) isn't applied | Practice Makes Perfect (rank 1) |

**Kept strict (tests):** it isn't read with an added clause (1d6 temporary Hit Points). The re-grade is tested with no existing bonus, a smaller one (+1 → adds 1) and a larger one (+3 → adds 0), and with natural 20 and 1.

## Coverage

**Census:** **647 enabled**, up from 646.
- The b225 diff changed only Practice Makes Perfect.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 753/753 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-142-live-results.json), case `cr1Batch142`, in the `pftest` world.
- **A failed check:** an Athletics check of 14 against DC 60 was re-graded to 16 (+2 added), still a critical failure.
- **A check that didn't fail** (17 against DC −20) was refused with a clear message.
- **Cleanup:** fixtures removed.
