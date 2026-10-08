# Third-party batch 36: Divine Eclipse

2026-10-06. The thirty-sixth batch of the third-party modules' spells: darkness around the caster, and a few creatures blessed with light.

## What changed

- **Divine Eclipse (Oracles+)** (new `divine-eclipse.js`; lingering `blessed`):
  - The caster's 60-foot emanation is a lingering area. A creature ending its turn in it attempts a basic Reflex save against the item's 6d4 cold (+1d4 per rank).
  - Two kinds of creature aren't exposed: the blessed, and creatures within a blessed creature's bright light (5 feet). The caster isn't exposed either.
  - **The blessed:** the cast's targets in the area, up to 5. Each holds the module's Effect (bright light 5, dim 10, fast healing equal to the rank) only while it's inside the emanation (`syncBlessed`, `ongoing-families.js`). The Effect is proved against the text when compiling and again from the live template.
  - Putting out non-magical light and counteracting magical light are a GM note.
  - The area itself comes from the lingering compiler (the rewritten sentence). The blessing, the caster's exclusion and the note are merged into it, with the sentence the compiler read (`basic-save-core.js`).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 35 | Batch 36 |
| --- | --- | --- |
| Ongoing | 7 | 8 |
| Not enabled | 35 | 34 |

Resolved: 191 of 227.

## Tests

`test/third-party-batch-36.test.js` (1). All 1,754 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-36-live-results.json), case `thirdPartyBatch36`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| Cast at rank 6, an ally blessed | The module's Effect: light 5/10, fast healing |
| A foe beside the ally ends its turn | Not exposed |
| A foe 20 feet off in the dark ends its turn | Exposed; a failure: 6d4 cold, 16 taken |
| A foe 65 feet away ends its turn | Not exposed |
| The ally moved out of the emanation | Its blessing removed |
