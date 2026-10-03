# Cantrip / rank 1 batch 122 — Grasping Vine

2026-09-28. The user took the recommendations: option (A).

| Rule | Spell |
| --- | --- |
| A Reflex save against a Medium-or-smaller creature the GM confirms is on the ground. Grabbed with the Escape end (success: until the end of your next turn). The vine's AC/HP ending the spell, the Sustain Reposition (5 feet), the critical-failure Reposition (10 feet) and the object branch are GM notes | Grasping Vine (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- damage beside the vine's AC and Hit Points;
- damage added to the Sustain Reposition;
- a penalty instead of the critical-failure Reposition;
- damage added to the object branch;
- a target without “currently on the ground”, which doesn't get the ground question.

## Coverage

**Census:** **603 enabled**, up from 602.
- The b205 corpus diff against b204 changed only Grasping Vine.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 732/732 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-122-live-results.json), case `cr1Batch122`, in the `pftest` world. There were four targets: three Medium, one Large.
- **Eligibility:** the Large creature was refused (`[true,true,true,false]`). Each Medium creature got the “on the ground” question, answered yes.
- **Success:** Grabbed with an Escape end, for 1 round (to the end of the caster's next turn).
- **Failure and critical failure:** Grabbed with an Escape end, lasting as long as the spell (1 minute).
- **The card:** it showed the vine's AC 15 and 10 Hit Points, the 5-foot and 10-foot Repositions, and the object-branch reminder.
- **Cleanup:** 14 fixture actors and 4 journals removed; no fixtures left.

**Correction (2026-09-28, batch 127):** the speed check did not pass for this batch; the Coverage line above is wrong about it. The check failed on “Manifest Will: full-family route expectation”: batch 120 recorded Manifest Will, whose route is the Effect + note, and the test expected every audited batch spell to gain a save route. The pipeline only searched the output for a passing line, so the failure printed nothing. The escape and rule-family checks were unaffected. Batch 127 fixed the test (see its [verification](phase-cantrip-rank-1-batch-127.md)), and it now passes. This batch's `.sha256` manifest predates this note.
