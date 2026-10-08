# Third-party batch 56: Coiling Grasp

2026-10-07. The fifty-sixth batch of the third-party modules' spells.

## What changed

- **Coiling Grasp (Magus+)** (new `weapon-grapple.js`, kind `weapon-grapple`; `effect-runtime.js`; `main.js`):
  - **Size:** Medium or smaller, Large from 3rd rank, Huge from 6th, Gargantuan from 9th. A larger target is refused.
  - **The caster's Effect** lasts the sustained 4 rounds and holds the target. Its card's control maintains the Grapple on each Sustain (`weaponGrapple`, also on the API).
  - **The Grapple** rolls whichever of Athletics and the spell attack modifier is higher, against the target's Fortitude DC.
    - Critical success: Immobilized. Success: Grabbed. Each lasts until the end of the caster's next turn and replaces the last hold.
    - Failure: nothing.
    - Critical failure: the target's choice (asked) of grabbing the caster or knocking it Prone.
  - The required weapon and hand, Strikes against the target, and the Escape are notes.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 55 | Batch 56 |
| --- | --- | --- |
| Effect | 86 | 87 |
| Not enabled | 14 | 13 |

Resolved: 214 of 227.

## Tests

`test/third-party-batch-56.test.js` (1). All 1,776 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-56-live-results.json), case `thirdPartyBatch56`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 3rd on a Huge foe | Refused (larger than Large) |
| A Large foe, success | Grabbed (spell attack, the higher modifier) |
| Sustain, critical success | Immobilized; Grabbed gone; one hold |
| Sustain, critical failure; the target picks Prone | The caster Prone; no hold |
