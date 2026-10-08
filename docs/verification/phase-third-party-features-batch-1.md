# Third-party features batch 1: seven "+" spellshapes

2026-10-07. The first batch of the "+" modules' feats, actions and items that build on spells ([audit](../planning/third-party-features-audit.md)). It covers the spellshapes whose rules fit the existing riders.

## What changed

- **New reader** `src/compiler/plus-spellshapes.js` (`readPlusSpellshape`). `readSpellshapeFeat` falls back to it.
  - Each form matches the whole text, after a leading Frequency or Requirements line.
  - Only narration may come before the rule: no number, link, save, Speed, bonus or penalty.
- **The seven entries:**
  - **Persistent Spell** (Feats+): needs a single-target damaging spell. On a failed save or a hit, persistent damage of twice the rank, of the spell's type (asked if it has several), doubled on a critical.
  - **Bleeding Spell** (Magic+ action): needs a spell from a slot with a target. Persistent bleed equal to the rank, on one creature chosen at the cast, if it fails or is hit.
  - **Trepidation Spell** (Oracles+): needs a Will save and a rank at least 2 below the highest. Frightened 1 on a failure, 2 on a critical failure, unless the creature is immune to emotion, fear or mental.
  - **Heightened Spell** (Feats+): needs a rank at least 3 below the highest. The spell counts as 2 ranks higher, and the text's limits are posted as a note.
  - **Dueling Wand** (Wizards+): needs a spell attack. A +1 status bonus to spell attacks this turn, +2 from 10th level, +3 from 18th.
  - **Draining Cast** (Magic+): needs a slot. The slot is given back and the caster loses twice the rank in Hit Points (not damage).
  - **Befuddling Spell** (Magic+): the −4 to Identify the Magic and −2 to counteract, posted as the GM's note.
- **Runtime** (`scripts/spellshape-runtime.js`):
  - `belowHighest` requirement, using the caster's highest castable rank.
  - Persistent riders gained `oneTarget`, the spell's own damage type and `critDouble`.
  - Condition riders gained `unlessImmune`.
  - New cast riders: `self-rules` (values by level) and `hp-cost`.
  - Spellshape actions are found by their selector too.

The modules' own rules on these entries:
- Their `FlatModifier`s (Persistent Spell, Bleeding Spell) are predicated on `spellshape:<slug>`. The runtime switches that selector off at the cast, so they never add to the card's damage and the riders aren't doubled.
- Dueling Wand's bonus is predicated on `dueling-wand`, which nothing sets; the rider is the one applied.
- Their `ItemAlteration`s only add the text to the spell's description.

The official plans are unchanged except Temporal Twin's pending list, as before. The third-party spell census is still 227 of 227.

## Census

| Family | Read before | Read now |
| --- | --- | --- |
| spellshape | 0 / 51 | 7 / 51 |

## Tests

`test/third-party-features-batch-1.test.js` (2). All 1,791 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-1-live-results.json), case `thirdPartyFeaturesBatch1`, in the `pftest` world. A 13th-level caster, each shape armed from its card:

| Step | Result |
| --- | --- |
| Persistent Spell, Hydraulic Push at 1, critical hit | (2 × 2) bludgeoning persistent, the one target |
| Bleeding Spell, Fear at 1, two failures, the first foe chosen | 1 bleed on the first, none on the second |
| Trepidation Spell, Phantom Pain at 1, critical failure | Frightened 2 |
| Trepidation Spell, Fear at 6 (highest 7) | Refused: not 2 ranks below |
| Heightened Spell, Fireball at 3 | Cast rank 5 |
| Dueling Wand | +2 status to spell attacks this turn |
| Draining Cast, Fear at 1 | 2 Hit Points lost |
| Befuddling Spell | The note posted |
