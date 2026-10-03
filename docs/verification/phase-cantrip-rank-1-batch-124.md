# Cantrip / rank 1 batch 124 — Shattering Gem

2026-09-28. The user took the recommendations: option (A).

| Rule | Spell |
| --- | --- |
| A gem Hit Point pool on the target: 5, plus 5 a rank. The Ongoing “was Struck” control rolls the DC 11 flat check; on a success, the damage the target took is restored from the pool. At 0, the attacker (if within 10 feet) takes 1d8 slashing (+1d8 a rank) with a basic Reflex save, and the spell ends | Shattering Gem (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- other damage;
- a heightening that doesn't match the item's;
- a rider on the block;
- a Fortitude check instead of the flat check;
- a bonus in the narration.

## Coverage

**Census:** **605 enabled**, up from 604.
- The b207 corpus diff against b206 changed only Shattering Gem.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 734/734 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-124-live-results.json), case `cr1Batch124`, in the `pftest` world. The spell was cast at rank 2, with the attacker 5 feet from the target.
- **The marker:** “Shattering Gem (gem: 10 HP)”. Blocking before a flat check was refused.
- **Flat checks** (real rolls): 5, 2, 8 failed; 12 succeeded.
- **First block:** the target took 6. The gem absorbed 6 and 6 were restored, leaving the gem at 4 HP.
- **Second block:** after flat checks of 3, 2, then 12, the target took 7. The gem absorbed 4 and 4 were restored, and the gem shattered.
- **The burst:** the attacker's basic Reflex save card opened. On a failure it took `2d8 slashing` = 12 (12 lost).
- **After the burst:** the marker was gone, and the record ended.
- **UI:** the Ongoing overview showed “Shattering Gem: … gem ward was Struck (gem 5 HP; target the attacker)”.
- **Cleanup:** fixtures removed.

**Correction (2026-09-28, batch 127):** the speed check did not pass for this batch; the Coverage line above is wrong about it. The check failed on “Manifest Will: full-family route expectation”: batch 120 recorded Manifest Will, whose route is the Effect + note, and the test expected every audited batch spell to gain a save route. The pipeline only searched the output for a passing line, so the failure printed nothing. The escape and rule-family checks were unaffected. Batch 127 fixed the test (see its [verification](phase-cantrip-rank-1-batch-127.md)), and it now passes. This batch's `.sha256` manifest predates this note.
