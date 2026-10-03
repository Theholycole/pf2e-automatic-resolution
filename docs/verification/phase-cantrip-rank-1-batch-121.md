# Cantrip / rank 1 batch 121 — Dancing Blade, Spirit Object

2026-09-28. The user took the recommendations: option (A) for both.

| Rule | Spell |
| --- | --- |
| A spell attack of 3d6 (+1d6 per 2 ranks) on cast and on each Sustain; the weapon's physical type picked each attack; Change Partners and the multiple attack penalty are notes | Dancing Blade (cantrip) |
| A melee spell attack of 2d4 (+2d4 a rank) when commanded on a Sustain; bludgeoning, piercing or slashing picked each attack; movement, recasting and Dismiss are notes | Spirit Object (cantrip) |

**Kept strict (tests):** it isn't read with any of these changes:
- an added condition;
- another heightening;
- other dice;
- an added bonus.

## Coverage

**Census:** **602 enabled**, up from 600.
- The b204 corpus diff against b203 changed only these two.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 731/731 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-121-live-results.json), case `cr1Batch121`, plus a click on the source card:
- **Dancing Blade at rank 5:** `5d6 slashing` (11 lost), then `5d6 piercing` (25 lost).
- **Spirit Object:** `2d4 slashing`, then `2d4 piercing`.
- **Dancing Blade's source card:** it showed “Resolve Spell Attack”, then “Sustain: Attack (2)” after the first attack, with a 1-minute window.

**Correction (2026-09-28, batch 127):** the speed check did not pass for this batch; the Coverage line above is wrong about it. The check failed on “Manifest Will: full-family route expectation”: batch 120 recorded Manifest Will, whose route is the Effect + note, and the test expected every audited batch spell to gain a save route. The pipeline only searched the output for a passing line, so the failure printed nothing. The escape and rule-family checks were unaffected. Batch 127 fixed the test (see its [verification](phase-cantrip-rank-1-batch-127.md)), and it now passes. This batch's `.sha256` manifest predates this note.
