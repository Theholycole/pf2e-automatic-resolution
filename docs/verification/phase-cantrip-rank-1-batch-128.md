# Cantrip / rank 1 batch 128 — Dehydrate

2026-09-28. The user took the recommendations: option (A), the full build.

| Rule | Spell |
| --- | --- |
| The cast: 1d6 persistent fire (heightened from the item's fixed levels) with a basic Fortitude save; water and plant creatures get one degree worse (PF2e's traits). Each creature taking the persistent fire gets an Ongoing record: at the end of each of its turns, the GM confirms it didn't drink, and the additional Fortitude save opens (failure Enfeebled 1, critical failure Enfeebled 2, until the end of its next turn). The record ends when its persistent fire ends | Dehydrate (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- other dice;
- a Will additional save;
- a rider on the drink sentence;
- a different ending;
- damage in a table row.

**Test updates:** two older tests used Dehydrate as an example of text the module didn't read. They now use a variant with the additional save at the *start* of each turn, which stays unread.

## Coverage

**Census:** **609 enabled**, up from 608.
- The b211 corpus diff against b210 changed only Dehydrate.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 738/738 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-128-live-results.json), case `cr1Batch128`, in the `pftest` world. There were three creatures.

The first run set every degree by GM correction. That bypasses the degree rule, so the plant creature's success stayed a success, and I re-ran it with a real roll.

- **The cast:**
  - **dry:** set to failure; took `1d6 fire` persistent.
  - **plant:** a real roll of success, which the adjustment applied to, making it a failure. It took `1d6 fire` (full damage, not half).
  - **safe:** a critical success; no persistent damage and no record.
- **In combat:**
  - When dry's turn ended, its review asked “Did the creature consume water …?”. Answering “affected” opened the additional Fortitude save; on a failure, dry was Enfeebled 1.
  - When plant's turn ended, it had drunk: “unaffected” skipped the save, and it wasn't Enfeebled.
- **Ending:** after dry's persistent fire was removed, its record ended. The plant creature's record stayed active until ended.
- **Cleanup:** fixtures removed.
