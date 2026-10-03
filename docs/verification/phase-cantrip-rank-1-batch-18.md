# Cantrip / rank 1 batch 18 — healing halved

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Failure The target takes full damage, and vitality effects heal it only half as much as normal for 1 round.” (critical failure: double damage, 1 minute): the row's damage as before, and a “Healing halved” note Effect for the stated duration. The GM halves the healing | Touch of Undeath (1) |

**Looked at and kept blocked:** Signal Skyrocket (1). Its only gap is the sentence “You can't change the direction or distance of the rocket …”. But its damage applies only “if the rocket explodes in an enclosed space smaller than the full size of the burst”, and the damage compile doesn't gate that. Claiming the sentence would apply damage the spell doesn't always deal, so it stays blocked.

**Kept strict (test):** a healing change the note doesn't recognise (“heal it for double”) stays unaccounted.

## Coverage

**Census:** **499 enabled**, up from 498.
- The b101 corpus diff against b100 changed only Touch of Undeath (route false → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 546/546 tests pass (`test/cantrip-rank-1-batch-18.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-18-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch18`:
- The failed target took 4 (the roll) and got a 1-round “Healing halved” note.
- The critically failed target took 8 (double) and got a 1-minute note.

**Regressions:** `cr1Batch6` and `cr1Batch4` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b101
node tools/diff-compiled-plans.mjs /tmp/phase23-b100/official-spell-compiler-report.json /tmp/phase23-b101/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b101/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch18`, then `cleanup`.
