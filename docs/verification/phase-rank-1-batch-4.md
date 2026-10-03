# Rank 1 batch 4 — verification

2026-09-26. The fourth rank-1 batch: penalty Effects that the rows state.

## Rules and spells

| Rule | Spell |
| --- | --- |
| A degree-flag Effect whose FlatModifier the rows state (“–1 status penalty to saves against your emotion effects”, “As failure, except the status penalty is –2”), with an end-of-turn Will save on the success row that ends it | Appeal to Authority (1) |
| “the penalty” defined before the table (“against creatures other than you”); the success row's own Effect ending after the target's next turn; the degree-flag Effect for failure (−1) and critical failure (−2) | Draw Ire (1) |

### Found and fixed during the batch

PF2e starts a created Effect at its origin's initiative. Draw Ire's success Effect keeps the caster as its origin, because its rule compares attack targets with the origin's signature. So it started at the caster's initiative (30) and would have expired after the caster's turn. The live test caught this. `createNativeEffect` now sets the prepared initiative (the target's, 20) after creation.

## Coverage

**Census:** **429 enabled**, up from 427 (Phase 2: 235; Phase 3: 53).
- The b69 corpus diff against b68 changed exactly these two plans; no variant plan changed and no plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 467/467 tests pass. `test/rank-1-batch-4.test.js` covers:
- both spells' proofs: the selections, the recurring save only on the success row, and the target-turn anchor;
- refused rows: an extra rule after “the penalty”, a condition before a penalty, and an unknown qualifier.

[Live evidence](phase-rank-1-batch-4-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank1Batch4`, in combat:
- **Draw Ire:**
  - Damage was 5 / 10 / 20 of 10 for success, failure and critical failure.
  - Success: “Spell Effect: Draw Ire (Success)” (−1 against others), ending at the target's own turn end (initiative 20, value 0).
  - Failure: the degree Effect preset to −1 for 1 minute. Critical failure: preset to −2.
- **Appeal to Authority:**
  - The success target's Effect was preset to −1 with an end-of-turn Will save (DC 24). The critical failure's was preset to −2 with none.
  - At the end of the success target's turn, the module opened its end-of-turn Will save card. A success removed its Effect; the critical-failure target's Effect remained.
- **Regressions:** `degreeChoiceAndRift`, `longTailBatch4`, `rank1Batch1`, `persistentLinked` and `rank1Batch3` passed, with cleanup between them.
- Two scratch actors from a manual probe were deleted by hand. The world has no fixtures and no combats left.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b69
node tools/diff-compiled-plans.mjs /tmp/phase23-b68/official-spell-compiler-report.json /tmp/phase23-b69/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b69/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank1Batch4`, then `cleanup`.
