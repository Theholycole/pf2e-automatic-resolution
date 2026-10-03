# Cantrip / rank 1 batch 139 — Glimpse Weakness, Uplifting Overture (user decisions)

2026-09-28. The user decided:
- **Glimpse Weakness:** the Effect goes on the foe, as a special weakness to the allies' bonus damage that expires on Strike damage.
- **Uplifting Overture:** it works like Aid. The caster is asked for the skill check, then the buff goes on the ally.

| Rule | Spell |
| --- | --- |
| A weakness of 1 + rank to Strike damage on the foe, removed after the first Strike damage | Glimpse Weakness (cantrip) |
| The caster's Performance Aid check against DC 15 (failure → success; legendary → critical success); the Aid result on the ally's chosen skill for its next check | Uplifting Overture (cantrip) |

**Kept strict (tests):** it isn't read with any of these changes:
- 1d6 instead of 1;
- a critical success on a failure.

The Aid mapping is unit-tested for every degree and rank.

## Coverage

**Census:** **644 enabled**, up from 642.
- The b222 diff changed only these two.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 750/750 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-139-live-results.json), case `cr1Batch139`, in the `pftest` world.
- **Glimpse Weakness** (rank 1, weakness 2):
  - The ally's first Strike rolled 3 and the foe lost 5; the Effect was then gone.
  - The second Strike rolled 1 and the foe lost 1.
- **Uplifting Overture:**
  - The caster's Performance roll failed and became a success, so the ally got +1 circumstance to Athletics.
  - The ally's next Athletics roll removed the Effect. The harness didn't read the modifier off the roll itself.
- **Cleanup:** fixtures removed.
