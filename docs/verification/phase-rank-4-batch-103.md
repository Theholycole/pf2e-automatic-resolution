# Rank 4 batch 103 — Winning Streak

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Winning Streak (4) | The target is Quickened (PF2e's condition, held by an Effect while the streak lasts); the Effect's note limits its extra action to Strike, Step or Stride. When the target or one of its allies within 20 feet critically hits a significant foe, the GM targets that creature and uses the Ongoing control: it's Quickened too if it wasn't, and the streak goes another round. A creature farther away is refused. A full round without such a critical hit breaks the streak, the spell ends, and every Quickened from it goes. |

## Rules

- **Winning streak (`src/compiler/winning-streak.js`, compiled in `compileSpell`):** it reads the Quickened sentence, the spread on a critical hit (with its distance), the action limit and the break.
- **Runtime:**
  - **New effect kind:** `winning-streak`. It makes the Quickened Effect and an Ongoing record carrying `streak`: when it was last kept going, the distance and the target.
  - **The control:** `streak-crit` checks that the creature is the target or an ally within the distance, quickens it once, and moves the streak on.
  - **The break:** the native reconcile ends the cast once a round has started after the round the streak was last kept going.

## Interpretations

- A "significant foe" is the GM's call (they press the control).
- Creatures stay Quickened while the streak lasts. The text names no shorter time for those that join.

## Tests

`test/rank-4-batch-103.test.js` is new. It covers the kind's data, and a streak without the break (not read).

A whole-corpus compile (b611 → b612) changed only Winning Streak.

## Evidence

[Live evidence](phase-rank-4-batch-103-live-results.json), case `rank4Batch103`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| The cast | The target Quickened, its ally not |
| The ally's critical hit | "extended"; the ally Quickened |
| A creature far away | Refused |
| Two round boundaries without a critical hit | The cast ended (round 3); both lose Quickened |

**Cleanup:** fixtures and combat removed.
