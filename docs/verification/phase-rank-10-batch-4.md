# Rank 10 batch 4: group 9, part 1

2026-10-05. Blast cards: save parts for creatures in different places, damage types the caster picks, and what a blast leaves behind.

| Spell | Now |
| --- | --- |
| Falling Stars | **In a central burst**: 6d10 bludgeoning plus 14d6 of the type picked on the card (sonic, fire, cold or electricity), one basic Reflex save. **Only in an explosion**: the 14d6 only. The dice rise with the rank (1d10 and 2d6 each). |
| Planar Collision | **The collision**: 8d6 force plus 8d8 of the plane's type (picked), basic Reflex. A failure pushes 25 feet from the centre and a critical failure 50 (push reminders). **The ruined ground**: a placed burst of difficult terrain where a creature ending its turn takes 15 of the plane's type, for a year and a day. |
| Cataclysm | One basic Reflex save, for creatures **on the ground** (acid, quake, cold, electricity, tsunami, fire), **flying** (the winds instead of the quake) or **swimming** (the tsunami doubled). "Resistances 10 lower" is a GM note. |
| Vampiric Revelry | **2 actions**, **3 actions** and **Two rounds** each roll 12d6 void (basic Fortitude). The caster gains temporary Hit Points equal to half the most damage dealt (all of it for two rounds), for 1 minute. **Allies' temporary Hit Points** gives the targeted allies the same amount. Two rounds also has the 60-foot teleport. |
| Metallic Meteorite Glyph | **2 actions** (1 creature) or **3 actions** (up to 3): 8d12 bludgeoning, basic Reflex. **Two rounds: the glyphs** last 1 minute on their creatures; the module rolls the smaller meteor (6d12, basic Reflex) at the end of each of the creature's turns. |

New runtime:

- Text formulas with several pools and the rank in the dice, and the last pool's type picked on the card.
- The hazard part's picked type and terrain.
- The **temp-share** and **glyph** parts, and turn-end saves.

## Tests

`test/rank-10-batch-4.test.js` is new. A whole-corpus compile (b792 → b793) changed these five spells. It also changed Storm Lord's bolt and Control Sand's Sandblast, whose stated rows now scale the text's damage (`degreeScaled`), as Planar Collision's do live.

## Evidence

[Live evidence](phase-rank-10-batch-4-live-results.json), case `rank10Batch4`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Falling Stars (fire): centre and outer failures | 82 and 52 |
| Planar Collision (fire): collision failure; a creature ends its turn on the ground | 67 and the push reminder; 15 fire, difficult terrain |
| Cataclysm: a failure on the ground | 88 |
| Vampiric Revelry: 3 actions' failure; the ally's share | 48 dealt; the caster 24 temporary Hit Points; the ally 24 |
| Metallic Meteorite Glyph: two failures; the glyph at its turn's end | 61 each; 66 more for the marked creature |
