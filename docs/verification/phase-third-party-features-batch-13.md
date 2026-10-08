# Third-party features batch 13: the other seven wickets and Wicket Infusion

2026-10-07. The thirteenth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)). With it, all eleven of Magic+'s wickets are read, using the rules of batch 12 (inside the dominion, once a round, Overwhelming from 11th).

## What changed

- **Mortisor:**
  - Threaded: a creature in the dominion below half its Hit Points, targeted by a death or void spell, becomes Frightened 2 unless immune to emotion, fear or mental; it is then immune for 1 minute (`targeted-condition`; its Hit Points as targeted, before the spell's damage).
  - Overwhelming: spirit instead of void, asked; +2 status to saves against mental effects for 1 round when the spell reduces a creature to 0 (`on-kill-rules`). Death against undead is the table's.
- **Savior:**
  - Threaded: a creature in the dominion that one of the caster's spells restores to full Hit Points gets the module's Effect: Savior's Grace (+1 attack, +2 damage, 1 round, matching the text) and is immune for 1 minute (`healed-full-effect`). The module's immunity Effect lasts 1 round, so the text's minute is used.
  - Overwhelming: the table's.
- **Atmosphor:**
  - Threaded: an air spell makes the caster float: a fly Speed equal to its land Speed until the end of its next turn, with the text's limits on the Effect.
  - A creature the sonic spell deafens is also Clumsy 1 while deafened (`follow`); its concentrate action to end it is the table's.
  - Overwhelming: bludgeoning instead of sonic, asked; the unrestricted flight is the table's.
- **Desolator:**
  - Threaded: lowering the light, and the cold weakness in darkness, is the GM's (a note naming the module's Effect: Frigid Darkness).
  - Overwhelming: spirit instead of cold, asked; the spirit weakness the same Effect's.
- **Fabricator:**
  - Threaded: an illusion spell; a creature in the dominion and the choice are asked: −2 circumstance to disbelieve the caster's illusions, or +2 status to sight-based Perception. The Effect lasts while the dominion does.
  - The module's Effect gave both at once whatever was chosen, so the text's is used.
  - Overwhelming: the table's.
- **Magnetor:**
  - Threaded: 2 creatures in the dominion are asked for. Each rolls a Fortitude save against the caster's spell DC, and on a failure is pulled 10 feet toward the other (`magnet-pull`). Choosing to fail is the table's.
  - Overwhelming: slashing instead of electricity, asked; a single-target metal spell gives weakness to electricity equal to its rank until the creature's next turn (the module's Effect lasts and uses the level, so the text's is used).
- **Ardor:**
  - Tethered: a second target on the card; both are halved, and both get +2 circumstance to their save (`twin-target`). Halving the durations is the GM's (noted).
  - Overwhelming: the table's.
- **Wicket Infusion** (spellshape): the trait to infuse is asked among the wicket's traits, and the wicket's riders read the spell as having it.
- **Runtime:**
  - `self-rules` gained `until` and a description.
  - A passive feature's preset choice can hold separate answers (`swap`, `pick`).
  - Effects tied to the dominion go with it.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 12 | Batch 13 |
| --- | --- | --- |
| cast-rider | 13 / 66 | 20 / 66 |
| spellshape | 38 / 51 | 39 / 51 |

## Tests

`test/third-party-features-batch-13.test.js` (2). All 1,819 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-13-live-results.json), case `thirdPartyFeaturesBatch13`, with batch 12 re-run (passing). The test caster is an 11th-level wicketeer inside its dominion; a copy of Hydraulic Push given the metal trait stands for a single-target metal spell.

| Step | Result |
| --- | --- |
| Mortisor, Sudden Blight: a foe at 100/500, another at 1 | Frightened 2 and immune; +2 against mental for the caster |
| Savior, Heal: the ally at 39/40 restored | Savior's Grace (+2 damage, +1 attack); immune 1 minute |
| Atmosphor, Gust of Wind | Fly Speed 25 |
| Fabricator, Illusory Object: the foe, the penalty | −2 to Perception/Will against illusions; gone when the dominion ends |
| Magnetor, Lightning Bolt: two foes fail | Pulled toward each other |
| Magnetor, a metal spell hits | Weakness 1 electricity |
| Ardor, Fear on two foes | +2 to the first's save; both halved |
| Desolator, Chilling Spray | The GM's light note |
| Wicket Infusion with air, Hydraulic Push | The caster floats (fly 25) |
