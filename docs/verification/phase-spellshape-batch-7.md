# Spellshape batch 7: family J, how the spell is cast

2026-10-05. Feats that change the casting rather than the spell.

- **The slot not spent:** given back once the cast is recorded (`refundSlot`). A prepared slot is marked unexpended, a spontaneous or flexible slot regains 1, an innate spell regains a use.
- **The table's:** subtle, fewer actions, reactions, identifying and counteracting, cover, concealment, senses, Look Again. These are read with no GM note.
- **Reading:**
  - a requirement the module can't check is the table's when the feat only does the table's or gives a slot back;
  - a class's rule before the lead (Quickened Casting's "Frequency once per day Bard If your next action …") reads as the table's;
  - a feat's costs before the lead ("Spend a Mythic Point.", "Your spellsurge ends.", "Instantly destroy one undead minion …") are the table's;
  - legacy schools ("a necromancy spell") are the table's.
- **Requirements added:** "of 5th rank or lower"; "from a spell slot"; "requires a spell attack roll"; "with the mental trait".

| Feat | Now |
| --- | --- |
| Bloodline, Ley Line, Mystery Conduit; Unlimited Potential | 5th rank or lower, no duration: the slot given back. |
| Galvanize Spell, Sepulchral Sublimation | The slot given back; their costs and limits the table's. |
| Conceal, Cryptic, Melodious, Humble Spell | Read (the subtle trait). |
| Quickened Casting, Apparition's Quickening, Quickened Attunement | Read (fewer actions). |
| Battlefield Arcana, Elaborate Flourish, Incriminating Spell, Through Spell, Wind-Tossed Spell, Unusual Composition, Look Again | Read (the table's). |

## Tests

`test/spellshape-batch-7.test.js` is new. Coverage: 58 of 131 feats and 12 of 49 wand kinds read.

## Evidence

[Live evidence](phase-spellshape-batch-7-live-results.json), case `spellshapeBatch7`, in the `pftest` world. The spells are cast with their slots spent, as at the table.

| Step | Result |
| --- | --- |
| Bloodline Conduit on a prepared Fireball | The prepared slot unexpended |
| Mystery Conduit on a spontaneous Fireball; on 6th-rank Chain Lightning | Still 5 slots; the 6th-rank slot spent ("it's above rank 5") |
| Conceal Spell (selector); Quickened Casting and Elaborate Flourish (cards) | Read; no GM note |
| Through Spell on Fireball | "it has no spell attack roll" |
