# Cantrip / rank 1 batch 112 — Pact Broker

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| The hex waits on its target (sustained, 1 minute); each hostile action against the caster or an ally is an Ongoing control that opens the target's Will save | Pact Broker (cantrip) |
| “If they accepted the offer and then take a hostile action …, … treat the result as one category worse.”: the GM's per-target question on the save card | Pact Broker |
| Failure: 2d4 mental (+1d4 a rank) and PF2e's Effect preset to −1; critical failure: −2. PF2e's Effect applies to all attack and damage rolls for 1 minute (data note) | Pact Broker |
| “Regardless of the outcome, the target is then temporarily immune for 1 minute.”: immunity after the triggered save | Pact Broker |
| The caster's −1 Deception penalty to Lie to a peaceful target: a note on the marker | Pact Broker |

**Kept strict (tests):** it isn't read with any of these changes:
- two categories worse;
- an added condition with the immunity;
- a different penalty for the caster;
- another qualifier;
- an added condition on the critical failure.

## Coverage

**Census:** **593 enabled**, up from 592.
- The b195 corpus diff against b194 changed only Pact Broker.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 715/715 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-112-live-results.json), case `cr1Batch112`:
- **Refused, failure:** 7 mental, the Effect at −1 (`Spell Effect: Pact Broker (Failure)`), and immunity. A second hostile action found it immune.
- **Accepted, rolled success:** the GM's “yes” made it a failure: 7 mental, −1, and immunity.

**Regressions:** `rank1Batch3` (held triggers: Needle of Vengeance, Forbidden Thought) and `rank1Batch4` (flag penalties: Draw Ire, Appeal to Authority) passed.
