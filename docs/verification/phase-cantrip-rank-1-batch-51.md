# Cantrip / rank 1 batch 51 — Cycle of Retribution

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Success: “The next time the target takes a hostile action, the target takes 1d4 mental damage; the spell's duration then ends.”: a “Hostile actions” note. The Ongoing control deals the damage once, then the note ends | Cycle of Retribution (1) |
| Failure: “The first time in a round when the target takes a hostile action, the target takes 1d4 mental damage.”: the same, at most once per combat round | Cycle of Retribution |
| Critical failure: “Each time the target takes a hostile action, the target takes 1d4 mental damage.”: the same, each time | Cycle of Retribution |
| “Heightened (+1) The mental damage increases by 1d4.”: dice at the cast rank | Cycle of Retribution |

The GM reports the hostile action with the Ongoing control (“Cycle of Retribution: <creature> took a hostile action”). The module rolls the spell's damage and applies it with PF2e's resistances. The notes last the spell's sustained minute and end with it.

**Kept strict (tests):**
- A tampered frequency is refused.
- Damage other than the item's entry isn't read.

## Coverage

**Census:** **533 enabled**, up from 532.
- The b134 corpus diff against b133 changed only Cycle of Retribution.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 601/601 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-51-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch51`, in combat:
- **Success:** the first hostile action dealt 4, and the note ended.
- **Failure:** the first dealt 2, and a second in the same round was refused (“already took this damage this round”). The next round dealt 3, for 5 in total.
- **Critical failure:** two hostile actions dealt 2 and 2, for 4 in total.

The first attempt's check cut the refusal message short; it was corrected and re-run.

**Regressions:** `cr1Batch36` (Wilding Word, sustained notes) passed in the same session. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b134
node tools/diff-compiled-plans.mjs /tmp/phase23-b133/official-spell-compiler-report.json /tmp/phase23-b134/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b134/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch51`, then `cleanup`.
