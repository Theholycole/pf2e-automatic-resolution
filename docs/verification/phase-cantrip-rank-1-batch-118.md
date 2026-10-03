# Cantrip / rank 1 batch 118 — Murmuration

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| The hex waits on its target (sustained 1 minute); each move closer to the designated creature (once a round; the GM's) opens its Will save | Murmuration (cantrip) |
| Success / failure: half / full `(rank)d4` of the type the caster picks (piercing or sonic; the text's damage, a data note) | Murmuration |
| Critical failure: `(rank)d4` sonic and `(rank)d4` piercing, and PF2e's Effect: −2 status on its next attack roll or skill check this round (data note: any skill check) | Murmuration |
| The designated creature: a note on the marker | Murmuration |

**Kept strict (tests):** it isn't read with any of these changes:
- no once-a-round limit;
- another penalty;
- an added condition;
- another critical heightening.

## Coverage

**Census:** **599 enabled**, up from 598.
- The b201 corpus diff against b200 changed only Murmuration.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 727/727 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-118-live-results.json), case `cr1Batch118`:
- **Failure:** `1d4 sonic` (2 lost).
- **Critical failure:** `(rank)d4 sonic + (rank)d4 piercing` (7 lost), and the Effect `FlatModifier −2`.

**Regression (`cr1Batch112`, Pact Broker):**
- **First rerun:** failed in the harness. It corrected the accepted target's degree to success before answering the “accepted?” question, and the adjustment maps the originally rolled result. That time the roll was a critical success, which stays a success.
- **Fix and reruns:** the case now checks that the final result is one degree worse than the roll. It passed twice.
