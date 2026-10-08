# Third-party features batch 34: Spell Ignition and Cone of Figments

2026-10-07. Two Magus+ features that act on the last spell ([audit](../planning/third-party-features-audit.md)).

## What changed

- **Arcane Cascade: Spell Ignition:**
  - Read as the `spell-ignition` action (`plus-feature-rules.js` `readActionCast`). Its card makes a region over the caster's last spell's template or the spaces of its targets, lasting 2, 3 or 4 rounds by weapon specialization.
  - A creature other than the caster that ends its turn there gets a basic save card for the rank (half for a cantrip) in the stance's type. `shapeTerrainTurnEnd` handles the `damage` and `exceptCaster` hazards.
- **Cone of Figments:**
  - A Spellstrike form in `plus-spellshapes.js` (not a cantrip or focus spell). `REQUIREMENT` now reads the singular "Requirement".
  - On a hit, the `cone-burst` rider finds the creatures in the 10-foot cone behind the target and opens a basic Reflex card for 1d4 per rank of the spell's type.
- `startShapeCard`'s `entryId` is also given for the terrain cards.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-34.test.js` (2). All 1,860 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-34-live-results.json), cases `thirdPartyFeaturesBatch34`, `thirdPartyFeaturesBatch22` (the Spellstrike variants) and `spellshapeBatch14` (Hopeless Night's turn-end save), all passing.

| Step | Result |
| --- | --- |
| Hydraulic Push at a foe, then Spell Ignition | A region on its space, 12 seconds (2 rounds); hazard basic Fortitude, 1 force, sparing the caster |
| The foe's turn ends there | Its Fortitude card; a failure: 1 force taken |
| Cone of Figments, Hydraulic Push at 2, a Spellstrike hit on a foe east of the caster | The two creatures behind it caught, the one beside the caster not; basic Reflex 2d4 bludgeoning; both damaged |
