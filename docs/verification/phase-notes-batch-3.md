# Notes batch 3: forced-movement notes

2026-10-05, from the notes audit (`docs/planning/notes-automation-audit.md`). These forced-movement notes are now carried out by the module through `scripts/forced-movement.js` (`pointInShapes`, `nearestFreeSpace`, `moveToFreeSpace`, and `feetLeft` on `forcedMove`).

| Spell | Now |
| --- | --- |
| Garden of Stone | Each creature in the burst moves to the nearest unoccupied space outside it (`areaExit: all`) |
| Frost Pillar | A success moves to the nearest free adjacent space (`areaExit: success, adjacent`) |
| Blade Barrier | A creature that succeeds as the wall is created moves to the nearest space outside the wall. The ongoing manager passes the wall's shapes on the cast's own saves |
| Lifewood Cage | A success moves outside the cage's token (`areaExit: success, conjured`) |
| Tornadic Gale | The GM targets the creatures beside the line too. Each one of Medium size or smaller is moved into the nearest free space in the line before the pushes (`areaPullIn`) |
| Arcane Explosion | A push stopped by a wall or the scene's edge knocks the creature Prone (`stopped: {prone}`) |
| Planar Collision | A push stopped by a wall takes bludgeoning damage equal to the feet left (`stopped: {damage}`). Its card's push comes from the burst's centre (`forcedPoint`) |
| Patron's Protector | Its knock-back comes from the familiar the spell targets (`forcedPoint`) |
| Rainbow Fumarole, Life's Flowing River | Already automated; Rainbow Fumarole's note now says so |

## Tests

`test/notes-batch-3.test.js` (3): the area shapes, the free-space search, and the compiled flags.

## Evidence

[Live evidence](phase-notes-batch-3-live-results.json), case `notesBatch3`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Garden of Stone: the creature in the 10-foot burst | Moved out, to (5,12) |
| Frost Pillar: a success at (11,12) | Moved to an adjacent space (10,12) |
| Blade Barrier: a success in the wall's line at (14,12) | Moved out, to (13,12) |
| Tornadic Gale: the creature below the line, a failure | Pulled into the line, then pushed 5 feet to (14,5) |
| Arcane Explosion: a failure beside a wall | Stopped by the wall at (21,12) after 5 feet; Prone |
| Planar Collision: the collision's failure beside a wall | Stopped after 5 feet; 20 bludgeoning (20 feet left) |
