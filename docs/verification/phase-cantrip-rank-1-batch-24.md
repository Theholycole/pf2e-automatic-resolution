# Cantrip / rank 1 batch 24 — retaliation (thorns)

2026-09-27. Continuing spell by spell. Three rank-1 spells damage creatures that hit or grab the caster. That's mechanical damage, so it's automated rather than noted.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| **Set (retaliates)** puts a marker on the caster for the spell's duration, tracked in Ongoing spells. Each trigger is a **Retaliate** control: the GM (or the caster's owner) targets the creature that set it off, and the damage is rolled and applied, with no save. Targeting the caster is refused | all three |
| “Adjacent creatures that hit you with a melee or unarmed attack take 1d4 piercing damage …” (the item's entry, +1d4 per rank) and “Each time a creature takes damage in this way, nettleskin's duration decreases by 1 round.” (the marker is shortened; at none left, the spell ends) | Nettleskin (1) |
| “Whenever a creature touches you or hits you with a melee unarmed attack, it takes 1 piercing damage.” (+2 per 2 ranks) and, when grabbed, restrained or held, “the creature takes (ceil(rank/2))d4 persistent bleed damage” (a second control; PF2e's persistent condition) | Armor of Thorn and Claw (1) |
| “… take (rank) piercing damage each time they do.” and, after the caster casts a vitality spell, “(rank)d6” until the start of its next turn (a second control) | Vibrant Thorns (1) |

**Kept strict (tests):**
- Damage that doesn't match the item's entry isn't read.
- Neither is another rule after the trigger (a condition), or a save.

## Coverage

**Census:** **506 enabled**, up from 503. Rank 1: 162 of 387.
- The b107 corpus diff against b106 changed only these three spells.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 559/559 tests pass (`test/cantrip-rank-1-batch-24.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-24-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch24`:
- **Nettleskin:**
  - Retaliating against the caster was refused.
  - The foe took 3 (1d4).
  - The marker went from 1 minute to 9 rounds.
- **Armor of Thorn and Claw:** the attacker took 1 piercing. The grab trigger gave the grabber persistent 1d4 bleed.

**Regressions:**
- `cr1Batch12` passed.
- `longTailBatch2` (Animus Mine and Bandit's Doom, the stored-trigger spells) passed. It replaced a mistyped case name that the harness reported as unknown.
- The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b107
python3 tools/build-phase-spell-batches.py /tmp/phase23-b107/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch24`, then `cleanup`.
