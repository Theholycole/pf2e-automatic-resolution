# Cantrip / rank 1 batch 154 — rank-gated choices, a shape's time, a first-Strike toggle

2026-09-28. User decision (the text over PF2e's data).

| Spell | PF2e | Now |
| --- | --- | --- |
| Untamed Shift | Extra choices at caster level 6 and 10 | At cast rank 6 and 10 |
| Untamed Form | Every shape lasts 1 minute | Pest Form shapes last 10 minutes |
| Gravity Weapon | A toggle the player switches | On at cast, off after the first weapon Strike's damage, on again each round |

## Tests

766/766 pass, including `toggleUsed` and the structured plan fields.

## Coverage

**Census:** **655 enabled** (unchanged).
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-154-live-results.json), case `cr1Batch154`, in the `pftest` world. It uses a level-1 druid character with PF2e's Untamed Form feat and a club.
- **Untamed Form:** Pest Form was the only shape (chosen automatically), and the Effect lasts 10 minutes.
- **Untamed Shift:** 1 ChoiceSet at rank 1, and 2 at rank 6.
- **Gravity Weapon:** on at cast, off after the club's damage roll, and on again at the next combat round.
- **Cleanup:** fixtures removed, and no combats left.
