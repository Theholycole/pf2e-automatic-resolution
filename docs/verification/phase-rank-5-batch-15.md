# Rank 5 batch 15 — Horizon's Veil

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Horizon's Veil (5) | A placed 20-foot burst of difficult terrain for 1 minute, dismissable. A creature ending its turn inside saves (Will). PF2e's item has no save, so the text's is used. A failure or critical failure: Slowed 1 for 1 round. A GM note covers ranged attacks passing through the area (−2 circumstance). |

## Rules

- **Text area saves (`text-area-save.js`, `compile-ability.js`):** read on an area spell with no item save. The forms are:
  - "Creatures who end their turn in the area must succeed at a X save or become <condition> for N rounds."
  - "The affected area has the following effects.", "The area is difficult terrain.", "You can Dismiss this spell.".
  - "Ranged attacks that pass through the area take a −N … penalty to attack rolls.", which becomes a note.
  These are rewritten as the lingering area's "Each creature that ends its turn in the area must attempt a X save." with degree rows. The plan carries a data note naming the text's save.
- **Dismissal:** the degree-save lingering area now reads "You can Dismiss this spell." as well as "… the spell.".
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

1105 pass. `test/rank-5-batch-15.test.js` is new, with a negative case: another save sentence isn't read.

A whole-corpus compile (b435 → b436) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-15-live-results.json), case `rank5Batch15`, in the `pftest` world.
- The region has difficult terrain.
- At the end of the creature's turn, a `turn-end` exposure came up. Its save card used Will (`saveStatistic`), and the failure gave Slowed 1 for 1 round.
- The record is dismissable and carries the note.
- **Cleanup:** fixtures removed.
