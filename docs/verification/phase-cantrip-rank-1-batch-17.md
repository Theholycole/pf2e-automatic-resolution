# Cantrip / rank 1 batch 17 — rolled row durations

2026-09-27. A follow-up to batch 16 for Forced Mercy, whose failure row lasts a rolled number of rounds.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Failure The creature is affected for [[/gmr 1d4 #rounds]]{1d4 rounds}.”: at Finalize, the rounds are rolled for each creature that failed (a chat roll), and its “Spell's effect” note lasts that many rounds | Forced Mercy (1) |
| “All physical damage dealt by the target to living creatures becomes nonlethal and all persistent bleed damage dealt by the target is reduced to 0.”: the damage the target deals is the GM's to adjust, so it stays in the note | Forced Mercy |
| “This effect doesn't incur the typical –2 circumstance penalty for nonlethal attacks …”: a penalty that doesn't apply, so it stays in the note | Forced Mercy |

The other rows use batch 16's rules: success lasts 1 round and critical failure 1 minute. The willing target's critical failure is a **GM:** reminder.

**Kept strict (tests):**
- Damage the spell itself deals stays blocked.
- A rolled duration in anything but rounds isn't read.
- A note Effect is never made before its rounds are rolled.

## Coverage

**Census:** **498 enabled**, up from 497.
- The b100 corpus diff against b99 changed only Forced Mercy (route false → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 544/544 tests pass (`test/cantrip-rank-1-batch-17.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-17-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch17`:
- The failed target's 1d4 was rolled once and came up 1. Its note lasted 1 round and says the damage it deals becomes nonlethal.
- The critically failed target's note lasted 1 minute.

**Regressions:** `cr1Batch16` and `rank1Batch2` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b100
node tools/diff-compiled-plans.mjs /tmp/phase23-b99/official-spell-compiler-report.json /tmp/phase23-b100/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b100/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch17`, then `cleanup`.
