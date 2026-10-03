# Cantrip / rank 1 batch 85 — Phantom Pain

2026-09-27. Continuing spell by spell. Phantom Pain was kept blocked in batch 71 for lack of this reverse link.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Illusory pain wracks the target, dealing 2d4 mental damage and @Damage[(@item.level)d4[persistent,mental]] damage. The target must attempt a Will save.”: the rows' damage. A success takes full initial damage and no persistent damage; failure and critical failure take full initial damage plus the persistent damage (“As failure, but …” repeats it) | Phantom Pain (1) |
| Sickened 1 / Sickened 2 on failure / critical failure (the spell's minute, as for other conditions without their own duration) | Phantom Pain |
| “If the target recovers from being Sickened, the persistent damage ends and the spell ends.”: the persistent condition is tagged at Finalize; once the creature has no Sickened, the lead GM removes it | Phantom Pain |

**Kept strict (tests):**
- A link to a condition the rows don't grant isn't read.
- Other heightening isn't read.
- A narration with a mechanical word isn't read.
- A success row with persistent damage isn't read.
- A link on a success row, or without the row's condition, is refused.
- The persistent-family test now gates Phantom Pain without the link sentence.

## Coverage

**Census:** **567 enabled**, up from 566.
- The b168 corpus diff against b167 changed only Phantom Pain (route false → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 662/662 tests pass (`test/cantrip-rank-1-batch-59.test.js`, `test/persistent-damage-family.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-85-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch85`:
- **Damage:** `2d4` rolled 3, and each target lost 3.
- **Failing rows:** Sickened 1 and 2, each with persistent `1d4` mental tagged `sickened`. The successful target had none.
- **Recovery:** removing the failing target's Sickened removed its persistent damage. The critically failed target kept its own.

**Regressions:** `cr1Batch84` passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b168
node tools/diff-compiled-plans.mjs /tmp/phase23-b167/official-spell-compiler-report.json /tmp/phase23-b168/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b168/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch85`, then `cleanup`.
