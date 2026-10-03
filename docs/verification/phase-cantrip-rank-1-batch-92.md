# Cantrip / rank 1 batch 92 — Weaken Earth

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “A target with a Fortitude modifier can attempt a Fortitude saving throw, negating the effect on a success.”: the rows are unaffected on a success, and the effect on a failure or critical failure | Weaken Earth (1) |
| “If the target lacks Hardness, it gains weakness 3 to physical damage.”: PF2e's Effect (Weakness physical, 3 at 1st rank, 6 at 3rd) on the failing rows | Weaken Earth |
| “If your target has Hardness, … decreasing the Hardness by 5, to a minimum of 0.” and its Heightened step: a GM reminder (exclude such a creature and lower its Hardness) | Weaken Earth |
| Target “1 creature, unattended object, or hazard or structure made of stone or earth”: the GM confirms a creature is made of stone or earth; objects are the GM's | Weaken Earth |

**Kept strict (tests):**
- Another weakness value isn't read.
- Another weakness type isn't read.
- Another save wording isn't read.
- Narration with damage isn't read.
- The weakness proof needs the rank.
- An extra rule on the Effect is refused.

## Coverage

**Census:** **573 enabled**, up from 572.
- The b175 corpus diff against b174 changed only Weaken Earth (route → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 676/676 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-92-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch92`:
- **1st rank:** the GM confirmed both targets. The successful one got no weakness, and the failing one got weakness 3 to physical. The card showed the Hardness reminder.
- **3rd rank:** a failing target got weakness 6.

**Regressions:** `cr1Batch91` passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b175
node tools/diff-compiled-plans.mjs /tmp/phase23-b174/official-spell-compiler-report.json /tmp/phase23-b175/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b175/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch92`, then `cleanup`.
