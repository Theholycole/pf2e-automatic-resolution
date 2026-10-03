# Cantrip / rank 1 batch 53 — Sacred Beasts (damage from the text)

2026-09-27. Continuing under your text-damage decision.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The animal or swarm assaults all creatures in the area, dealing 2d6 damage. The damage is either bludgeoning, piercing, or slashing based on the animal that was conjured, as determined by the GM.”: the item's basic Reflex save with 2d6, of the type the GM picks on the card. The item has no damage entry, and a data note says so | Sacred Beasts (1) |
| “Heightened (+1) The damage increases by 2d6.”: `(2+floor((@item.rank - 1)/1)*2)d6` at the cast rank | Sacred Beasts |
| The requirement, the sacred-animal narration and “After their attacks, the animals return to your deity's plane.”: narration | Sacred Beasts |

**Kept strict (tests):** a rule added after the damage (knocking creatures prone) isn't read.

## Coverage

**Census:** **535 enabled**, up from 534.
- The b136 corpus diff against b135 changed only Sacred Beasts.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 603/603 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-53-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch53`:
- **Rank 1:** 2d6 piercing, rolled 7, and the target lost 7.
- **Rank 2:** 4d6 bludgeoning, rolled 17, and the target lost 17.

**Regressions:** `cr1Batch52` (Telekinetic Rend) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b136
node tools/diff-compiled-plans.mjs /tmp/phase23-b135/official-spell-compiler-report.json /tmp/phase23-b136/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b136/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch53`, then `cleanup`.
