# Rank 3 batch 122 — drinks that cast spells

2026-10-03. Part of the user's ranks 3–5 pass. This batch extends `ritual-degrees` with the spells a ritual's drink casts.

**New:**

- **Spells cast on each drinker** (`cast`). Each drinker gets an Effect listing the spells, with a card control per spell. Pressing one runs the module's own resolution of that spell, from the primary caster at the stated rank (or the ritual's rank). Its counteract check uses the primary check's skill, asked once (or the `primarySkill` option).
  - Care spells (which need a condition or affliction to act on) are always controls, pressed for each relevant one.
  - Other spells are cast at once.
  - On "choose one", every spell is a control, and a second choice is refused.
- **PF2e's Effect with the result's choice preselected.** The ChoiceSet's own selection is set, so PF2e doesn't prompt.
- **Temporary Hit Points that grow per heightened step.**
- **"You and the drinkers":** the primary caster and the targeted creatures.

**Fix:** borrowed actions ("As critical success, except …") are now copies, so amending them leaves the borrowed result unchanged.

| Ritual | Now |
| --- | --- |
| Fortifying Brew (5) | **Critical success:** PF2e's Fortifying Brew Effect on each drinker, with its critical-success choice: 4 × rank temporary HP (the text's 20, +4 per rank) and +2 status to saves against diseases and poisons, for 12 hours. Also controls for a 4th-rank Cleanse Affliction, Clear Mind and Sound Body on each drinker. **Success:** the same, with the success choice (10 HP, +2 per rank; no bonus). **Critical failure:** the primary caster and the drinkers Sickened 4, locked for 12 hours. |
| Winter's Breath (3) | **Critical success:** on each guest, 10 temporary HP (+2 per rank above 3rd) and +1 status to saves against emotion effects for 12 hours. Environmental Endurance is cast at the ritual's rank at once; Clear Mind, Sound Body and Sure Footing are controls. **Success:** the HP without the bonus, and one spell per guest (a second is refused). **Critical failure:** the primary caster and the guests Sickened 3, locked for 12 hours. |

## Rules

- **`src/compiler/ritual-degrees.js`:** the readers, a lone PF2e Effect paragraph joined to the result before it, "Heightened (+N)" entries and borrowed actions copied.
- **`scripts/effect-runtime.js`:** `cast` and `ritualCast`, the primary-skill question, `primaryAndTargets`, temporary Hit Point steps and the preselected native choice.
- **`scripts/main.js`:** the effect runtime gets the affliction-care runtime; `ritualCast` API.

## Interpretation

The counteract modifier, the "five spells" and who the guests are are listed in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-3-batch-122.test.js` is new. It covers both rituals' actions (including that the borrowed critical success is left unchanged) and two changed sentences (not read).

A whole-corpus compile (b706 → b707) changed only these two rituals.

## Evidence

[Live evidence](phase-rank-3-batch-122-live-results.json), case `rank3Batch122`, with `rank3Batch121` and `rank3Batch120` rerun, in the `pftest` world.

| Step | Result |
| --- | --- |
| Fortifying Brew at 5th, critical success, two drinkers | Both 20 temporary HP; PF2e's "Spell Effect: Fortifying Brew (Critical Success)" with its +2 rule, no prompt; 3 controls each |
| Sound Body control on an effect granting Enfeebled | Counteract with the caster's Crafting (rank 4 vs 1): the effect and its Enfeebled gone |
| Fortifying Brew at 6th, success | 12 temporary HP, the success choice |
| Fortifying Brew, critical failure | The caster and both drinkers Sickened 4 (still 4 after trying to reduce it) |
| Winter's Breath at 4th, critical success | 12 temporary HP, +1 against emotion, Environmental Endurance applied, 3 controls each |
| Winter's Breath at 3rd, success | 10 temporary HP, no bonus; Environmental Endurance chosen; a second spell refused |
| Winter's Breath, critical failure | The caster and both guests Sickened 3 |

**The `rank3Batch120` rerun:** the first rerun failed because the helper rolled a natural 20 on its Will save (critical failure upgraded to failure: ×1, which is correct PF2e). The batch 119 and 120 checks now compare against the recorded multiplier. Both were rerun and passed; the first run is kept as `rank3Batch120FirstRun`.

**Cleanup:** fixtures removed.
