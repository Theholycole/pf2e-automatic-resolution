# Third-party features batch 22: Magus+ Spellstrike variants

2026-10-07. The first Magus+ batch ([audit](../planning/third-party-features-audit.md)), under the user's "Split by spell link": the spell-linked parts of Magus+ are built here.

## What changed

- **Six Spellstrike variants** (`plus-spellshapes.js`), armed by their card like spellshapes:
  - Imposing (Will −2/−1 and fear −3/−2, to the end of the caster's next turn).
  - Pummeling (pushed 10/5 feet away from the caster).
  - Flaying (an Arcana check against the level DC: weakness 3/5/7, doubled on a critical success, of the chosen type).
  - Banishing (on a hit, a Will save against the spell DC, with incapacitation unless summoned: Stunned 1 for the caster on a critical success; banished on a failure).
  - Living Grimoire's grimoire power (dazzled until the end of the caster's next turn, or 1 minute on a critical success, with −1 to attacks against the caster).
  - Inverted Energy (one energy type of the spell becomes another, by the existing `transmute` rider).
- **`spellstrike` cast rider** (`spellshape-runtime.js`): marks the cast delivered by a Spellstrike, with the variant's additions by degree (`rows`), on a hit (`hit`) or always (`always`).
- **`deliveryOnStrike`** (`spell-actions-runtime.js`): the caster's first Strike after the delivered cast applies the variant (`applySpellstrikeVariant`), once. The critically failed Strike still disrupts a delivered save spell. The Spellstrike card's Deliver button keeps a variant already set.
- **Requirements:** `inArcaneCascade` (the stance's roll option) and `heavyArmor` facts. A requirement without its full stop ("… your Spellstrike is charged The appearance …") is read. A passive feat with an "If your next action is to Spellstrike" activation is read.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged (227: save 66, note 51, effect 102, ongoing 8).

## Census

| Family | Batch 21 | Batch 22 |
| --- | --- | --- |
| spellstrike-cascade | 0 / 73 | 6 / 73 |

## Tests

`test/third-party-features-batch-22.test.js` (3). All 1,837 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-22-live-results.json), case `thirdPartyFeaturesBatch22`. Re-run: `spellFeaturesBatch8` (PF2e's Spellstrike delivery) and `thirdPartyFeaturesBatch7`, which still pass.

A 10th-level character in an Arcane Cascade stance, in Full Plate with a longsword, casts Ignition after each variant's card and Strikes a foe (AC −20, Will −20):

| Variant | Result |
| --- | --- |
| Imposing (critical hit) | Will −2, fear −3 on the foe |
| Pummeling (critical hit) | Pushed 10 feet (2 squares) |
| Flaying (fire) | Arcana check against DC 13; weakness 3 to fire |
| Banishing | Will save: critical failure; banished, the GM told |
| Living Grimoire (critical hit) | Dazzled for 10 rounds; −1 to its attacks against the caster |
| Inverted Energy (fire → cold) | The cast's fire damage becomes cold |
| Imposing without heavy armor | Unmet: "you aren't wearing heavy armor"; not delivered |
