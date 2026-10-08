# Third-party batch 7: weakness and persistent damage from the text

2026-10-06. The seventh batch of the third-party modules' spells.

## What changed

- **Hemophilia (Magic+)** (`src/compiler/third-party-rows.js`):
  - A note for the spell's duration holds the weakness to bleed: the cast rank's ("Heightened (+1) The weakness … increases by 1"), doubled on a critical failure.
  - On the failing rows, the GM's Ongoing control raises Drained by 1 the first time the creature takes bleed damage (a new `once` on the triggered increase). A second report is refused.
  - The module's Effect matches the text at each degree (data note).
- **Creeping Cold (Magic+):** its item has no damage, so "1d6 persistent cold damage with a Fortitude save" (+1d6 a rank) is rolled from the text, halved on a success.
  - On a success, a –1 status penalty to Reflex saves until the start of its next turn.
  - On a failure, –1 for as long as it takes that persistent cold damage (the note ends with it); –2 on a critical failure.
- **Ravaging End (Witches+):**
  - The caster's choice of acid, fire or poison types both the direct and the persistent damage. The item's types are placeholders, and a new `allPools` choice retypes every part of the text's formula.
  - Damage is +1d4 and +2 persistent a rank.
  - Each damaging row's note holds the persistent damage: the card ties the condition to the note (`endsWithEffectUuid`), so it ends when the spell does.
  - The recovery DC is set from the row: 15, or 17 on a critical failure. Assisted recovery is on the note.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 6 | Batch 7 |
| --- | --- | --- |
| Save | 33 | 36 |
| Not enabled | 90 | 87 |

## Tests

`test/third-party-batch-7.test.js` (3). All 1,699 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-7-live-results.json), case `thirdPartyBatch7`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Hemophilia, failure | Weakness 1 to bleed; the first bleed reported: Drained 1; a second report refused |
| Creeping Cold, rank 2, failure | 2d6 persistent cold; Reflex –1; the persistent damage removed: the penalty too |
| Ravaging End, fire, critical failure | 1d4 fire + 2 persistent fire, doubled; persistent fire at DC 17, tied to the note; the note removed: the persistent damage too |
