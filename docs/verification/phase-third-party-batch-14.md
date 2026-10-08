# Third-party batch 14: Liberator's Ferocity, Weapon Trance (Team+), Volley My Ally

2026-10-06. The fourteenth batch of the third-party modules' spells: three Effect + note spells whose module Effect is now proved against the text (`effect-note-proof.js`).

## What changed

- **Liberator's Ferocity (Clerics+)**:
  - "You gain resistance to all damage equal to twice the spell's rank … and a status bonus to damage equal to the same amount … for 1 round" claims the module's Resistance and damage bonus, both checked at twice the rank for every rank.
  - The Resistance's "all" is patched to PF2e's "all-damage".
  - The module's Effect has no end, so the text's round is applied (`durationOverride`). The Effect and the note both last 1 round (`native-outcome-effects.js` now takes an expiry with it).
  - What each part applies against (that attack, that creature) is a note.
- **Weapon Trance (Team+) (Oracles+)**:
  - The proficiency sentence claims the module's weapon choice and PF2e's two `MartialProficiency` equivalences (martial as simple, advanced as martial).
  - The cursebound sentence claims its +1 status bonus and the upgrade to +2 at cursebound 3.
  - The automatic Sustain, and applying the Effect again for a second weapon, are notes.
- **Volley My Ally (Magic+)**:
  - "Heightened (+2) Increase the range of the Strike by 15 feet." is the module's `AdjustStrike` range increment, checked as 0 at rank 3 and +15 every 2 ranks.
  - The Strike, the ally's arrival and its reaction Strike are notes.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 13 | Batch 14 |
| --- | --- | --- |
| Effect | 53 | 56 |
| Effect + note (unproved) | 7 | 4 |

## Tests

`test/third-party-batch-14.test.js` (3). All 1,722 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-14-live-results.json), case `thirdPartyBatch14`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Liberator's Ferocity, rank 2 | Resistance 4 to all damage; the Effect lasts 1 round |
| Weapon Trance (Team+) | A character's longsword picked; all 5 rules |
| Volley My Ally, rank 5 | The `AdjustStrike` Effect at level 5 |
