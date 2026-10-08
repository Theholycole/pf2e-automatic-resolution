# Spellshape batch 3: family C riders on the save card

2026-10-05. Extra damage, splash, a Focus Point spent, one chosen creature, and Chaotic Spell's die.

- **Riders added:**
  - persistent damage by rank on a damaged creature, unless it already has that persistent damage;
  - splash damage by rank to creatures beside a damaged target;
  - a Focus Point spent for extra damage by rank, of a type the caster picks from the text;
  - one damaged creature chosen for an Effect: either generated (Marked for Rebuke's weakness 10, with a day's immunity), or PF2e's own with the spell's damage type (Forcible Energy), unless the creature resists that type;
  - Chaotic Spell's d6, rolled once per cast: the damage type changes and that result's rider applies.
- **Fix:** PF2e's ChoiceSet in a copied Effect is preset with the type (`rule.selection` and `rulesSelections`), so no prompt appears.

| Feat | Now |
| --- | --- |
| Burning Spell | A non-cantrip single-target damage spell: persistent fire equal to the rank on a damaged creature. |
| Consecrate Spell | Against one undead: a Focus Point spent for spirit or vitality damage by rank. With no Focus Point, the caster is told and nothing is added. |
| Detonating Spell | Splash damage equal to the rank to creatures beside a damaged target. |
| Marked for Rebuke | The caster picks one damaged creature: weakness 10 to all damage until the end of their next turn; immune for 24 hours. |
| Forcible Energy | The caster picks one damaged creature: PF2e's Effect with the spell's energy type, unless it resists that type. |
| Chaotic Spell | d6: acid (Sickened 1), cold (–10-foot Speeds), electricity (Off-Guard), fire, sonic, and so on, by the feat's table. |

## Tests

`test/spellshape-batch-3.test.js` is new. Coverage: 18 of 131 feats and 5 of 49 wand kinds read.

## Evidence

[Live evidence](phase-spellshape-batch-3-live-results.json), case `spellshapeBatch3`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Acid Grip with Burning Spell (failure) | 1d6 acid persistent; 2 fire persistent |
| Acid Grip with Consecrate Spell on an undead (1 Focus Point) | 0 Focus Points; 1 vitality more |
| Acid Grip with Detonating Spell | 2 splash to the creature beside it |
| Fireball with Marked for Rebuke (two damaged) | Only the chosen one has weakness 10; the immunity Effect too |
| Fireball with Forcible Energy | PF2e's Effect, 5 |
| Acid Grip with Chaotic Spell (rolled 3) | The rolled type and its rider |
