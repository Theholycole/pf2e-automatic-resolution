# Third-party batch 41: Shadow Wield

2026-10-06. The forty-first batch of the third-party modules' spells: a shadow-weapon attack that repeats on Sustain.

## What changed

- **Shadow Wield (Magic+)** (`glyph-versions.js` `fitShadowWield`):
  - Each PF2e variant is the spell attack PF2e's Spiritual Armament reads: melee 1d8 or ranged 1d6, +1 die every 2 ranks, checked against the text.
  - The type is the caster's choice of bludgeoning, piercing or slashing; void is there for the GM's "more detrimental".
  - The attack repeats on each Sustain.
- **A spell's own type toggle** (`basic-save-runtime.js`): the module item carries a toggle with a suboption per type, and type overrides that follow it. Those rule elements act through the caster's own copy of the spell, so they would retype the card's chosen damage. Before rolling, the card sets that toggle to its choice.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 40 | Batch 41 |
| --- | --- | --- |
| Save (spell attacks included) | 64 | 65 |
| Not enabled | 30 | 29 |

Resolved: 196 of 227.

## Tests

`test/third-party-batch-41.test.js` (1). All 1,759 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-41-live-results.json), case `thirdPartyBatch41`, in the `pftest` world.

| Attack (rank 3) | Result |
| --- | --- |
| Melee, slashing, hit | 2d8 slashing, 9 taken |
| Repeated on Sustain, void (the GM's), critical hit | 2d8 void, 14 doubled to 28 |
| Ranged, piercing, hit | 2d6 piercing, 8 taken |
