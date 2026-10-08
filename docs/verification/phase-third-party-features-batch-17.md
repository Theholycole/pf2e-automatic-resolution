# Third-party features batch 17: spells cast by features

2026-10-07. The seventeenth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)), in the spellshape and item-cast families.

## What changed

- **`readActionCast`** (`plus-feature-rules.js`), applied by **`actionCastOnCard`** (`scripts/text-rules.js`, hooked in `main.js`) when the card is posted (once per card):
  - **Become Elemental** (Wizards+): spends the residual energy. Elemental Form at 7th rank, of the energy's element (its choice set), with the text's attack modifier +31 and damage bonus +14 in place of the form's, and a +10-foot status bonus to all Speeds.
  - **Create Elemental** (Wizards+): spends the residual energy. Summon Elemental, arcane, at half the level (rounded down), limited to elementals of the energy's trait (`requireTraits` in the summon route, `summon-families.js`).
  - Without residual energy, each is refused with a message. These actions no longer arm a next-spell spellshape.
- **Constructed Spark** (`replace-spell` cast rider, `plus-spellshapes.js`, `spellshape-runtime.js`): Animated Spark cast next is replaced by Summon Construct at the highest rank the caster can cast. The card is flagged `replacedBy`. The rider's spell is stored as `replacement`, since riders with a `spell` field are limited to that spell.
- **Form of the Imperial** and **Controlled Wrath**: the table's (read, nothing applied).

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 16 | Batch 17 |
| --- | --- | --- |
| spellshape | 39 / 51 | 44 / 51 |

## Tests

`test/third-party-features-batch-17.test.js` (3). All 1,826 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-17-live-results.json), case `thirdPartyFeaturesBatch17`. A 14th-level wizard with fire residual energy:

| Step | Result |
| --- | --- |
| Become Elemental | Spell Effect: Elemental Form (Fire), one; Strike +31, damage +14; +10 feet to all Speeds; the energy spent |
| Create Elemental | A Jann (fire) summoned at rank 7; the energy spent |
| Constructed Spark, then Animated Spark at 1 | Summon Construct at rank 7: a Soulbound Doll |

A second Gamemaster connection (the Foundry desktop window) doubled the hooks' work in earlier runs; the recorded run had only the test client connected.
