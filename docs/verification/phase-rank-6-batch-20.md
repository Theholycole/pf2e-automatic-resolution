# Rank 6 batch 20 — Field of Razors

2026-10-03. Growing areas; the user's answer applied.

| Spell | Now |
| --- | --- |
| Field of Razors | A placed 20-foot burst that is difficult terrain for 1 minute. That's the user's ruling: neither the data nor the text gives a duration. A creature moving through takes 5 slashing per square (+2 a rank) from the GM's control. There's no save: the text states none, though PF2e's item lists Reflex. When a creature inside takes slashing, piercing or persistent bleed damage, the caster's reaction (an Ongoing-spells control for the caster or the GM) grows the burst 5 feet, up to four times (40 feet). The metal choice and its reforming are notes. |

Runtime: a placed hazard area can grow by a control, a stated number of times. A hazard area whose text states no save takes the hazard route over PF2e's listed save. A placed burst with no duration anywhere lasts 1 minute (the user's ruling, written as a rule; it changed only this spell).

## Tests

`test/rank-6-batch-20.test.js` is new. A whole-corpus compile (b759 → b760) changed only Field of Razors.

## Evidence

[Live evidence](phase-rank-6-batch-20-live-results.json), case `rank6Batch20`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 7th | A hazard area; 7 slashing per square; difficult terrain; 60 seconds |
| A creature moves 2 squares (GM control) | 14 damage |
| The caster's reaction, four times | 25, 30, 35, 40 feet (the region too) |
| A fifth time | Refused |

**Cleanup:** fixtures removed.
