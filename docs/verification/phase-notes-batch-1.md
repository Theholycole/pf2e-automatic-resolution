# Notes batch 1: stated bonuses, Speeds and senses

2026-10-05, from the notes audit (`docs/planning/notes-automation-audit.md`). The user asked: "check all spells with notes and see if anything in notes could be automated".

A new note family, `stated-effect` (`src/compiler/stated-effect.js`, run by `#executeStatedEffect`), turns stated bonuses, Speeds and senses into an Effect per recipient. A recipient is the caster, each target, the caster and the targets, or the familiar. The family also handles:

- a toggle for a situational bonus;
- an option picked at the cast;
- an alternative when the recipient already has the Speed or sense;
- the recipient's land Speed written into a rule.

Every sentence of the spell must be a rule, a listed note, or narration with no rule in it. Anything else leaves the spell on its note.

| Spell | Now |
| --- | --- |
| Movanic Glimmer | +2 status to Perception and Will on each animal, +1 to Nature checks to Command an Animal; a creature that isn't an animal is refused. Before, the note had only the +2 |
| Chameleon Coat | +3 status to Stealth to Hide on each target (+4 from 8th) |
| Penumbral Disguise | +1/+2/+3/+4 status to Stealth to Hide, with an "In dim light or darkness" toggle |
| Uncover Device | +2 status to Thievery to Disable a Device |
| Discern Lies | +4 status to Perception with a "Someone Lies to you" toggle |
| Threefold Aspect | +4 status to Deception with a "pass as the chosen age" toggle |
| Chosen Gravity | +1 status to saves and Fortitude DC against forced movement (toggle; Shove and Reposition included); 1 hour from 6th |
| Part the Mists to Paradise | +4 status to saves on the caster and the targets |
| Stonesense | Tremorsense (imprecise) 100 feet, sustained |
| Elemental Sense | The option picked; Tremorsense and Mechanoreception (see invisibility) as senses, the others as notes |
| Enhance Senses | Low-light vision, or darkvision for a creature that already has it |
| Tiny Wings | A 20-foot fly Speed on the familiar, or +15 feet to its fly Speed. Before, the note had only the 20 feet |
| Feet to Fins | A swim Speed equal to the land Speed; land Speed 5 feet |

PF2e 8.5 keeps Speeds in `system.movement.speeds`. The land Speed is set through `system.movement.speeds.land.base`.

Personal Ocean stays on its note route, which counteracts the fires it moves through.

## Tests

- `test/notes-batch-1.test.js` (3).
- Updated to the new route: `cantrip-rank-1-batch-14`, `rank-3-batch-28`, `rank-4-batch-7`, `rank-4-batch-15`.

## Evidence

[Live evidence](phase-notes-batch-1-live-results.json), case `notesBatch1`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Movanic Glimmer on a wolf (animal); on a humanoid | Will +2, Perception +2, 24 hours; refused |
| Chameleon Coat on two targets at 5th; at 8th | Both +3 (Hide); +4 |
| Penumbral Disguise at 4th | +2, the toggle |
| Uncover Device | thievery +2 on action:disable-a-device |
| Discern Lies: the toggle off, then on | +0, then +4 Perception |
| Threefold Aspect; Chosen Gravity | The toggle and the bonus; saves and Fortitude DC |
| Part the Mists | The target's Fortitude +4; the caster's Effect too |
| Stonesense; Elemental Sense (tremorsense) | tremorsense 100; tremorsense 30 |
| Enhance Senses: a plain creature; one with low-light vision | low-light vision; darkvision |
| Tiny Wings (the caster's familiar) | fly 20 |
| Feet to Fins | swim 25 (its land Speed), land 5 |
