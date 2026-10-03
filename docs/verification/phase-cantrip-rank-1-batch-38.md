# Cantrip / rank 1 batch 38 — Stumbling Curse

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The target takes a -2 status penalty to Athletics and Acrobatics checks.” (success, and every lower row): a “Skill penalty” note with generated FlatModifiers (athletics, acrobatics, status −2), for the spell's sustained minute | Stumbling Curse (1) |
| “… each time the target Strides, it uses the first 5 feet of movement of the Stride to move 5 feet in a random direction (this is forced movement). This has no effect on a creature with only 5 feet of movement.” / critical failure “… you control the direction …”: a “Stumbling Strides” note the GM plays | Stumbling Curse |
| PF2e's linked Spell Effect (the same −2 on the same skills, 1 minute sustained): set aside, since the note carries the same rules | Stumbling Curse |

**Kept strict (tests):**
- A penalty that differs from the linked Effect's keeps the Effect, and the spell stays blocked.
- Other Stride wording isn't read.

## Coverage

**Census:** **520 enabled**, up from 519.
- The b121 corpus diff against b120 changed only Stumbling Curse.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 587/587 tests pass (`test/cantrip-rank-1-batch-37.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-38-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch38`:
- **Skills:** Athletics and Acrobatics went from 0 to −2 on success, failure and critical failure.
- **Notes (1 minute):** the Skill penalty on every row, and Stumbling Strides on failure and critical failure. The critical failure's says the caster controls the direction.
- **No duplicate:** no PF2e Spell Effect was also applied.

**Regressions:** `cr1Batch19` (row penalty) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b121
node tools/diff-compiled-plans.mjs /tmp/phase23-b120/official-spell-compiler-report.json /tmp/phase23-b121/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b121/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch38`, then `cleanup`.
