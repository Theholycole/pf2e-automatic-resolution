# Third-party batch 64: Spirit Boundary

2026-10-07. The sixty-fourth batch of the third-party modules' spells.

## What changed

- **Spirit Boundary (Magic+)** (new `spirit-boundary.js`, kind `spirit-boundary`; `effect-runtime.js`; `main.js`):
  - **The version:** chosen by the actions spent (`options.actions`, or asked):
    - one action: a 10-foot radius, (1 + rank) × 4 HP, reducing by 1 + rank;
    - two actions: 20 feet, 2 + rank × 12 HP, reducing by (1 + rank) × 2;
    - three actions: any radius from 5 to 30 feet (`options.radius`), as the two-action version, plus the Dismiss reaction.
    - The inline rolls are checked against the Heightened entry at every rank.
  - **The shield:** a region for the minute. The caster's Effect holds the shield's HP and reduction; both end with the record (`extraEntryUuids`).
  - **Crossing damage** (`boundaryOnDamage`, on each damage-taken message):
    - When the damage's origin and the creature damaged are on opposite sides of the edge, the damage is reduced and the HP given back.
    - The shield loses what it reduced, once per damaging effect.
    - At 0 HP it is destroyed and the spell ends.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 63 | Batch 64 |
| --- | --- | --- |
| Effect | 94 | 95 |
| Not enabled | 6 | 5 |

Resolved: 222 of 227.

## Tests

`test/third-party-batch-64.test.js` (1). All 1,784 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-64-live-results.json), case `thirdPartyBatch64`, in the `pftest` world.

| Step | Result |
| --- | --- |
| One action at 4th | 10 feet, 20 HP, reducing by 5 |
| One attack from outside on two creatures inside (12 each) | Each takes 7; the shield 20 → 15 (once) |
| Outside to outside | 12 taken; the shield unchanged |
| From inside to outside | 7 taken; the shield 10 |
| Two more effects across (15 each) | 10 and 10 taken; the shield at 0, its region gone |
