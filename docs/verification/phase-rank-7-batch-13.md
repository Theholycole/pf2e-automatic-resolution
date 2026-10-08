# Rank 7 batch 13 — Darklight

2026-10-04.

| Spell | Now |
| --- | --- |
| Darklight | A placed 20-foot burst for 1 minute whose region is fully dark (Foundry's darkness level). A creature that enters it or starts its turn inside attempts a basic Fortitude save against 2d6 bludgeoning and 2d6 void (3d6 each at 10th, PF2e's). The allies the caster targets when the area starts (up to four) are spared: each holds the area's immunity, so it's never exposed. The light-source, sight and darkvision rules are the GM's notes. |

Interpretations: the spared allies are the caster's targeted allies when the area starts (the caster isn't an ally of themself, so the caster isn't spared unless the GM leaves them out at review). Their seeing through the darkness is a note.

Runtime: a lingering area can carry a darkness behavior and spare up to a count of targeted allies.

## Tests

`test/rank-7-batch-13.test.js` is new. A whole-corpus compile (b764 → b765) changed only Darklight.

## Evidence

[Live evidence](phase-rank-7-batch-13-live-results.json), case `rank7Batch13`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The area starts with an ally targeted | The region is dark; the ally holds the spared marker, the foe doesn't |
| Both start their turns inside | Only the foe is exposed |
| The foe fails | 2d6 bludgeoning + 2d6 void (22) |
| End | The spared marker is removed |

**Cleanup:** fixtures, region and combat removed.
