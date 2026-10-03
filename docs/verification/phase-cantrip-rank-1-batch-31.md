# Cantrip / rank 1 batch 31 — damage within melee reach

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You magically shift your weapon or unarmed attack into a spike of pure force that deals 1d4+1 force damage to a target within your melee reach.”: damage with no check (the existing automatic-hit route), with a **GM:** reminder that the target must be within the caster's melee reach | Force Fang (1) |
| “If you can use Spellstrike with a ranged weapon (…), you can instead target a creature in the first range increment of your ranged weapon.”: a **GM:** reminder on the damage card | Force Fang |

**Test update:** `rank-1-batch-10` expected Force Fang to stay blocked. It now checks that another range (“within 60 feet”) isn't read.

## Coverage

**Census:** **513 enabled**, up from 512.
- The b114 corpus diff against b113 changed only Force Fang.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 572/572 tests pass (`test/cantrip-rank-1-batch-31.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-31-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch31`: the foe took 3 force (1d4+1), and the damage card carried both reminders.

**Regressions:** `rank1Batch10` (Force Bolt) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b114
python3 tools/build-phase-spell-batches.py /tmp/phase23-b114/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch31`, then `cleanup`.
