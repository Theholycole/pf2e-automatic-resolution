# Rank 7 batch 5 — Regenerate, Incarnate Tempest of Shades, Summon Stampede

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Regenerate | Effect + note, proved. PF2e's regeneration (15, 20 at 9th, deactivated by acid and fire) matches the text. What regeneration does at 0 HP, with Wounded, and to organs and severed parts is the note. |
| Incarnate Tempest of Shades | The incarnate reader accepts "must attempt @Check[will|…] saves" (Depart) as a Will save and "All your enemies within" as each enemy. "Fleeing for 1 round or until it's no longer frightened, whichever comes first" is read as Fleeing for 1 round, since the Frightened 3 beside it outlasts that round. |
| Summon Stampede | Depart's inline `@Damage[(8d8)[bludgeoning]]` is read as its dice (the item has no damage) and becomes a basic Reflex table. Counteracting difficult terrain and which creatures it tramples are the reminder. |

## Tests

`test/rank-7-batch-5.test.js` is new. A whole-corpus compile (b729 → b730) changed only these three spells.

## Evidence

[Live evidence](phase-rank-7-batch-5-live-results.json), case `rank7Batch5`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Regenerate at 9th | PF2e's regeneration (deactivated by acid and fire) and the note |
| Tempest of Shades: Arrive failure, Depart critical failure | Drained 2; Frightened 3 and Fleeing |
| Summon Stampede: Depart critical failure | 58 damage (8d8 doubled); the terrain reminder |

**Cleanup:** fixtures removed.
