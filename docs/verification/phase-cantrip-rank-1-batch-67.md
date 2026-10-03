# Cantrip / rank 1 batch 67 — Buffeting Winds

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The wind deals 2d4 bludgeoning damage, which is nonlethal against living creatures.” with “Each creature in the area must attempt a basic Reflex save.”: the ordinary basic save on the item's damage | Buffeting Winds (1) |
| Nonlethal against living creatures, lost against undead: a **GM:** reminder. PF2e doesn't track nonlethal damage, so a living creature reduced to 0 HP falls unconscious instead of dying; the GM adjusts it | Buffeting Winds |
| “On a failure, undead creatures are also knocked back 5 feet (or 10 feet on a critical failure).”: a push note for the GM, shown only for targets with the undead trait | Buffeting Winds |

**Kept strict (tests):**
- A die that isn't the item's isn't read.
- A different trait in the two sentences isn't read.
- An added rule in the knockback isn't read.
- A rule in the narration isn't read.

## Coverage

**Census:** **549 enabled**, up from 548.
- The b150 corpus diff against b149 changed only Buffeting Winds.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 626/626 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-67-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch67`:
- **Failures:** a living foe and an undead foe both failed and each lost 6 (the roll).
- **Critical failure:** an undead foe lost 12.
- **Push notes:** the undead foes got “pushed 5 feet” and “pushed 10 feet” notes; the living foe got none.
- **Card:** the nonlethal reminder was shown.

**Regressions:** `rank3Batch1` (existing push notes) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b150
node tools/diff-compiled-plans.mjs /tmp/phase23-b149/official-spell-compiler-report.json /tmp/phase23-b150/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b150/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch67`, then `cleanup`.
