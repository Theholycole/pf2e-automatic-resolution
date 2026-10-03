# Cantrip / rank 1 batch 57 — Veil of Confidence

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You reduce your current Frightened condition by 1, and whenever you would become Frightened during the duration, reduce the amount by 1.”: the caster's Frightened goes down by 1 now | Veil of Confidence (1) |
| The rest of the text (the ongoing reduction, and “If you critically fail a save against fear, veil of confidence reduces your frightened value from that effect, and then ends.”): a note on the caster for the spell's minute | Veil of Confidence |

**Kept strict (tests):** different amounts in the two halves aren't read.

## Coverage

**Census:** **539 enabled**, up from 538.
- The b140 corpus diff against b139 changed only Veil of Confidence.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 607/607 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-57-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch57`:
- **Condition:** the caster had Frightened 2 and cast it; its Frightened became 1.
- **Note:** 1 minute, with the ongoing-reduction text.

**Regressions:** `cr1Batch56` (Dirge of Doom) passed. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b140
node tools/diff-compiled-plans.mjs /tmp/phase23-b139/official-spell-compiler-report.json /tmp/phase23-b140/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b140/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch57`, then `cleanup`.
