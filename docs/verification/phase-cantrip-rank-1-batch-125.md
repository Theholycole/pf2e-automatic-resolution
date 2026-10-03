# Cantrip / rank 1 batch 125 — Trickster's Mirrors

2026-09-28. The user took the recommendations: option (A).

| Rule | Spell |
| --- | --- |
| Mirrors on the caster: start 1, +1 each Sustain, at most 3. When an attack would hit, the stated odds are rolled (1–3 on 1d6, 1–2 on 1d6, 1 on 1d4 hit you), and an image that's hit is destroyed. A non-critical miss breaks one, and an attacker within 5 feet takes 1d4 mental (+1d4 a rank) with a basic Will save. Area damage in the space destroys them all | Trickster's Mirrors (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- odds that don't match their die;
- a different maximum;
- other damage;
- an added condition;
- a heightening that doesn't match the item's.

## Coverage

**Census:** **606 enabled**, up from 605.
- The b208 corpus diff against b207 changed only Trickster's Mirrors.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 735/735 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-125-live-results.json), case `cr1Batch125`, in the `pftest` world. There were two attackers, one 5 feet and one 30 feet from the caster.
- **The marker:** “Trickster's Mirrors (mirrors: 1)”. The Sustains gave 2, 3, 3 (capped).
- **Odds rolls** (real rolls, each consistent with the odds):

  | Mirrors | Roll | Result | Mirrors left |
  | --- | --- | --- | --- |
  | 3 | 1d4 = 2 | hits a mirror | 2 |
  | 2 | 1d6 = 1 | hits the caster | 2 |
  | 2 | 1d6 = 4 | hits a mirror | 1 |
  | 1 | 1d6 = 4 | hits a mirror | 0 |

- **A miss by the far attacker** (30 feet): a mirror broke, and there was no save card.
- **A miss by the near attacker** (5 feet): a mirror broke, and the basic Will save card opened. On a failure, the attacker took `1d4 mental` = 2 (2 lost).
- **Area damage:** the count went to 0; the next attack roll hit the caster. The marker read “(mirrors: 0)”, and the record stayed active until ended.
- **Cleanup:** fixtures removed.

**Correction (2026-09-28, batch 127):** the speed check did not pass for this batch; the Coverage line above is wrong about it. The check failed on “Manifest Will: full-family route expectation”: batch 120 recorded Manifest Will, whose route is the Effect + note, and the test expected every audited batch spell to gain a save route. The pipeline only searched the output for a passing line, so the failure printed nothing. The escape and rule-family checks were unaffected. Batch 127 fixed the test (see its [verification](phase-cantrip-rank-1-batch-127.md)), and it now passes. This batch's `.sha256` manifest predates this note.
