# Rank 3 batch 8 — Blastback

2026-10-02.

| Spell | Now |
| --- | --- |
| Blastback (3, reaction) | A basic Reflex save against 6d4 bludgeoning for the creatures the GM targets in the 20-foot emanation. The caster is ineligible ("all other creatures"). **Failure / Critical Failure:** the GM's reminder to push the creature 5 feet away. The card has two GM reminders: the caster takes no fall damage; the heightened area is 10 feet larger every 2 ranks (PF2e's data has no area step). **Heightened (+2):** +1d4, checked against PF2e's data. |

## Rules

- **`compileBasicPushRider` (`basic-degree-rider.js`):**
  - "You take no damage from the fall as …, but all other creatures in the spell's area take 6d4 bludgeoning damage." gives the item's damage, the not-caster target predicate, and the spared-caster reminder.
  - "Creatures that fail their save are also pushed back 5 feet." gives `forcedMovement` on failure and critical failure (the existing save-card push reminder).
  - The Heightened entry: the damage step must be PF2e's. The area growth, which PF2e lacks, becomes the `heightened-area` reminder.
  - Like the existing trait-knockback rider, the rewritten remainder must assess as a complete basic save.
- **Supporting changes:**
  - `basic-save-core.js` accepts the `caster-spared` and `heightened-area` reminders when they're the rider's claimed sentences;
  - `strike-prelude-runtime.js` renders them. The default rendering was a counteract message.

## Tests

972/972 pass. `test/rank-3-batch-8.test.js` is new. It checks:
- the push rows, the target predicate and the reminders;
- that a changed push rider, damage, or heightening step isn't read.

A whole-corpus compile (b345 → b346) changed only Blastback.

## Coverage

**Census:** **1165 enabled** (milestone; 1161 non-ritual), up from 1164. Rank 3: 117 of 261.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-8-live-results.json), case `rank3Batch8`, in the `pftest` world.
- **The caster as a target:** marked ineligible on the card.
- **Rank 3, two targets (failure, critical failure):** "6d4 bludgeoning", total 15; they lost 15 and 30. Two push reminders ("is pushed 5 feet away from the caster"), plus the spared-caster and heightened-area reminders.
- **Rank 5 (`loadVariant`), success:** "7d4 bludgeoning", total 15, 7 lost (half), no push.
- **Run note:** the first run's assertion expected starting the card with the caster to throw. The runtime marks the target ineligible instead, so the assertion was corrected; the behaviour was unchanged.
- **Cleanup:** fixtures removed.
