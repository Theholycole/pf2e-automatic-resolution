# Cantrip / rank 1 batch 75 — Agitate

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The duration of this effect depends on the target's Will save.” with rows of 1, 2 and 4 rounds (a critical success: no effect): the effect as a “Spell's effect” note for each row's duration | Agitate (1) |
| “During the duration, the target must Stride, Fly, or Swim at least once each turn or take 2d8 mental damage at the end of its turn.”: an Ongoing control on the note. When the GM reports that the creature didn't Stride, Fly or Swim this turn, it deals the item's damage at the cast rank (+2d8 per rank), once a round | Agitate |
| “The GM might decide to add additional move actions …”: in the note | Agitate |

**Changed test:** batch 16 kept Agitate blocked, since its damage wasn't read. That test now checks that another damage form (“and takes 2d8 …”) still blocks.

**Kept strict (tests):**
- A die that isn't the item's isn't read.
- Another movement list isn't read.
- A Heightened die that doesn't match isn't read.

## Coverage

**Census:** **557 enabled**, up from 556.
- The b158 corpus diff against b157 made only Agitate executable.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 642/642 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-75-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch75`, cast at rank 2:
- **Notes:** the success got a 1-round note and the failure a 2-round note.
- **The no-move control:** it rolled `4d8 mental` (13), and the creature lost 13. The roll's flavour reads “didn't Stride, Fly or Swim this turn”.

The first run behaved the same (18 damage), but the case wrongly expected no note on a success and read the wrong chat message for the flavour. It was corrected and re-run.

**Regressions:** `cr1Batch51` (Cycle of Retribution, the hostile-action control) and `cr1Batch16` (Forced Quiet, the row notes) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b158
node tools/diff-compiled-plans.mjs /tmp/phase23-b157/official-spell-compiler-report.json /tmp/phase23-b158/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b158/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch75`, then `cleanup`.
