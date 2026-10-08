# Rank 8 batch 16: group 5, part 1

2026-10-05. Three battle forms of feature group 5. Each is PF2e's own Effect, plus the abilities its stat block lists that the Effect doesn't carry.

| Spell | Now |
| --- | --- |
| Monstrosity Form | PF2e's Effect, with the option picked on it. **Phoenix:** Shroud of Flame is a 20-foot region following the caster. A creature that enters it or ends its turn there takes 2d6 fire, once per turn. The form's card switches it on or off on a Sustain. **Cave worm:** Inexorable removes Paralyzed, Slowed and Stunned as the caster's turn ends. **Sea serpent:** the card's Spine Rake is a basic Reflex save for 4d8+10 slashing, for the creatures the GM targets. "Enough space or the spell is lost" is a GM note. |
| Nature Incarnate | **Green man:** Green Caress is a 60-foot region following the caster. Each enemy that isn't a plant saves (Fortitude) when it enters or starts its turn there, at most once a round: Clumsy 1 for 1 round, or Clumsy 2 on a critical failure. **Kaiju:** the card's Trample is a basic Reflex save for the foot's 6d6+10 bludgeoning. Unstoppable's immunity is PF2e's; ignoring difficult terrain is a GM note. |
| Qi Form | PF2e's Effect (fly Speed, the Strike dice of the chosen type, the save adjustments). The corona is a 5-foot region following the caster: 2d6 of the chosen type to each creature starting its turn there. The card's control switches it between 5 and 30 feet on a Sustain. Countering darkness is a GM note. |

New runtime:

- **Form riders:** a form's auras are regions following the caster. Each deals its damage, or rolls each creature's save, by itself, and switches or resizes from the form's card.
- **Turn-end recovery:** listed conditions are removed as the caster's turn ends.
- **The form's card:** moving saves for the targeted creatures.
- **Choice gating:** each rider applies only to the option picked on PF2e's Effect.

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-8-batch-16.test.js` is new. A whole-corpus compile (b784 → b785) changed only these three spells.

## Evidence

[Live evidence](phase-rank-8-batch-16-live-results.json), case `rank8Batch16`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Monstrosity Form (phoenix): a creature ending its turn in the shroud | 2d6 fire (none when it appeared); switched off, then on again |
| Monstrosity Form (cave worm): Slowed and Paralyzed, then Stunned | All removed as the caster's turn ended |
| Monstrosity Form (sea serpent): Spine Rake, a failure | 4d8+10 slashing; no shroud on its card |
| Nature Incarnate (green man): an enemy, a plant enemy and an ally start their turns in the aura | The enemy is Clumsy 2; the plant and the ally aren't |
| Nature Incarnate (kaiju): Trample, a failure | 6d6+10 bludgeoning |
| Qi Form: a creature starting its turn in the corona; the Sustain control | 2d6 force; the region grows from 5 to 30 feet |
