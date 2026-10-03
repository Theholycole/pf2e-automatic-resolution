# Rank 8 batch 2 — Arctic Rift, Time Beacon, Project Image, Migration, Wall of Force

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Arctic Rift | The critical-failure row is reworded (`save-rewrites.js`) to Immobilized and Slowed 1 until it Escapes (the spell DC). The ice's statistics are the GM's reminder (new kind `object-hold`): 60 HP, +5 per rank above 8th, Hardness 5, immune to cold, weakness 10 to fire. Breaking the ice frees the creature. |
| Time Beacon | Note. Its counteract check against each harmful effect is the card's Counteract button; failing means "you can't return", which is the note's. |
| Project Image | Note. "Project" now counts as conjuring, so the image's AC and saves are the GM's statistics for it. |
| Migration | Note with five BaseSpeed rules (land, burrow, climb, fly, swim 40). The note rule check now allows a land BaseSpeed (PF2e 8 takes it; checked live: 25 → 40). Animal form and travel speed are the note's. |
| Wall of Force | Walls on the map: a Foundry wall along the placed 50-foot line, blocking movement but not sight. Its AC 10, Hardness 30 and HP (60, +20 per 2 ranks) go on the caster's Effect, which removes the wall when it ends. The rest are notes. |

## Tests

`test/rank-8-batch-2.test.js` is new. A whole-corpus compile (b721 → b722) changed these five spells. Dizzying Colors' critical failure re-linked "stunned" as {Stunned} instead of {Stunned 1}; its effects are the same.

## Evidence

[Live evidence](phase-rank-8-batch-2-live-results.json), case `rank8Batch2`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Arctic Rift, critical failure | Immobilized and Slowed 1; the ice reminder on the plan |
| Time Beacon | The note card has the Counteract button |
| Project Image | Its note Effect on the caster |
| Migration on the caster | Land, fly and swim Speeds 40 |
| Wall of Force at 8th on a placed region | One wall that blocks movement and not sight; 80 HP on the card; deleting the Effect removes the wall |

**Cleanup:** fixtures and region removed.
