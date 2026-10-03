# Rank 6 batch 7 — Nature's Reprisal, Phantasmal Calamity

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Nature's Reprisal | The placed burst's per-square control (the hazard-area family): an enemy entering hazardous squares takes 6 poison per square (+1 per rank above 6th). The area isn't difficult terrain for everyone, so the region gets no terrain; the enemies-only terrain, and which squares have plants, are the GM's note. |
| Phantasmal Calamity | The basic Will damage; a critical failure's second save (Reflex): its failures give Stunned for 1 minute, ended by a Will save at the end of each of the creature's turns, and a note that it believes it's trapped. |

Runtime: a second save's rows can now carry note Effects (validated like the primary rows').

## Tests

`test/rank-6-batch-7.test.js` is new. A whole-corpus compile (b733 → b734) changed only these two spells.

## Evidence

[Live evidence](phase-rank-6-batch-7-live-results.json), case `rank6Batch7`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Nature's Reprisal at 7th, an enemy entering 2 squares | 14 poison (7 per square); no region terrain; the GM note |
| Phantasmal Calamity: failure / critical failure + failed Reflex | Damage only / double damage, Stunned for 1 minute with the end-of-turn save, and the "Trapped" note |

**Cleanup:** fixtures removed.
