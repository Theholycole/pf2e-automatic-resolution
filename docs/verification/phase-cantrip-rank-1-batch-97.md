# Cantrip / rank 1 batch 97 — Unfetter Eidolon

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| The eidolon can travel an unlimited distance, gains +1 status to saves and DCs against effects that would make it grappled, immobilized or restrained, and unmanifests at the spell's end if more than 100 feet away: a note on the targeted eidolon for 1 minute. The condition links only name the protection | Unfetter Eidolon (1) |

**Kept strict (test):** a sentence granting the condition (“making them Immobilized”) keeps the spell off the note route.

## Coverage

**Census:** **578 enabled**, unchanged. **Note only:** 369 non-ritual (Unfetter Eidolon joins).
- The b180 corpus diff against b179 changed only Unfetter Eidolon.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 686/686 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-97-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch97`:
- The eidolon got one “Spell Note: Unfetter Eidolon” for 1 minute, with the distance text.
- It got no condition.

**Regressions:** `cr1Batch89` (note spells) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b180
node tools/diff-compiled-plans.mjs /tmp/phase23-b179/official-spell-compiler-report.json /tmp/phase23-b180/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b180/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch97`, then `cleanup`.
