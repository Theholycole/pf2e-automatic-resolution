# Third-party batch 50: Garden of Crystals

2026-10-07. The fiftieth batch of the third-party modules' spells.

## What changed

- **Garden of Crystals (Oracles+)** (new `crystal-garden.js`, kind `crystal-garden`; `effect-runtime.js`; `ongoing-families.js`):
  - **The terrain:** the 20-foot emanation around where the caster stands is difficult terrain. "Though you can ignore it" is a reminder Effect on the caster.
  - **The clusters:** three 5-foot bursts the caster places (or `options.clusters`), each at least partly within the area.
    - Each cluster's 2×2 squares are walled off for movement.
    - Any creature in them is moved to the nearest free adjacent space.
  - **Beside the clusters:** a region over the squares around them; each creature inside holds the critical force dice (`DamageDice`, `critical: true`, on Strikes, spells and impulses).
    - 1d10, one more every 2 ranks. The module's Effect is checked against that count at ranks 4–10.
  - **Duration:** none is stated, so the area lasts until the GM ends it. `startRegionArea` now takes `durationSeconds: null`, which gives no maximum.
  - **Ending:** the walls, the terrain region and the reminder end with it. `startRegionArea` gained `extraEntryUuids`.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 49 | Batch 50 |
| --- | --- | --- |
| Effect | 80 | 81 |
| Not enabled | 20 | 19 |

Resolved: 208 of 227.

## Tests

`test/third-party-batch-50.test.js` (1). All 1,770 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-50-live-results.json), case `thirdPartyBatch50`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 4th, clusters at three points | 12 walls; the emanation's difficult terrain; the caster's reminder |
| A foe standing in a cluster | Moved to the nearest free adjacent space |
| An ally beside a cluster | `1d10 force` critical dice (and the moved foe beside it too) |
| The GM ends the spell | Walls, both regions, the reminder and the member Effects removed |
