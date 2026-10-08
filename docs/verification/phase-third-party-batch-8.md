# Third-party batch 8: The End is Nigh, Sensory Deprivation, Bewilder

2026-10-06. The eighth batch of the third-party modules' spells.

## What changed

- **The End is Nigh (Oracles+)** (`src/compiler/third-party-rows.js`):
  - "Regardless of the result, a creature is then temporarily immune for 10 minutes" is read (`save-preamble.js`: "a creature").
  - The critical success's "You see your own fate closing in on you and become Frightened 1" is the caster's condition.
  - The failing rows give PF2e's Frightened 2 (3 on a critical failure, with Fleeing for 1 round).
  - A note for the spell's duration holds the misfortune on its next attack roll or save: PF2e removes it after that roll, which ends the spell. While it lasts, the creature's frightened can't fall below 1: `note-watchers.js` puts it back as the creature's turn ends (`conditionFloor`).
- **Sensory Deprivation (Witches+):**
  - On the card, the caster picks eyes, hands or mouth. On a critical failure a second pick is asked (`casterChoice.twoOn`, `also`).
  - Each pick is a note for the row's time (1 round on a success, the spell's otherwise):
    - eyes: PF2e's Dazzled;
    - hands or mouth: its manipulate or auditory spells are refused at the cast (`castForbid`, `casting-rules-runtime.js`); its other such actions are the GM's.
  - A Seek disbelieves it: Perception against the spell DC ends the spell.
- **Bewilder (Magic+):**
  - The DC 6 flat check on each hostile action (DC 11 on a critical failure), and treating a creature as an ally after failing against it, are a note the GM plays.
  - The success's note lasts until the end of its next turn; the others last the spell.
  - On a failure the module rolls the end-of-turn Will save; a success ends it.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 7 | Batch 8 |
| --- | --- | --- |
| Save | 36 | 39 |
| Not enabled | 87 | 84 |

## Tests

`test/third-party-batch-8.test.js` (3). All 1,702 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-8-live-results.json), case `thirdPartyBatch8`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| The End is Nigh, rank 6, failure | Frightened 2; after two turn ends still 1; the note gone after its next save. Critical success: the caster Frightened 1 |
| Sensory Deprivation, critical failure, hands and mouth | Both notes; not Dazzled; the foe's manipulate spell refused |
| Bewilder, rank 4, failure | The note with the end-of-turn Will save |
