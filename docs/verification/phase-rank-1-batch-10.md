# Rank 1 batch 10 — verification

2026-09-26. The tenth rank-1 batch: two new general routes. This batch also adds [the resolution status by rank](../spell-resolution-by-rank.md).

## Rules and spells

| Rule | Spell (phase) |
| --- | --- |
| Damage with no check: “It automatically hits and deals 1d4+1 force damage to the target.” PF2e's damage roll (at the cast rank), applied with resistances and weaknesses to the one targeted creature | Force Bolt (4) |
| An area that heals allies and harms enemies. The allies take no save: one roll of the inline healing formula heals each, and each gets the linked Effect, whose only rule must be the stated save bonus for the stated time. Enemies take a basic save; a creature that is neither is the GM's call. | Rejuvenating Flames (4) |

**Left blocked:**

| Spell | Reason |
| --- | --- |
| Force Fang | Its reach and Spellstrike range sentences |
| Healer's Blessing | Its Effect adds healing every time; the text allows it once per spell |
| Practice Makes Perfect | Its Effect is a future bonus; the text changes a roll already made |
| Cutting Eye | Its off-guard rule isn't in the Effect |
| Gravity Weapon | A player-toggled first-Strike option |
| Sweet Dream | Waking ends the spell early |

## Coverage

**Census:** **440 enabled**, up from 438 (Phase 4: 100; rank 1: 126 of 387).
- The b75 corpus diff against b74 changed exactly Force Bolt and Rejuvenating Flames. No variant plan changed and no plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

**New document:** `tools/build-spell-resolution-status.py` now also writes `docs/spell-resolution-by-rank.md`:
- counts by rank (cantrips apart from rank 1), with spells and rituals;
- a rank-by-phase table;
- the list of spells that can resolve at each rank.

Its totals are checked against the phase counts when it's built.

## Evidence

**Automated:** 480/480 tests pass. `test/rank-1-batch-10.test.js` covers:
- the new route kind, the ally split, and the Effect proof;
- refusals: another formula, a rider sentence, Force Fang's range rules, an Effect giving more or lasting longer, missing evidence, and a text bonus that differs from the Effect.

[Live evidence](phase-rank-1-batch-10-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank1Batch10`:
- **Force Bolt:**
  - Two targets were refused (“target exactly 1 creature”).
  - A hit rolled `1d4 + 1 force`, and each hit's total came off the target's HP.
  - Against force resistance 2, a total of 4 took 2.
  - With the caster at level 5 (the focus spell at rank 3), it rolled `2d4 + 2 force`.
- **Rejuvenating Flames**, with a party caster:
  - The ally was marked *Ally* with no save. The enemy saved. The neutral creature's card asked whether it's an enemy, and the GM set it aside.
  - At Finalize the ally was healed by the `1d4` roll (300 → 301) and got “Spell Effect: Rejuvenating Flames”. The enemy's failure took the full damage roll, with no Effect; the neutral creature took nothing.
- **Regressions:** `directHealing`, `healOrHarm`, `phrasings`, `enemies`, `durationBuffs`, `energyByCreature` and `rank1Batch9` passed, with cleanup between them. The run left no P23 fixtures or combats.

**Harness notes:**
- A focus spell's rank follows its caster's level, so the heightened check raises the caster's level.
- A chat card's item is already at the cast rank. For a base item, the damage route loads the cast-rank variant itself.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b75
node tools/diff-compiled-plans.mjs /tmp/phase23-b74/official-spell-compiler-report.json /tmp/phase23-b75/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b75/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank1Batch10`, then `cleanup`.
