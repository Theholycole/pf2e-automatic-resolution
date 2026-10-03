# Cantrip / rank 1 batch 43 — Equal Footing

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Target “1 creature with a land Speed greater than yours”: PF2e's land Speeds are compared when the saves are prepared, and a creature that isn't faster is ineligible | Equal Footing (1) |
| Success: “The target is Clumsy 1 and takes a –10-foot status penalty to all its Speeds until the end of your next turn.”: PF2e's success Effect (all-speeds −10, Clumsy granted, 1 round to the end of your turn), carrying the Clumsy | Equal Footing |
| Failure / critical failure: “The target is clumsy 1 (Clumsy 2) and takes a –15-foot status penalty to all its Speeds for 1 minute. During this time, it can't benefit from bonuses to its Speeds or take other penalties to its Speeds.”: PF2e's degree-choice Effect, preset to the degree. It has all-speeds −15, Clumsy granted (badge 2 on a critical failure) and an AdjustModifier suppressing every other Speed modifier, for its own stated minute | Equal Footing |

**Kept strict (tests):** another Speed value, another Clumsy value, or a changed suppression sentence isn't proved.

## Coverage

**Census:** **525 enabled**, up from 524.
- The b126 corpus diff against b125 changed only Equal Footing.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 592/592 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-43-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch43`:
- **Eligibility:** the caster's land Speed was 25. The three 40-foot creatures were eligible and the 25-foot one wasn't.
- **Success:** Clumsy 1, Speed 30, and the Effect lasting 1 round to a turn's end.
- **Failure:** Clumsy 1, Speed 25, and the Effect lasting 1 minute.
- **Critical failure:** Clumsy 2 and Speed 25.
- **No double Clumsy:** it came only from PF2e's in-memory grants; the module stored none.

The first attempt expected stored Clumsy items, but PF2e grants these in memory; the check was corrected and the case re-run.

**Regressions:** `degreeChoiceAndRift` (Distracting Decoy, Ill Omen) passed in the same session. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b126
node tools/diff-compiled-plans.mjs /tmp/phase23-b125/official-spell-compiler-report.json /tmp/phase23-b126/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b126/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch43`, then `cleanup`.
