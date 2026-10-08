# Third-party features batch 19: aspect summons and Aspect Sage

2026-10-07. The nineteenth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)), in the spellshape family. It also corrects the route of Magic+'s aspect summons.

## What changed

- **Aspect summons** (`compileSummon`, `summon-families.js`): Magic+'s 13 "Summon … Aspect" spells were counted resolved but only applied their statistics Effect, under a PF2e UUID. They now compile to the summon route:
  - the linked aspect creature, summoned at a level equal to the cast rank;
  - the module's statistics Effect put on it, from the caster (`#aspectStatistics`, `effect-runtime.js`), as the module's macro does. Its AspectForm reads the caster's spell DC.
  - The form, size and damage type are PF2e's choice sets, asked as the Effect is made, or given as `aspectSelections`.
  - The range is the spell's (Summon Fey Aspect: 5 feet), or the summon trait's 30 feet when none is stated. Sustained, up to 1 minute.
- **Aspect Sage** (`plus-spellshapes.js`, `aspect-ability` rider in `shapeSummonedAfter`): on an aspect summon (the aspectmon trait), the summon gains one aspect ability it doesn't have, picked from the actions in the module's aspect folders.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227 (the aspect summons now `summon`).

## Census

| Family | Batch 18 | Batch 19 |
| --- | --- | --- |
| spellshape | 45 / 51 | 46 / 51 |

## Tests

`test/third-party-features-batch-19.test.js` (2). All 1,831 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-19-live-results.json), case `thirdPartyFeaturesBatch19`. Re-run: `thirdPartyFeaturesBatch8` (Veracious Summon) and `thirdPartyFeaturesBatch17` (Create Elemental, Constructed Spark), which still pass.

| Step | Result |
| --- | --- |
| Summon Animal Aspect compiled | summon: Animal Aspect, with Spell Effect: Animal Aspect Statistics |
| Aspect Sage (Divebomb), then the cast at 3 | Animal Aspect, level 3; its Effect: predator, Medium, Fort +1/Ref +0/Will −2; aspect DC 16 (the caster's spell DC 18 − 2), AC 16; Divebomb granted |
| The caster's sustained Effect removed | The aspect removed |
| All 13 aspect summons, live | Each compiles to summon; its creature and statistics Effect found in the module's packs |
