# Rank 5 batch 24 — Control Water

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Control Water (5) | Creatures with the water trait in the area take a Fortitude save with Slow's rows. **Success:** Slowed 1 for 1 round. **Failure:** Slowed 1 for 1 minute. **Critical failure:** Slowed 2 for 1 minute. The caster targets them, and creatures without the trait are refused. Raising or lowering the water by 10 feet in the 50-by-50-foot area is a GM note. |

## Rules

- **Borrowed trait save (`borrowed-spell.js` `rewriteBorrowedTraitSave`):**
  - It reads the "Area N feet long by M feet wide" line, the water-level sentence, and "Creatures that have the X trait and that are in the area when you Cast the Spell must attempt a [save] save, with the effects of the @UUID[…] spell."
  - The referenced spell must be a non-basic save of the same statistic. Its degree rows are used, not its Heightened entries.
  - The target becomes "each creature with the X trait".
- **Targets (`target-predicate-compiler.js`):** "each creature with the X trait" gives a trait predicate.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-24.test.js` is new. Its negative case is a compile without the referenced spell (not read).

A whole-corpus compile (b477 → b478) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-24-live-results.json), case `rank5Batch24`, in the `pftest` world, cast at 5th rank.

| Creature | Eligible | Result | Applied |
| --- | --- | --- | --- |
| Water creature | Yes | Failure | Slowed 1, 1 minute |
| Water creature | Yes | Critical failure | Slowed 2 |
| No water trait | No | — | — |

The card shows the water note.

**Cleanup:** fixtures removed.
