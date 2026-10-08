# Third-party batch 28: Energy Exertion

2026-10-06. The twenty-eighth batch of the third-party modules' spells: an attack cantrip whose damage type comes from a class feature.

## What changed

- **Energy Exertion (Wizards+)** (`glyph-versions.js` `fitEnergyExertion`):
  - Each PF2e variant is a spell attack against AC: the plain 1d4 (+1d4 a rank), or the expended 2d4 (+2d4 a rank). The dice are checked against the text and against the heightened entry.
  - The card asks the damage type: the residual energy is a class feature, so it's asked on the card (user decision 2026-10-01). The text's untyped formula, `(@item.rank)d4` or `(2*@item.rank)d4`, is rolled at the cast rank.
  - The choice's label carries the text's mapping (air, earth or water: bludgeoning; wood: piercing; metal: slashing). The trait the spell gains is a note.
  - The module's item has no attack defense, so the version text is rewritten as PF2e's attack spells word it.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 27 | Batch 28 |
| --- | --- | --- |
| Save (spell attacks included) | 61 | 62 |
| Not enabled | 43 | 42 |

Resolved: 183 of 227.

## Tests

`test/third-party-batch-28.test.js` (1). All 1,746 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-28-live-results.json), case `thirdPartyBatch28`, in the `pftest` world.

| Variant (rank 2) | Result |
| --- | --- |
| Plain, fire named, critical hit | 2d4 fire, 2 doubled to 4 taken |
| Expended, slashing named, hit | 4d4 slashing, 12 taken |
