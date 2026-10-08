# Third-party batch 16: the GM-handled third-party spells

2026-10-06. Your ruling, asked today: "Should third-party spells of those kinds count the same way?" — "Yes, same rule". The 2026-10-04 ruling made world-scale and terrain-reshaping spells, and non-combat information, travel and ward spells, GM-handled and resolved.

## What changed

- **The ruling's spells** (`src/compiler/user-rulings.js`, keyed by each module item's compendium id, with the ruling's date 2026-10-06). Each casts as a GM card, whispered to the GM and marked as theirs to run:
  - **If Walls Could Talk** (Clerics+): information.
  - **Fall to Ruin** (Clerics+): terrain.
  - **Raise Mountain** (Oracles+): terrain.
  - **Thousand-Year Flood** (Magic+): a world-scale deluge.
  - **State of the Art** (Clerics+): constructions.
  - **Sacrosanct Promise** (Clerics+): a non-combat pact.
  - **From Thine Sight** (Clerics+): an object made invisible.
- The card names a non-combat spell as such (`effect-runtime.js`).
- **The GM's options**, as for the official world-scale spells (`gm-options.js`), for the parts that act on creatures:
  - **Raise Mountain:** the Reflex rows. Success: Off-Guard until the end of the caster's turn. Critical failure: Prone. The moves, Grab an Edge, and the greater difficult terrain's Immobilized are GM notes.
  - **Thousand-Year Flood:** the casting's 10d10 bludgeoning, with a basic Reflex save. The item has no damage, so the option rolls the text's formula. The Sustain's spell attack and the water's terrain and breath are notes.
- **Left to automate:** Long Live the Revolution (a crowd-scale call to rebellion with saves) isn't clearly of those kinds, so it stays to be automated.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4). The 2026-10-04 test now counts its own sixteen spells, those with no later ruling date.

## Census

| Route | Batch 15 | Batch 16 |
| --- | --- | --- |
| Note (GM-handled) | 46 | 53 |
| Not enabled | 65 | 58 |

Resolved: 165 of 227.

## Tests

`test/third-party-batch-16.test.js` (2). All 1,726 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-16-live-results.json), case `thirdPartyBatch16`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| The seven, cast | Each a GM card, whispered to the GM, ruling 2026-10-06; options on Raise Mountain and Thousand-Year Flood |
| Raise Mountain's option, critical failure | Prone |
| Thousand-Year Flood's option, failure | 50 bludgeoning rolled and taken |
