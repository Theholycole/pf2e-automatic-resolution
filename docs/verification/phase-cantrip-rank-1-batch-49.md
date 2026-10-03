# Cantrip / rank 1 batch 49 — Lose the Path

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Regardless of the result, the creature is immune to lose the path for 1 hour.”: the usual temporary immunity for 1 hour. The preamble now also reads “immune” without “temporarily” | Lose the Path (1) |
| Failure: “The creature treats all squares as difficult terrain for its Stride.”: a 1-round note for the triggering Stride | Lose the Path |
| Critical failure: “As failure, except that you determine where the target moves during the Stride, though you can't move it into hazardous terrain or to a place it can't stand.”: the same note, with the caster steering | Lose the Path |

**Kept strict (tests):** a terrain rule lasting beyond the Stride isn't read.

## Coverage

**Census:** **531 enabled**, up from 530.
- The b132 corpus diff against b131 changed only Lose the Path. The looser immunity wording changed no other plan.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 599/599 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-49-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch49`:
- **Every target:** 1 hour's temporary immunity.
- **Failure and critical failure:** also the 1-round “This Stride” note.

The first attempt's check expected another sort order; it was corrected and re-run.

**Regressions:** `cr1Batch16` passed in the same session. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b132
node tools/diff-compiled-plans.mjs /tmp/phase23-b131/official-spell-compiler-report.json /tmp/phase23-b132/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b132/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch49`, then `cleanup`.
