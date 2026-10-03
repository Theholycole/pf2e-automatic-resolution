# Cantrip / rank 1 batch 63 — Hippocampus Retreat

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Attempt a melee spell attack roll against the target's AC, dealing 2d6 bludgeoning damage on a hit (or double damage on a critical hit).”: the spell-attack route (the Requirements line and narration lead the card) | Hippocampus Retreat (1) |
| “Then, Swim up to 30 feet; if you already have a swim Speed, you can Swim up to your Speed with a +10-foot circumstance bonus. You gain a +2 circumstance bonus to your AC against reactions triggered by this movement. At the end of the movement, your lower limbs return to normal.”: PF2e's Effect on the caster, whatever the attack's result. Its +10-foot swim Speed and +2 AC (circumstance) are proved | Hippocampus Retreat |
| The Swim: a **Caster:** reminder to move the token | Hippocampus Retreat |
| **PF2e data** note: the Effect's AC bonus applies against everything and lasts until the start of the caster's next turn; the text limits it to this movement's reactions and ends it with the movement. Remove it then | Hippocampus Retreat |

**Kept strict (tests):**
- A bonus the Effect doesn't give (+20-foot, +3 AC) isn't read.
- A Speed other than the movement's isn't read.
- An added rule after the movement isn't read.

## Coverage

**Census:** **545 enabled**, up from 544.
- The b146 corpus diff against b145 changed only Hippocampus Retreat.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 618/618 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-63-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch63`:
- **Hit:** the target lost 4 (the 2d6 roll). The caster got “Spell Effect: Hippocampus Retreat” (swim-speed +10 and AC +2, circumstance; 1 round to a turn's start).
- **Card:** the card showed the movement reminder and the data note.
- **Miss:** no damage; the caster still got the Effect.

**Regressions:** `casterEffects` (Glutton's Jaws, Propelling Air Stream) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b146
node tools/diff-compiled-plans.mjs /tmp/phase23-b145/official-spell-compiler-report.json /tmp/phase23-b146/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b146/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch63`, then `cleanup`.
