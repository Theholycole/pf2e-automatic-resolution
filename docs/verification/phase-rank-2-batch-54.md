# Rank 2 batch 54 — Thermal Remedy

2026-10-01. Follows the user's decision of 2026-10-01: an Effect + note spell counts once the module covers what PF2e's Effect doesn't.

| Spell | Now |
| --- | --- |
| Thermal Remedy (2) | The caster targets the creatures who partake (up to 10, the text's number) and picks the benefit once for all of them: one at 2nd, two different ones from 4th, none to pick at 7th (all three). PF2e's Effect goes on each creature with its ChoiceSets preset to the pick, so no creature is prompted. The values are PF2e's, proved against the text at every rank: 5/10/15 temporary Hit Points, fire resistance 2/3/5, +1/+2/+3 circumstance to saves against disease. The duration is 1 hour, 2 hours from 4th, and 8 hours from 7th. |

## Rules

- **`effect-note-proof.js`:**
  - A chosen-benefit list is proved as a whole. That covers the "Choose one of the benefits listed below." sentence, the consumers sentence, the "Up to N creatures can partake" limit, and the "Gain …" items.
  - It also covers the heightened entries, which raise the number of benefits (two, then all) and give each benefit's new value and the duration.
  - PF2e's Effect must be exactly:
    - a ChoiceSet below the all-benefits rank;
    - a second ChoiceSet, from the two-benefits rank, that excludes the first pick;
    - one rule per benefit, predicated on its choice or the all-benefits rank, whose value matches the text at every rank from 2 to 10.
  - `ruleValueAt` reads PF2e's `ternary(…)`.
  - Before such a list, an opening sentence that states no rule is narration.
  - The proof sets the recipient (the targeted creatures) and their limit (`targetLimit`).
- **Runtime:** the Effect + note executor asks for the benefits once (exactly as many as the rank gives, all different). It presets PF2e's ChoiceSets on every recipient, and refuses more targets than `targetLimit`.

## Tests

899/899 pass. `test/rank-2-batch-54.test.js` is new. It checks:
- the plan (the picks by rank, the choices, the flags and the limit);
- that a changed value or benefit count isn't proved, and that a changed limit is read.

A whole-corpus compile (b308 → b309) changed only Thermal Remedy.

## Coverage

**Census:** **1131 enabled**, up from 1130. Rank 2: 217 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-54-live-results.json), case `rank2Batch54`, in the `pftest` world (two character creatures).
- **At 2nd, fire resistance:** "Spell Effect: Thermal Remedy (Fire Resistance)", 1 hour. Fire resistance 2, no temporary Hit Points, no disease bonus.
- **At 4th, temporary Hit Points and the disease bonus:** 2 hours. 10 temporary Hit Points, +2 against disease, no fire resistance.
- **At 7th, no pick:** 8 hours. 15 temporary Hit Points, fire resistance 5, +3 against disease.
- **Both creatures** got the same Effect at each rank.
- **Note:** the first runs read PF2e's deferred disease modifier without testing its predicate. The case now tests it.
- **Cleanup:** fixtures removed.
