# Spellshape batch 8: family D, the damage's type and resistances

2026-10-05. Feats and a wand that change what the spell's damage is, or how much resistance stops it.

- **Type:** a "damage-type" rider swaps every type the spell deals (`shapeTypeSwapFor`, as Chaotic Spell's).
- **Metal:** chosen at the cast, added to the card's bludgeoning, piercing and slashing damage (`shapeMaterialFor`).
- **Resistances lowered:** Cataclysm's "10 lower" add-back now takes a list: each shape's types, up to the caster's level (`shapeResistanceLowersFor`).
- **Nonlethal:** a creature the card brings to 0 Hit Points is Unconscious, not dying or dead. Wand of Mercy's is optional, chosen at the cast.
- **Reading:**
  - "If you use your next action to Cast a Spell" leads;
  - "a witch cantrip or witch spell" (the table's);
  - "deals bludgeoning, piercing, or slashing damage";
  - "has the monk trait and no duration";
  - "doesn't have the death or void trait";
  - a wand's "it must deal damage" and "can't have the death, void, or nonlethal traits".

| Feat or wand | Now |
| --- | --- |
| Spiritual Secret | The spell's damage is spirit. |
| Golden Dragon's Bounty | The physical damage is the chosen cold iron, silver or steel (adamantine from 14th level). |
| Overwhelming Energy, Surging Might, Overwhelming Breath | Resistance to the listed types ignored up to the caster's level. |
| Nonlethal Spell, Wand of Mercy | Knocked out at 0 Hit Points. |
| Steam Spell | Read (the table's). |
| Bizarre Transformation | Read; the GM's note. |

## Tests

`test/spellshape-batch-8.test.js` is new. Coverage: 66 of 131 feats and 13 of 49 wand kinds read.

## Evidence

[Live evidence](phase-spellshape-batch-8-live-results.json), case `spellshapeBatch8`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Spiritual Secret on Fireball | Spirit damage |
| Golden Dragon's Bounty (silver) on Pummeling Rubble, against weakness 5 to silver | 6 rolled, 11 dealt; the silver weakness applied |
| Overwhelming Energy (10th level) on Fireball, against fire resistance 10 | 20 rolled, 20 dealt |
| Nonlethal Spell on Fireball, 3 Hit Points | 0 Hit Points, Unconscious; not dying or dead |
| Wand of Mercy (nonlethal) on Pummeling Rubble, 3 Hit Points | Unconscious; not dead |
| Steam Spell on Fireball | Read; met |
