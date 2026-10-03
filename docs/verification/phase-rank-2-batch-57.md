# Rank 2 batch 57 — Clawsong

2026-10-01. Follows the user's decision of 2026-10-01: the text over mismatched PF2e data, by ruleOverrides or added rules.

| Spell | Now |
| --- | --- |
| Clawsong (2) | PF2e's Effect goes on the target, which must have an unarmed claw (a weapon with the claw base). The claw gains versatile P (PF2e's rule), and gains deadly d8 if it already had versatile P (PF2e's rule, read before versatile P is added). Its damage becomes 1d6 slashing, or 1d8 if it already dealt 1d6 slashing. One target at 2nd; up to 6 from 4th. |

## Text over data

PF2e's Effect raises any claw die up to d6 by one step and keeps its damage type. So a 1d6 piercing claw became 1d8 piercing, where the text says 1d6 slashing.

The module removes that rule (a ruleOverride). When cast, it writes rules for each of the recipient's claws, by item id: damage type slashing, one die, and d8 if that claw already dealt 1d6 slashing, else d6.

PF2e's item alterations see each other's changes, so a fixed predicate can't express "already 1d6 slashing". A first try changed the type only at the damage roll. That kept the damage right, but PF2e then dropped versatile P from a piercing claw, because the weapon's own type was still piercing. The type is now altered on the item itself.

## Rules

- **`effect-note-proof.js`:**
  - `proveStrikeUpgrade` takes the three claw sentences together. It checks PF2e's two AdjustStrike rules (and their order) and the upgrade it replaces.
  - It produces `strikeUpgrade`, the removal override, and `targetStrike`.
  - "The spell can affect up to 6 willing creatures with unarmed claw Strikes." gives `targetsByRank`.
- **`spell-note.js`:** a sentence about a creature's own attack dice ("The target's claw attack … deals 1d6 slashing damage.") no longer makes the spell count as dealing damage. The whole-corpus compile changed only Clawsong.
- **`caster-resolved-rules.js`:** `strikeUpgradeRules`.
- **Runtime:**
  - The target limit comes from `targetsByRank`.
  - A target without a claw weapon is refused.
  - The claw rules are added per recipient.

## Tests

905/905 pass. `test/rank-2-batch-57.test.js` is new. It checks:
- the plan and the per-claw rules (d6 slashing → d8; d6 piercing and d4 slashing → d6, all slashing);
- that another die, type or trait isn't proved.

A whole-corpus compile (b311 → b312) changed only Clawsong.

## Coverage

**Census:** **1134 enabled**, up from 1133. Rank 2: 220 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-57-live-results.json), case `rank2Batch57`, in the `pftest` world (character targets).
- **Refused:** two targets at 2nd, and a creature without a claw.
- **At 4th, three targets:**

| Claw | Before | After |
| --- | --- | --- |
| 1d4 slashing | 1d4 slashing | 1d6 slashing, versatile P |
| 1d6 slashing, versatile P | 1d6 slashing | 1d8 slashing, deadly d8 |
| 1d6 piercing | 1d6 piercing | 1d6 slashing, versatile P |

- **Cleanup:** fixtures removed.
