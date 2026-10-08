# Third-party batch 37: Shadow Puppetry

2026-10-06. The thirty-seventh batch of the third-party modules' spells: a sustained area that deals its damage again on each Sustain, with no save.

## What changed

- **Shadow Puppetry (Wizards+)** (new `pulse-area.js`, resolution kind `pulse-area`):
  - The caster chooses one of the text's ten damage types; the card asks. The GM places the burst.
  - Its damage goes to each creature in it when cast and on the first Sustain each turn: (1 + 1 per rank above 1)d6 of that type, with no save.
  - The text states no save. The item's two PF2e variants add a Will or Reflex save that isn't in the text, so they're not used.
- **Area pulses** (`ongoing-families.js`): a region area can carry `sustainPulse`. `areaPulse` deals the area's damage to every creature in it at once, when started and on the first Sustain each turn (never twice in a turn).

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 36 | Batch 37 |
| --- | --- | --- |
| Effect | 66 | 67 |
| Not enabled | 34 | 33 |

Resolved: 192 of 227.

## Tests

`test/third-party-batch-37.test.js` (1). All 1,755 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-37-live-results.json), case `thirdPartyBatch37`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| Cast at rank 2, fire | 2d6 fire to the creatures in the burst (the test foe took 5); none to the foe outside |
| Next round's first Sustain | Again (8 taken) |
| A second Sustain that turn | No more damage |

The burst also covered one of the scene's own tokens, which took the damage too.
