# Cantrip / rank 1 batch 80 — Crushing Ground

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Reflex rows on 2d6 bludgeoning: unaffected, half, full, double | Crushing Ground (1) |
| “Failure The target takes full damage, is Off-Guard, and takes a –10-foot circumstance penalty to Speed.”: PF2e's degree Effect (Off-Guard, −10 land Speed), proved alongside the row's damage | Crushing Ground |
| “Critical Failure The target takes double damage and is off-guard and Immobilized. It can attempt to Escape against your spell DC.”: the Effect's critical failure; a successful Escape ends it. **PF2e data** note: that also ends its Off-Guard, which the text keeps | Crushing Ground |
| “If it doesn't Escape, the target takes an additional 2d6 bludgeoning damage when the spell ends.”: a note whose Ongoing control deals the damage once, heightened (+2d6 per rank) | Crushing Ground |

**Kept strict (tests):**
- Another Speed penalty isn't read.
- Another delayed die isn't read.
- A Heightened entry that doesn't raise the additional damage isn't read.

## Coverage

**Census:** **562 enabled**, up from 561.
- The b163 corpus diff against b162 made only Crushing Ground executable.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 652/652 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-80-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch80`, with a damage roll of 10:
- **Success:** lost 5.
- **Failure:** lost 10, Off-Guard, land Speed 25 → 15.
- **Critical failure:**
  - Lost 20, Off-Guard and Immobilized.
  - The no-escape control rolled `2d6 bludgeoning` (2), and the creature lost 2.
- **Card:** the data note was shown.

**Regressions:** `cr1Batch43` (Equal Footing, degree-choice Effects) and `cr1Batch75` (Agitate, triggered-damage controls) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b163
node tools/diff-compiled-plans.mjs /tmp/phase23-b162/official-spell-compiler-report.json /tmp/phase23-b163/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b163/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch80`, then `cleanup`.
