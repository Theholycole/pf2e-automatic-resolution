# Cantrip / rank 1 batch 47 — Chastising Retort

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Rows: half, full or double 2d6 mental. On a failure, Stupefied 1 for 1d4 rounds (rolled); on a critical failure, Stupefied 2 for 1d4 rounds (existing) | Chastising Retort (1) |
| Critical failure: “The creature can immediately choose to reveal the truth about its deception …”: a 1-round “Reveal the truth” note (recover the mental damage and lose the Stupefied; a Feint's Off-Guard ends), which the GM carries out | Chastising Retort |
| The Off-Guard in that sentence: the Feint target's, never applied to this creature | Chastising Retort |

**Correctness note:** that Off-Guard link read as a condition on the critical failure's target. The spell was blocked, so it was never applied.

**Kept strict (tests):** a reveal naming a condition the row doesn't apply isn't read.

## Coverage

**Census:** **529 enabled**, up from 528.
- The b130 corpus diff against b129 changed only Chastising Retort.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 597/597 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-47-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch47`:
- **Failure:** lost 8 (the roll) and got Stupefied 1.
- **Critical failure:** lost 16 and got Stupefied 2, with the 1-round note.
- **No Off-Guard:** neither target got Off-Guard.

**Regressions:** `cr1Batch17` (rolled durations) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b130
node tools/diff-compiled-plans.mjs /tmp/phase23-b129/official-spell-compiler-report.json /tmp/phase23-b130/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b130/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch47`, then `cleanup`.
