# Cantrip / rank 1 batch 30 — damage shared with the caster

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “When you first Cast the Spell, the target recovers 1d4 Hit Points.”: PF2e's healing at the cast rank | Life Link (1) |
| “The first time each round that the target takes damage, reduce the damage it takes by 3 (…). You lose 3 Hit Points each time, or the total damage dealt, if less than 3; …”: a control per linked target, “Life Link: <target> took damage”. It asks for the damage, moves up to 3 back to the target (never past its maximum) and off the caster (direct changes), once per round per target | Life Link |
| Heightened (3rd/6th/9th): 2/3/4 targets and 5/10/15 shared | Life Link |
| “The spell ends immediately if you fall Unconscious.” (the record ends when the caster is) and “You can Dismiss the spell.” | Life Link |

**Kept strict (tests):**
- A loss that doesn't match the reduction isn't read.
- Neither is a heightened entry worded differently.

## Coverage

**Census:** **512 enabled**, up from 511.
- The b113 corpus diff against b112 changed only Life Link.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 571/571 tests pass (`test/cantrip-rank-1-batch-30.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-30-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch30` (in combat):
- The target (480 HP) healed 1, the 1d4 roll.
- It then took 10 damage. Sharing it moved 3: the caster went from 500 to 497, and the target from 471 to 474.
- A second share in the same round was refused.

**Regressions:** `cr1Batch27` and `durationBuffs` passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b113
python3 tools/build-phase-spell-batches.py /tmp/phase23-b113/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch30`, then `cleanup`.
