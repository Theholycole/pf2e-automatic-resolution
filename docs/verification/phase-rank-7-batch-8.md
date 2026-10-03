# Rank 7 batch 8 — Pollen Pods, Curse of the Spirit Orchestra

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Pollen Pods | Instant Minefield's route, now for a degree table too: the four bulbs are squares of a region the GM draws (at least 20 feet apart, a note), for 12 hours. When one blossoms (a creature moves adjacent, or it's touched or damaged — AC 5, the GM's), the GM's control opens one Fortitude card for the creatures within 15 feet of it: the rows' damage (8d8 poison, heightened) with Dazzled and Stupefied. |
| Curse of the Spirit Orchestra | Clownish Curse's family: each row a generated Effect — Diplomacy, Intimidation, Performance and Stealth rolled twice keeping the worse, and at any skill check a critical success becomes a success and a failure a critical failure — until the start of the caster's next turn, for 1 hour, or unlimited. The musicians' lead (invisible, can't be reasoned with or harmed) is narration. |

## Tests

`test/rank-7-batch-8.test.js` is new. Pollen Pods was a withdrawn route (2026-09-25: its one-time save resolved every bulb at casting); its entry in `docs/planning/withdrawn-routes.json` now reads "Moved, not lost" with the new route, and `test/self-help-eligibility.test.js` checks the bulbs' route. A whole-corpus compile (b738 → b739) changed only these two spells.

## Evidence

[Live evidence](phase-rank-7-batch-8-live-results.json), case `rank7Batch8`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Pollen Pods at 8th: a bulb blossoms, the creature fails | 10d8 poison (51, the card's total); Dazzled 1 round; Stupefied 1 for 1 minute; 3 bulbs left; 12 hours |
| Curse of the Spirit Orchestra, a failure | The curse for 1 hour: RollTwice on the four skills, two degree adjustments on skill checks |

**Cleanup:** fixtures removed.
