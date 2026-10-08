# Spellshape batch 13: the last feats

2026-10-05. Every one of PF2e's 131 spellshape feats is now read.

- **Riders added:**
  - Dousing Spell's DC 10 and flat check on persistent acid or fire;
  - Shadow Spell's ±2 on a chosen creature (a newer one ends the older);
  - Shared Sight's spiritsense on the targeted allies;
  - Sinbladed Spell's bleed on a hit or failed save;
  - Spell Shroud's Concealed around the caster until its next turn;
  - Vigorous Anthem's PF2e Effect on the caster and the anthem's allies;
  - Coven Spell's PF2e Effect on the ally who just cast (its card is its reaction);
  - Apparition's Reflection's Confused.
- **Feats with no "If your next action" lead** (actions such as Knowledge of Shapes, Recover Spell): each sentence read; the preconditions the table's.
- **Reading:**
  - "If the next spell you cast is";
  - "targeting a single creature";
  - "deals energy damage";
  - "affects one or more of your allies";
  - "targets you";
  - "summons a creature";
  - a spell named in the flavour;
  - Harrow Casting's suits (the GM's).

| Feat | Now |
| --- | --- |
| Dousing Spell | Persistent acid or fire: DC 10, a flat check now. |
| Shadow Spell | +2 Stealth or –2 Perception for 1 round on the chosen creature. |
| Shared Sight | Spiritsense for 1 minute on the targeted allies. |
| Sinbladed Spell | Bleed equal to the rank on a hit or failed save (no such spells in PF2e 8.5 yet). |
| Spell Shroud | Concealed within 15 feet until the caster's next turn. |
| Vigorous Anthem | PF2e's Effect on the caster and its allies in the anthem. |
| Coven Spell | PF2e's Effect on the casting ally. |
| Apparition's Reflection | Confused until the end of the caster's next turn. |
| The rest | Read; the table's or the GM's notes. |

## Tests

`test/spellshape-batch-13.test.js` is new and checks that every feat in the export is read. Coverage: 131 of 131 feats.

## Evidence

[Live evidence](phase-spellshape-batch-13-live-results.json), case `spellshapeBatch13`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Dousing Spell on Acid Grip, the foe's persistent fire (DC 15) | Ended by the flat check |
| Shadow Spell on Steal Shadow (the foe fails) | –2 Perception |
| Shared Sight on Heroism, the ally targeted | Spiritsense |
| Spell Shroud on Mystic Armor | Concealed: the caster, the foe, the ally |
| Vigorous Anthem on Courageous Anthem | PF2e's Effect on the caster and the ally |
| Coven Spell after the ally's Fireball | PF2e's Effect on the ally |
| Apparition's Reflection, then Fireball | Confused |
| Energy Fusion, Harrow Casting, Knowledge of Shapes | Read |
