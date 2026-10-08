# Third-party features batch 36: focus pool

2026-10-07. The focus-pool family's features that change Focus Points ([audit](../planning/third-party-features-audit.md)).

## What changed

- **`scripts/plus-focus-runtime.js`** (new): `readFocusFeature` reads four texts; their hooks are in `main.js`.
  - Golden Core: the Refocus card restores 2 Focus Points, or the whole pool from 18th level.
  - I Am Omnipotent!: its card checks the last spell card for a critical. It applies Stupefied 1 until the end of the next turn. A wizard focus spell cast meanwhile gets its Focus Point back, and 10 minutes' immunity follows when the Effect ends.
  - Bargain Soul: when its Effect is put on, 1 Focus Point and a spent slot at least one rank below the highest (asked).
  - Revitalizing Bun: revitalized for an hour, with a button that restores a Focus Point once and then gives a day's immunity. Refused without a pool or while immune.
- **The census** reads `readFocusFeature`.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-36.test.js` (1). All unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-36-live-results.json), case `thirdPartyFeaturesBatch36`. Each fixture's pool comes from a test rule (PF2e derives its size).

| Step | Result |
| --- | --- |
| Golden Core at 6th, Refocus (pool 0/3) | 2 |
| At 18th, Refocus (0/3) | 3 |
| Fear critically failed, then I Am Omnipotent! | Stupefied 1 |
| Force Bolt at 3 (pool 1/1) | Still 1: "Force Bolt spends no Focus Point" |
| The Effect ended, then I Am Omnipotent! again | Immune; refused |
| Bargain Soul's Effect (pool 0/2, slots 2/3, 3/3, 1/2) | Focus 1; slots 3, 3, 1 (the rank-1 slot regained; rank 3, the highest, excluded); Doomed 1, Drained 1 |
| Revitalizing Bun, then its button (pool 0/1) | Revitalized; Focus 1; immune; the Effect gone |
