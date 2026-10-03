# Cantrip / rank 1 batch 83 — Soul Siphon

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You gain temporary Hit Points equal to the total amount of HP the target loses, including the HP lost from becoming Drained.”: the target's Hit Points before the damage less those after its row. PF2e lowers current Hit Points for Drained at once (checked live: level 3, Drained 1 → −3), so the difference includes both | Soul Siphon (1) |
| The same sentence states no duration: the temporary HP are an unlimited Effect (until used) | Soul Siphon |

The rows are unchanged: unaffected, half, full with Drained 1, double with Drained 2.

**Kept strict (tests):**
- Other wording (“excluding”, “takes”, “twice”) isn't read.
- Two durations aren't read.
- The measure without Drained in the rows is refused.
- A missing duration without this measure is refused.

## Coverage

**Census:** **565 enabled**, up from 564.
- The b166 corpus diff against b165 changed only Soul Siphon (route false → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 658/658 tests pass. `test/cantrip-rank-1-batch-59.test.js` holds the new cases. `test/damage-benefit.test.js` now uses a changed Soul Siphon wording as its uncompiled-benefit example.

[Live evidence](phase-cantrip-rank-1-batch-83-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch83`:
- **Failure (level 3 target):** 3 damage, Drained 1, 6 HP lost. The caster gained 6 temporary HP on an unlimited Effect, and the card said “Hit Points lost (damage and Drained)” and “until used”.
- **Success:** the roll was 1, so half is 0 HP lost. There was no Drained and no temporary HP.

**Regressions:** `cr1Batch82` passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b166
node tools/diff-compiled-plans.mjs /tmp/phase23-b165/official-spell-compiler-report.json /tmp/phase23-b166/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b166/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch83`, then `cleanup`.
