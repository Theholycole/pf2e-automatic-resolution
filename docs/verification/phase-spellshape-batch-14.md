# Spellshape batch 14: the wands

2026-10-05. Every wand kind that changes its spell is now read: 49 of 49.

- **Mechanics added:**
  - terrain from the spell's area (the Snowfields; Hopeless Night with a turn-end Will save);
  - the landing card (Crushing Leaps);
  - a kill's burst (Slaughter);
  - counteracts on the targeted creature (Mental Purification at the spell's rank + 1; Arboreal Wand at half the item level);
  - healing as the caster's next turn starts (Overflowing Life);
  - an optional Mythic Point (Cyrusian Wand).
- **A wand's own rule the module doesn't apply** is whispered to the GM at the cast (`wandRule` notes). Narration is skipped, except that a sentence with a rule's words (duration, forms, hit, target…) is told.
- **Reading:**
  - a wand with no rider sentence (Magic Wand) is read with none;
  - an unlinked spell name (Pistol Wand);
  - ", and can attempt …" clauses;
  - "but" without a comma;
  - any crafting limit the module doesn't check is the table's;
  - a wand naming its spell applies only to it.
- **Fixes:**
  - a creature in a just-made Region is found by its centre when Foundry hasn't recorded it yet;
  - a care counteract's rank includes the wand's bonus.

## Tests

`test/spellshape-batch-14.test.js` is new and checks that every wand in the export is read. Coverage: 131 of 131 feats and 49 of 49 wand kinds.

## Evidence

[Live evidence](phase-spellshape-batch-14-live-results.json), case `spellshapeBatch14`, in the `pftest` world. Live batches 1 to 13 pass again on the final code.

| Step | Result |
| --- | --- |
| Wand of the Snowfields: Howling Blizzard's template | The terrain: difficult, 1 minute |
| Wand of Hopeless Night: Darkness's area, the foe ending its turn inside | The DC 20 Will card; Frightened 1 |
| Wand of Crushing Leaps: the landing beside the foe | Off-Guard; broken ground |
| Wand of Slaughter: Execute slays the foe | 14 void to the ally beside it |
| Wand of Mental Purification: Soothe on the ally with a mental Effect | The counteract card, rank 2 |
| Wand of Overflowing Life: Heal; the caster's turn | 15 Hit Points |
| Wand of Shattering Images (its card) on Mirror Image | The GM's note |
