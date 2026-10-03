# Rank 3 batch 40 — Radiant Globe

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Radiant Globe (3) | A sustained placed 10-foot burst. The GM's Ongoing control ("made a physical ranged attack through the area's surface") exposes the targeted attacker, wherever it stands, to a Fortitude save: a failure gives Dazzled for 1 round, a critical failure Blinded for 1 round. A note covers the destroyed ammunition. |

## Rules

- **Through-area saves (`text-area-save.js` `extractThroughAreaSave`, `lingering-area-compiler.js`):** reads "Attackers targeting creatures or objects through the <noun>'s surface with physical ranged attacks must succeed at a X save or become <condition> for N round (<condition> for N round on a critical failure)." on a non-basic save. The ammunition sentence becomes a note. These are rewritten as "An attacker targeting … must attempt a X save." with degree rows, which the lingering area reads as a GM control (`gmAction`, action `shoot`).

## Tests

1106 pass. `test/rank-3-batch-40.test.js` is new, with a negative case: another critical-failure clause isn't read.

A whole-corpus compile (b436 → b437) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-40-live-results.json), case `rank3Batch40`, in the `pftest` world.
- The record carries the ammunition note.
- The first archer, outside the globe, critically failed its Fortitude save through the control: Blinded, not Dazzled.
- The second archer failed: Dazzled.
- **Cleanup:** fixtures removed.
