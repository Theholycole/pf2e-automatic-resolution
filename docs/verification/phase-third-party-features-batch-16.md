# Third-party features batch 16: reactions to a casting

2026-10-07. The sixteenth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)), in the spell-trigger family.

## What changed

- **`readCastReaction`** (`plus-feature-rules.js`), read into the casting-rules cards (`scripts/casting-rules-runtime.js`):
  - **Archmage's Counter** (Magic+): offered with the Counterspell options when an enemy casts a spell of a rank the holder can cast.
    - No slot is spent. The counteract rank is half the level (rounded up), and the modifier is the spellcasting attribute plus proficiency.
    - A second option spends a Mythic Point for mythic proficiency.
  - **Seal the Wicket** (Magic+): offered when the spell has one of the holder's wicket traits (its wicket feat's). It spends a prepared spell with that trait, or a spontaneous slot of a rank at which it knows such a spell, and counteracts at that rank.
  - **Haughty Correction** (Feats+): a card for a creature with it within 30 feet of the caster (not already immune).
    - It rolls Arcana against the caster's Will DC: Stupefied 1 for 1 minute on a critical success, for 1 round on a success, and the module's Effect on the corrector on a critical failure.
    - The caster is then immune for 1 minute.
  - **Residual Energy Capture** (Wizards+): a card for the caster when its spell from slots has one of the element traits. It gives the module's Effect: Residual Energy with that trait, its level the spell's rank, replacing an earlier one.
- The Counterspell cards now label a no-slot counter by its counteract rank.

The module's Effect: Residual Energy is kept as it is: its damage types for air, earth, water, wood and metal are the module's reading of "the same type as your residual energy" (noted).

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 15 | Batch 16 |
| --- | --- | --- |
| spell-trigger | 0 / 6 | 4 / 6 |

## Tests

`test/third-party-features-batch-16.test.js` (1). All 1,823 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-16-live-results.json), case `thirdPartyFeaturesBatch16`. It also re-ran `spellFeaturesBatch3` (PF2e's Counterspell and the other casting rules), which still passes.

| Step | Result |
| --- | --- |
| An enemy's Fireball at 3 near a 10th-level defender | Offered: Seal the Wicket (rank 3 and 5 slots), Archmage's Counter (no slot, rank 5; with a Mythic Point) |
| Archmage's Counter | Rolled at rank 5 against DC 17; countered; no slot spent |
| Haughty Correction | Its card; a success; the foe immune |
| The defender's Fireball at 3 | Residual Energy Capture: Effect: Residual Energy, fire, level 3 |
