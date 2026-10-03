# Cantrip / rank 1 batch 131 — Shielded Arm

2026-09-28. The user took the recommendations: option (A), a temporary PF2e shield item.

| Rule | Spell |
| --- | --- |
| A new `temporary-shield` route. A PF2e shield item (Hardness 4, 15 Hit Points, +4 and +15 per 2 ranks; held in one hand, Bulk 0) and an Effect (1 minute) go on the willing target. PF2e's own Raise a Shield (+2 AC) and Shield Block use it. The spell ends when its Hit Points are gone; removing either removes the other | Shielded Arm (1) |

**No Broken Threshold:** PF2e 8.5 always sets a shield's Broken Threshold to half its maximum Hit Points, and a broken shield gives no AC. I probed this live: a source `brokenThreshold: 0` was replaced by 7. So the item carries twice the spell's Hit Points (30 max, threshold 15), the spell's Hit Points are those above the threshold, and the module ends the spell when the shield reaches it. A data note on the card says so.

**Kept strict (tests):** it isn't read with any of these changes:
- a status bonus;
- a stated Broken Threshold;
- an added resistance;
- a heightening that also raises the AC bonus;
- damage in the narration.

## Coverage

**Census:** **612 enabled**, up from 611.
- The b214 corpus diff against b213 changed only Shielded Arm.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 741/741 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-131-live-results.json), case `cr1Batch131`, in the `pftest` world.
- **Rank 1:** Hardness 4 and 15 HP. The shield shows 30/30 with Broken Threshold 15, isn't broken, and is the target's held shield; the Effect is present.
- **Raise a Shield** (PF2e's action): AC went from 20 to 22.
- **Shield Block:** at shield HP 20 (5 of the spell's left), both stayed. At 15 (none left), both were removed.
- **Rank 3:** Hardness 8 and 30 HP (the item's max is 60). Deleting the Effect removed the shield.
- **Cleanup:** fixtures removed, and no combats left.
