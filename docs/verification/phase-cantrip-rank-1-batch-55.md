# Cantrip / rank 1 batch 55 — Nymph's Grace

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The first time an enemy enters the aura each round, or if they start their turn within the aura, they must succeed at a Will saving throw or become Confused for 1 round.”: a lingering emanation around the caster (10 feet, the sustained minute) exposing enemies when they first enter it each round or start their turn in it. Success is unaffected; failure and critical failure give Confused for 1 round | Nymph's Grace (1) |
| “While confused by this effect, the creature's confused actions never include harming you.”: a note lasting as that Confused (1 round) | Nymph's Grace |

**Kept strict (tests):** another rule after the note sentence isn't read.

## Coverage

**Census:** **537 enabled**, up from 536.
- The b138 corpus diff against b137 changed only Nymph's Grace. A corpus-wide note-text comparison agrees.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 605/605 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-55-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch55`, in combat:
- **At casting:** no exposure (the spell has no save when cast).
- **Enemy's turn start:** the enemy starting its turn inside was listed for review. Reviewed in, it failed and became Confused, with the 1-round note.

**Regressions:** `cr1Batch54` (Sepulchral Mask) passed. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b138
node tools/diff-compiled-plans.mjs /tmp/phase23-b137/official-spell-compiler-report.json /tmp/phase23-b138/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b138/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch55`, then `cleanup`.
