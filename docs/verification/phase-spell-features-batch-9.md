# Spell features batch 9: creature abilities on spells

2026-10-06, from the spell features audit (part G3).

## What was read

I read PF2e's creature ability glossaries for abilities whose text mentions spells, counteracting or magic: 111 of 537 (55 general, 482 family abilities). Most are:

- innate spells PF2e casts itself;
- DC notes ("use the high spell DC for its level");
- flavour.

## What changes a spell

The abilities below change how a spell resolves. They are read from each creature's own copy on the scene, so its numbers are the creature's (`scripts/creature-spell-abilities-runtime.js`):

| Ability (example creature) | At the table |
| --- | --- |
| Sacrilegious Aura (graveknights) | A vitality spell cast in the aura is counteracted automatically. The modifier is the creature's; the counteract rank is half its level, rounded up. Both of PF2e's wordings ("a counteract modifier of +17", "a +27 counteract modifier") are read |
| Lightning Rod (shock zombie) | An electricity spell within 30 feet: a reaction card for the GM, at the stated counteract rank and modifier |
| Intercept Summons (diabolic dragon) | A summon spell within 30 feet: a reaction card. It uses the dragon's Hell Lore, at counteract rank half its level. On a success the spell is lost and the GM is told about the summon fiend |
| Blasphemous Aura (path maiden) | A healing spell cast in the aura: the caster's Will save against the maiden's spell DC – 3. On a failure, the spell's targets get the module's half-healing Effect, used once. A critical failure is told to the GM |
| Eldritch Attraction (mana wastes mutant) | A spell cast within 30 feet: the Will save at the creature's DC; a failure gives a note Effect (Stride toward it, no Delay or reactions) |
| Warped Fulu (jiang-shi) | Immune to a spell cast from a scroll or wand (PF2e's embedded spell) while its toggle is on. It's left out of the spell's cards |
| Channel Magic (graveknight) | Read like Spellstrike (batch 8): the delivery card; the Strike's result is the spell attack's |
| Metamagic Alteration (lich) | Read with Draw From the Pages: posting the ability arms the next spell. A burst of 10 feet or more gains 5 feet; a line or cone of 15 feet or less gains 10. The range alternative isn't measured |

The glossary's templates have placeholders ("+x", "dc:"), so they're read only once a creature has its numbers.

## The GM's

- Harmful Claw's degree shift;
- Mythic Immunity (its chosen kind);
- Obscure Revelations' secret counteract;
- Tied to the Land;
- Mindbound;
- Taboos;
- Instrument of Faith;
- coven spells;
- Coordinated Casting (troops).

## Tests

`test/spell-features-batch-9.test.js` (3) covers:

- the readers on the creatures' own texts and the glossary placeholders;
- Draw From the Pages;
- Metamagic Alteration.

## Evidence

[Live evidence](phase-spell-features-batch-9-live-results.json), case `spellFeaturesBatch9`, in the `pftest` world. The abilities are copied from PF2e's creatures (Caliddo Haruvex, the Spring's Path path maiden, the Provincial Jiang-shi, the Graveknight Champion) or from the glossary with numbers.

| Step | Result |
| --- | --- |
| Heal within 30 feet of the graveknight (+17, level 10) | Counteract 25 against DC 21, rank 5 against 1: the Heal lost |
| Heal within the path maiden's aura | Will critical failure; the ally's 20 healing gives 10; the halving spent |
| A wand's Fear at the jiang-shi | Immune: left out |
| Electric Arc beside the shock zombie | The GM's card; not countered (rank 3 against 5); the spell kept |
| Summon Animal beside the dragon | The card; countered: the summon lost |
| Fear within 30 feet of the mutant | Will critical failure: "Stride toward" Effect |
| An NPC with Channel Magic casts Ignition | The delivery card |
| The lich's Metamagic Alteration, then Fireball | The burst 20 → 25 feet |
