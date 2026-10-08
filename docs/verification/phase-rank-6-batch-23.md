# Rank 6 batch 23: group 5, part 4

2026-10-05. Two forms PF2e has no Effect for. The module generates one from the text (the "forms: generate Effect" decision).

| Spell | Now |
| --- | --- |
| Blanket of Stars | The module's Effect for 10 minutes: +2 status to Stealth to Hide and Sneak. A night-sky toggle on the Effect applies Invisible when still or Concealed when moving, and nothing when off. A 5-foot aura follows the caster. Each creature ending its turn adjacent rolls the Will save (mental, visual): Dazzled on a failure, Confused and Dazzled on a critical failure, until the end of its next turn. |
| Mantle of Heaven's Slopes | The module's Effect for 1 minute with two option slots, which work like PF2e's own mantles. **Threshold's Walls:** cover (+2 AC, +2 Reflex against areas, +2 to Hide and Sneak). **Proelera's Arsenal:** a reach and shove unarmed Strike in the polearm group, 1d10 piercing plus 1d8 spirit. **Clarion's Sanctity:** +2 status to Recall Knowledge and Sense Motive. **Requius's Rest:** fast healing 2. Swapping an option is changing a slot. The silver, the free Sense Motive and Shove, and the projected voice are GM notes. |

New runtime:

- **Generated forms** (`generated-form`): the module's Effect on the caster, with the form riders.
- **Toggle grants:** a toggle's conditions are added and removed as it changes.
- **Saving auras with several conditions,** expiring at the end of a turn and respecting trait immunities.

## Tests

`test/rank-6-batch-23.test.js` is new. A whole-corpus compile (b787 → b788) changed only these two spells.

## Evidence

[Live evidence](phase-rank-6-batch-23-live-results.json), case `rank6Batch23`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Blanket of Stars: the toggle still, moving, off | Invisible, then Concealed, then neither |
| Blanket of Stars: a creature ends its turn adjacent (critical failure) | Confused and Dazzled |
| Mantle of Heaven's Slopes: Walls and Arsenal | +2 AC; the arsenal Strike on the sheet |
| Mantle of Heaven's Slopes: Arsenal swapped for Rest | No arsenal; fast healing |
