# Rank 8 batch 8 — Maze of Locked Doors, Medusa's Wrath

2026-10-04.

| Spell | Now |
| --- | --- |
| Maze of Locked Doors | Will save. The trapped creature's GM note lasts 1 round (success), 1 minute (failure) or 10 minutes (critical failure); the GM ends it early once it bypasses 1, 2 or 3 doors. The hallway, its doors (Hardness 20, HP 80, Athletics DC 30 to Force Open, Thievery DC 25 locks needing 4 successes) and the counteract against teleportation inside are the card's GM reminder. |
| Medusa's Wrath | The caster's own PF2e unarmed Strike decides the row. A critical hit: Slowed 2; a hit: Slowed 1. Either way, the creature then attempts a Fortitude save (the item's) at the end of each of its turns: a failure adds 1 Slowed (a critical failure 2), a success removes 1. At 0 the spell ends; once Slowed takes all its actions, it's Petrified permanently and the spell ends. A miss does nothing. |

Interpretations: being trapped in the extradimensional hallway (hiding the token, the doors, the teleport counteract) is played by the GM off the map. Medusa's Wrath's later saves are the item's Fortitude save even though the first check is the Strike. Their incapacitation trait isn't applied, as for Petrify.

Runtime: a Strike spell's rows may carry an escalating save of the item's own statistic.

## Tests

`test/rank-8-batch-8.test.js` is new. A whole-corpus compile (b761 → b762) changed only these two spells.

## Evidence

[Live evidence](phase-rank-8-batch-8-live-results.json), case `rank8Batch8`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Maze: success, failure, critical failure | Trapped notes for 1 round, 1 minute, 10 minutes; the doors on the card |
| Medusa: the caster's Strike critically hits | Slowed 2 |
| Its turn ends; a failed save | Slowed 3: unable to act, so Petrified; the spell ends (no further save) |

**Cleanup:** fixtures and combat removed.
