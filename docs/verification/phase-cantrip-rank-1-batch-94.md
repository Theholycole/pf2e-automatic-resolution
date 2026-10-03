# Cantrip / rank 1 batch 94 — Flourishing Flora

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “All creatures in the target area take 2d4 damage. The type of damage depends on the type of plant you choose to grow. …” (PF2e's item has no damage entry): the text's 2d4 (heightened +1d4 a rank), basic Reflex, of the type of the plant the caster picks on the card | Flourishing Flora (1) |
| Cacti: piercing, and on a critical failure the rank's persistent bleed. Flowers: poison, Dazzled 2 rounds. Fruits: bludgeoning, Clumsy 1 for 2 rounds. Roots: bludgeoning, Prone. Only the chosen plant's extra applies | Flourishing Flora |

**Kept strict (tests):**
- An unknown damage type isn't read.
- An extra with more in it isn't read.
- Another bleed heightening isn't read.
- Narration with damage isn't read.
- An extra tagged to an option not listed is refused.

## Coverage

**Census:** **576 enabled**, up from 575.
- The b177 corpus diff against b176 changed only Flourishing Flora (route → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 680/680 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-94-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch94`:
- **Cacti:** `2d4 piercing` (3). The critically failing target lost 6 and got persistent `1` bleed; the successful one lost 1.
- **Fruits:** `2d4 bludgeoning`. The target lost double and got Clumsy 1, and no bleed.
- **Roots:** double damage and Prone, and no bleed.

The first attempt applied the cacti bleed to every plant: the card's flag update had merged the pruned row back. The dropped keys are now written as null, and the rerun passed.

**Regressions:** `cr1Batch91` (text damage with a type choice) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b177
node tools/diff-compiled-plans.mjs /tmp/phase23-b176/official-spell-compiler-report.json /tmp/phase23-b177/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b177/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch94`, then `cleanup`.
