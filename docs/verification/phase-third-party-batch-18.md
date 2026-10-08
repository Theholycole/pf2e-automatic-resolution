# Third-party batch 18: Wishful Thinking, Life of the Party

2026-10-06. The eighteenth batch of the third-party modules' spells: two more Effect + note spells whose module Effect is now proved against the text (`effect-note-proof.js`).

## What changed

- **Wishful Thinking (Oracles+)**:
  - "Choose an ally … choosing one of the listed effects" claims the module's two choices: one, and a second from 9th rank ("You can choose two effects instead of 1"). It also claims the fly Speed offered from 6th.
  - Each listed effect claims its rules behind its choice, and the 6th rank's "+1" is checked on both bonuses:
    - +1 status to attack rolls and saving throws (+2 from 6th);
    - +2 status to one chosen skill (+3 from 6th);
    - a 30-foot climb Speed with imprecise scent 30;
    - a 30-foot swim Speed. Its water breathing is a note.
  - The Deception check against the target's Will DC at the end of each turn (the spell ends on a failure) is a note.
  - A proof's sentence can now claim fixed-rank Heightened entries its rules already carry (`heightenedClaims`).
- **Life of the Party (Oracles+)**:
  - The treat's 5 temporary Hit Points (+2 a rank, checked for every rank) and +2 status bonus to damage are the module's Effect, applied to the creature that eats it.
  - Filling the hands each turn, a second treat's Sickened 1, and removing the damage bonus once the temporary Hit Points are gone are notes.
- **Answers ahead** (`effect-runtime.js`): the Effect + note route now presets PF2e's choice from `choiceSelections` (as the Effect route does), so a macro or test can give it. Otherwise PF2e asks the player.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 17 | Batch 18 |
| --- | --- | --- |
| Effect | 56 | 58 |
| Effect + note (unproved) | 4 | 2 |

Resolved: 168 of 227.

## Tests

`test/third-party-batch-18.test.js` (2). All 1,729 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-18-live-results.json), case `thirdPartyBatch18`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Wishful Thinking, rank 3, attack bonus picked | +1 to the ally's Reflex save; the Effect applied |
| Life of the Party, rank 2 | 7 temporary Hit Points and +2 damage on the ally |

(The first run stopped at PF2e's own choice prompt; the preset answer was then added and the case ran unattended.)
