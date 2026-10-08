# Spellshape batch 11: families H and I, terrain and time

2026-10-05. Feats that make terrain, or change when the spell happens.

- **Terrain:**
  - each a Region of its own, with difficult terrain (a movement-cost behavior) and its hazard and end on a flag;
  - removed when its time is up (world time, or the caster's next turn);
  - a terrain card has the GM's button for a creature moving through; a creature ending its turn in a "moves into or ends its turn" terrain takes the hazard automatically (once a turn where the text says so).
- **The cast's area as terrain:** copied from the template as it's placed (Charred Remains).
- **Echoing Spell:** an Effect on the caster; the same spell's next cast gives its slot back.

| Feat | Now |
| --- | --- |
| Charred Remains | The spell's area: difficult and hazardous terrain for 1 minute (1 fire per square). |
| Snowdrift Spell | Snow around the chosen creature: difficult terrain until the caster's next turn. |
| Garland Spell | Thorns or vines at the targeted token: 2d6 (3d6 at 16th, 4d6 at 20th), once a turn; the caster immune. |
| Rockslide Spell, Worldsphere Gravity | Read (the GM's notes). |
| Echoing Spell | The second casting before the end of the next turn: the slot given back. |
| Form Control | Untamed Form 2 ranks lower; the duration the GM's note. |
| Into the Future, Sow Spell | Read (the GM's notes). |

## Tests

`test/spellshape-batch-11.test.js` is new. Coverage: 95 of 131 feats read.

## Evidence

[Live evidence](phase-spellshape-batch-11-live-results.json), case `spellshapeBatch11`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Charred Remains on Fireball, a template placed | The terrain made (difficult, 1 minute), kept after the template went; 3 squares: 3 fire |
| Snowdrift Spell on Chilling Spray (failure) | Snow around the foe; gone 7 seconds later |
| Garland Spell on Fungal Infestation (thorns at the foe) | 2d6 piercing once in the turn; the caster immune |
| Echoing Spell on Fireball, twice | Slots 3 → 2 → 2; the echo spent |
| Form Control on Untamed Form (3rd) | 1st |
| Rockslide Spell, Into the Future | Read |
