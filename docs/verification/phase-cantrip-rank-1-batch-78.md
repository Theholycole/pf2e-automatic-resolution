# Cantrip / rank 1 batch 78 — Trade Death for Life

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The target takes 1d4 void damage (basic Fortitude save).” and “The target takes damage only once from this spell, whether or not you Sustain it.”: the ordinary basic save, once | Trade Death for Life (cantrip) |
| “If the target takes damage, a willing creature within the hex's range gains fast healing 1 for as long as you Sustain the hex.”: after Finalize, if the target took damage, the card's button grants PF2e's Effect (fast healing at the cast rank, sustained) to the one willing creature the caster targets, once | Trade Death for Life |

**Kept strict (tests):**
- A fast-healing amount that isn't the rank isn't read.
- “any creature” isn't read.
- Damage each round isn't read.

## Coverage

**Census:** **560 enabled**, up from 559.
- The b161 corpus diff against b160 made only Trade Death for Life executable.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 648/648 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-78-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch78`:
- **After a failed save:**
  - Granting to the damaged creature was refused.
  - The grant to the ally put “Spell Effect: Trade Death for Life” (fast healing) on it.
  - A second grant was refused, and the card says who got it.
- **After a critical success:** the grant was refused (“the target took no damage”).

**Regressions:** `rank1Batch2` (basic saves with questions) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b161
node tools/diff-compiled-plans.mjs /tmp/phase23-b160/official-spell-compiler-report.json /tmp/phase23-b161/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b161/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch78`, then `cleanup`.
