# Cantrip / rank 1 batch 64 — Silver's Refrain

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Weapon and unarmed attacks by allies in the area are treated as silver.” with the 60-foot emanation: PF2e's Effect (silver on Strikes, 1 round) on the caster's allies within 60 feet, not the caster | Silver's Refrain (cantrip) |
| “In addition, this spell automatically attempts to counteract any Translocate cast by a devil within the area or cast by a devil attempting to enter the area using dimension door. If a devil attempts to enter the area using dimension door and the spell is counteracted, the devil remains where it started.”: a **GM:** note; the GM rolls the counteract check when it happens | Silver's Refrain |

**Kept strict (tests):**
- A counteract against any creature isn't read.
- An ally rule the Effect doesn't give (extra damage) isn't read.

## Coverage

**Census:** **546 enabled**, up from 545.
- The b147 corpus diff against b146 changed only Silver's Refrain.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 620/620 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-64-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch64`. The caster had no targets:
- **Recipients:** the ally 10 feet away got the Effect (1 round, silver on its Strikes). The ally 100 feet away, the enemy 15 feet away and the caster didn't.
- **Note:** the counteract note was posted.

The first run stopped on a harness call to a missing API (`updateTokenTargets`). It was changed to `clearTargets` and re-run.

**Regressions:** `cantripBatch2` (Song of Strength, the area-allies route) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b147
node tools/diff-compiled-plans.mjs /tmp/phase23-b146/official-spell-compiler-report.json /tmp/phase23-b147/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b147/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch64`, then `cleanup`.
