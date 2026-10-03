# Cantrip / rank 1 batch 61 — Creative Splash

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Roll [[/r 1d4]] to determine the color of the illusion. Each creature in the area must succeed at a Will save or take the effect listed on the table for the color.” and the table's four rows: read as degree rows. The card rolls 1d4 once for the cast, and each creature gets only that color's condition, at its failure or critical-failure value and lifetime | Creative Splash (1) |
| Frightened 1 / 2 (Yellow) with no lifetime: PF2e's own rule ends it | Creative Splash |
| The spell's “varies” duration: each row's conditions carry their own lifetimes | Creative Splash |

**Kept strict (tests):**
- Two colors with the same condition aren't read.
- A condition PF2e doesn't end itself, without a lifetime, isn't read.
- A missing result number isn't read.
- A save sentence that isn't the item's save isn't read.

## Coverage

**Census:** **543 enabled**, up from 542.
- The b144 corpus diff against b143 changed only Creative Splash.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 614/614 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-61-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch61`:
- **A fixed roll of 3 (Yellow):**
  - The succeeding creature: nothing.
  - The failing creature: Frightened 1.
  - The critically failing creature: Frightened 2.
- **A fixed roll of 1 (White):** Dazzled for 1 round on a failure and for 1 minute on a critical failure.
- **The card's own roll:** it rolled a 4 in the first run and a 2 in the second. The failing creature got only that result's condition (Clumsy 1, then Enfeebled 1).
- **The card lines:** “1d4: 3 — Yellow: frightened”, “1d4: 1 — White: dazzled”, “1d4: 2 — Red: enfeebled”.

The case ran twice, before and after the card label was added. Both runs passed.

**Regressions:** `rank1Batch5` (Temporal Distortion, the rolled-condition route) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b144
node tools/diff-compiled-plans.mjs /tmp/phase23-b143/official-spell-compiler-report.json /tmp/phase23-b144/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b144/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch61`, then `cleanup`.
