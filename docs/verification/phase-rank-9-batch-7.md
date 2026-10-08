# Rank 9 batch 7 — group 3, part 5

2026-10-05. Two more spells of feature group 3, and a fix.

| Spell | Now |
| --- | --- |
| Volcanic Eruption | A card of parts. **The lava column:** the targets' Reflex save, 14d6 fire (+2d6 a rank) at half, full or double. Failure and critical failure add "Encased in rock" (Clumsy 1 and −10 status to all Speeds as PF2e's rules), which ends on an Escape against the spell DC or once the creature has taken 50 damage in total. **The intense heat:** (rank − 4)d6 fire, no save, to the creatures the GM targets (in the area and within 5 feet of it). |
| Nature's Enmity | A card's Effect on up to 5 targets for 10 minutes: −10 circumstance to all Speeds, plus notes for the primal-spell flat check and hostile natural creatures. As each target's turn starts, the module rolls a DC 8 flat check. On a failure, it rolls the target's basic Reflex save against 2d10 slashing, and the target is Off-Guard for 1 round unless it critically succeeds. |
| Blessed Boundary (fix) | Its heightened formula is spaced (`@item.rank - 6`), because Foundry read `@item.rank-6` as a data path worth 0. |

New runtime:

- **Note Effects ended by damage:** `damageLimit` counts the damage the creature takes and ends the note at the total; an unlimited note can now also end on Escape.
- **Turn-start attacks on note Effects:** `turnStartAttack` rolls the flat check, then the basic save, damage and Off-Guard.

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-9-batch-7.test.js` is new; `test/rank-6-batch-21.test.js` expects the spaced formula. A whole-corpus compile (b777 → b778) changed only these three spells.

## Evidence

[Live evidence](phase-rank-9-batch-7-live-results.json), case `rank9Batch7`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The lava column: a failure and a success | 46 and 23 fire; the failure is Encased (Clumsy 1, −10 Speeds), the success isn't |
| The encased creature takes 30, then 25 more | Still encased; then freed (Effect and Clumsy gone) |
| The heat on a creature near the column | 3d6 fire (8) |
| Nature's Enmity on a target; its flat check forced to fail as its turn starts | The Effect (−10 Speeds, DC 24); the attack: 30 slashing, Off-Guard |
