# Cantrip / rank 1 batch 72 — Elysian Whimsy

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “… if it fails a Will save. Roll [[/r 1d4]] to determine the spell's effect.” with the `1d4 \| Effect` table: one roll for the cast; a failing creature gets only that result's note, and a success nothing | Elysian Whimsy (1) |
| Result 1: “For 1 round, it takes a –5-foot status penalty to its Speeds (-10-foot status penalty on a critical failure), …”: a 1-round note with that penalty on all Speeds | Elysian Whimsy |
| Results 2–4: the behaviour for “its next turn”, as a note to the end of the target's next turn; “On a critical failure, …” is added to the critical failure's note | Elysian Whimsy |
| The item's `varies` duration: each note carries its own | Elysian Whimsy |

**Kept strict (tests):**
- A missing result isn't read.
- Damage in a row isn't read.
- A condition beside the Speed penalty isn't read.
- Another roll sentence isn't read.

## Coverage

**Census:** **554 enabled**, up from 553.
- The b155 corpus diff against b154 changed only Elysian Whimsy.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 636/636 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-72-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch72`:
- **Roll 1:**
  - The failing creature got “1d4 1” for 1 round (−5 on all Speeds; land Speed 25 → 20).
  - The critically failing one got −10 (land Speed 15).
- **Roll 2:** the failing creature got the singing note (1 round, to a turn's end), with no Speed penalty.
- **A success:** nothing.
- **Card lines:** “1d4: 1 — the note for result 1”, “1d4: 2 — the note for result 2”.

The first run behaved the same but failed its check: the harness read the rule's selector as a string, while PF2e keeps it as an array. The check was corrected and the case re-run.

**Regressions:** `cr1Batch61` (Creative Splash, the rolled conditions) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b155
node tools/diff-compiled-plans.mjs /tmp/phase23-b154/official-spell-compiler-report.json /tmp/phase23-b155/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b155/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch72`, then `cleanup`.
