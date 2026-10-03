# Cantrip / rank 1 batch 5 — verification

2026-09-26. The fifth batch of the cantrip-and-rank-1 pass.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| “You move the target up to 10 feet in any direction along the ground or 20 feet through a body of water. An unwilling target can attempt a Fortitude save, and it avoids being moved if it succeeds.”: a failure or critical failure lets the caster move it up to 10 feet in any direction (20 through water), as a **GM:** push note | Tidal Surge (1) |
| The willing-target exception is a card reminder: “A willing target doesn't attempt the save: set its result to failure.” | Tidal Surge |

**Kept strict (test):** another save statistic than the item's isn't read.

## Coverage

**Census:** **479 enabled**, up from 478. Rank 1: 141 of 387.
- The b88 corpus diff against b87 changed only Tidal Surge (route null → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 513/513 tests pass (`test/cantrip-rank-1-batch-5.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-5-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch5`:
- **Failure:** the card showed the reminder and “… can be pushed up to 10 feet in any direction (20 feet through a body of water) (the caster's choice). Move the token; the module doesn't.”
- **Success:** the reminder only, no move.
- **Regressions:** `forcedMovement`, `rank3Batch2` and `cr1Batch4` passed, with cleanup between them. `forcedMovement`'s Hurtling Stone assertion was updated first: push notes with no fixed direction now say “in any direction”. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b88
node tools/diff-compiled-plans.mjs /tmp/phase23-b87/official-spell-compiler-report.json /tmp/phase23-b88/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b88/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch5`, then `cleanup`.
