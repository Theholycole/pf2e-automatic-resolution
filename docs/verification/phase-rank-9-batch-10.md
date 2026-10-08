# Rank 9 batch 10: group 5, part 3

2026-10-05. Arcane Explosion, a blast that leaves its caster as pure magic.

| Spell | Now |
| --- | --- |
| Arcane Explosion | The area's basic Fortitude save for 16d6 force. A failure has the 10-foot push from the caster as the card's movement reminder. Objects, and the fall to Prone when the push can't complete, are GM reminders. At Finalize, the caster gets PF2e's Effect (incorporeal, the immunities, and resistance equal to its level, all proved against the text). A 5-foot aura follows the caster and deals 6d6 force to each creature ending its turn adjacent. Removing the Effect (the Dismiss) ends the aura and restores the caster to maximum Hit Points. "Can't Strike, Cast a Spell or use manipulate actions" is a GM reminder. |

New runtime:

- **The caster's form after a save:** PF2e's Effect on the caster, plus its following aura.
- **The form's end:** removing a form's Effect ends its auras, and restores maximum Hit Points when the text says so.

## Tests

`test/rank-9-batch-10.test.js` is new. A whole-corpus compile (b786 → b787) changed only Arcane Explosion.

## Evidence

[Live evidence](phase-rank-9-batch-10-live-results.json), case `rank9Batch10`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The blast: a failure and a success | 52 and 26 force; the push reminder on the card |
| The caster's form | PF2e's Effect (incorporeal) and the aura region |
| A creature ending its turn adjacent | 31 force |
| The Effect removed | The aura ends; the caster at 500/500 Hit Points |
