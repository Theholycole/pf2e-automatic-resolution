# Third-party batch 35: Overwhelming Festivities

2026-10-06. The thirty-fifth batch of the third-party modules' spells: an aura that hurts the foes in it when an emotion or fear takes hold of them.

## What changed

- **Overwhelming Festivities (Oracles+)** (new `trigger-aura.js`, resolution kind `trigger-aura`; new `scripts/trigger-aura-runtime.js`):
  - **The cast:** the module's Aura Effect goes on the caster. Its radius formula is proved against the text at every rank (15 feet, +5 per 2 ranks) when compiling and again at the cast rank. Its one Effect goes to enemies.
  - **The triggers** (the active GM's watcher, `main.js`): an enemy holding the aura's Effect that
    - fails a save with the emotion trait (PF2e's saving-throw message), or
    - newly becomes Frightened (the condition's creation)

    takes the text's persistent mental damage at the cast rank: (3 + 1 per 2 ranks)d4.
  - Persistent damage of one type doesn't stack, so a save and the Frightened it gives land as one.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 34 | Batch 35 |
| --- | --- | --- |
| Effect | 65 | 66 |
| Not enabled | 36 | 35 |

Resolved: 190 of 227.

## Tests

`test/third-party-batch-35.test.js` (1). All 1,753 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-35-live-results.json), case `thirdPartyBatch35`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at rank 3 | The 15-foot Aura; the two enemies within it hold its Effect, the one 40 feet away doesn't |
| An enemy in it fails a Will save with the emotion trait | Persistent 3d4 mental |
| Another becomes Frightened 1 | Persistent 3d4 mental |
| The far enemy fails the same save | Nothing |
