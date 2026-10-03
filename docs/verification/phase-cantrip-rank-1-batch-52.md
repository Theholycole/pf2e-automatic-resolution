# Cantrip / rank 1 batch 52 — Telekinetic Rend (damage from the text)

2026-09-27. Your decision: when PF2e's item has no damage entry but the text states it exactly, build the damage from the text, let the caster pick the type, and note it on the card.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You deal your choice of 1d6 bludgeoning or 1d6 slashing damage to all creatures in the area, with a basic Fortitude save.”: a basic save with 1d6, of the type the caster picks on the card. A **PF2e data** note says the item has no damage entry | Telekinetic Rend (cantrip) |
| “Heightened (+2) The damage increases by 1d6.”: the formula `(1+floor((@item.rank - 1)/2)*1)d6` at the cast rank | Telekinetic Rend |
| “A creature large enough to be in more than one of the bursts takes damage only once.”: each creature is one target on the card | Telekinetic Rend |
| Target “2 non-overlapping 5-foot bursts”: the creatures in the areas the caster places | Telekinetic Rend |

**Kept strict (tests):**
- Different dice for the two types isn't read.
- A rule after the damage sentence (for example, falling prone on a failure) isn't read. The first draft would have accepted it as narration, and the test caught it.
- An item with damage data keeps PF2e's damage.

The other three spells under this decision need more:
- **Vengeful Glare:** extra persistent damage if the caster already dealt damage this turn.
- **Flourishing Flora:** each plant has its own critical-failure effect.
- **Sacred Beasts:** the deity's animal.

## Coverage

**Census:** **534 enabled**, up from 533.
- The b135 corpus diff against b134 changed only Telekinetic Rend.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 602/602 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-52-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch52`:
- **Cast:** a 5th-level caster (cantrip rank 3) picked slashing.
- **Damage:** 2d6 slashing, rolled 5. The plain target lost 5; the one with slashing resistance 5 lost 0.
- **Card:** it showed the data note.

The first attempt used a 1st-level caster. The card refused to roll rank-3 damage at PF2e's rank 1, as it should; the case was corrected and re-run.

**Regressions:** `rank1Batch8` (caster damage-type choice) passed in the same session. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b135
node tools/diff-compiled-plans.mjs /tmp/phase23-b134/official-spell-compiler-report.json /tmp/phase23-b135/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b135/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch52`, then `cleanup`.
