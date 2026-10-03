# Rank 9 batch 1 — Frost Pillar, Uncontrollable Dance, Dimensional Excision

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Frost Pillar | Its one outcome sentence becomes rows (`save-rewrites.js`): success unaffected, failure Restrained while the sustained spell lasts. The success's step to an adjacent space and the ice's statistics (AC 10, Hardness 10, 60 HP, immunities, weakness 15 to fire; breaking it ends the spell) are the GM's reminder. |
| Uncontrollable Dance | The lead's condition and the rows' durations become rows of Off-Guard for 3 rounds or 1 minute. The compulsion (no reactions, dancing at half Speed, the actions each turn) is the row's behaviour note. New general rule: a behaviour note with no time of its own lasts as the one timed condition its row applies. |
| Dimensional Excision | Reworded to a basic Will save on both entries (14d10 and 2d10 persistent bleed). New core allowance: a basic save may scale one persistent entry with the other, proven by the sentence that names both. The home-plane penalty is the GM's question (−4), and 0 HP kills. Leaving only the gear is a reminder. |

## Tests

`test/rank-9-batch-1.test.js` is new. A whole-corpus compile (b723 → b724) changed only these three spells; the note-time rule touched no other spell.

## Evidence

[Live evidence](phase-rank-9-batch-1-live-results.json), case `rank9Batch1`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Frost Pillar, failure and success | Restrained only on the failure; the ice reminder on the card |
| Uncontrollable Dance, success and failure | Off-Guard 3 rounds (its note 3 rounds) and 1 minute (with its note) |
| Dimensional Excision, success / critical failure (home plane −4) / failure at 5 HP | Persistent bleed 0.5 × 2d10 and 2 × 2d10; the −4 on the second's save; the 5-HP creature dies |

**Cleanup:** fixtures removed.
