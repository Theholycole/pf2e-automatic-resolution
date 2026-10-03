# Rank 3 batch 59 — Unseasonable Squall

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Unseasonable Squall (3) | A 20-foot burst lingering until the caster's next turn. Medium or smaller creatures save when cast and when they move in; larger creatures are refused. **Failure:** Prone. A flying creature's failure becomes a critical failure (the GM's question). **Critical failure:** the text's 2d6 bludgeoning as that row's roll, pushed 30 feet away from the burst's center (the GM's), and Prone. The wind's effect on fires, fog and objects is a GM reminder. |

## Rules

- **Squall (`compact-degree-table.js` `expandSquall`):**
  - It reads Gust of Wind's burst form: the origin narration, the wind's effects on the surroundings, "Each [size] or smaller creature in the area when you Cast the Spell or that moves into spell's area must attempt a [save] saving throw.", and the three written rows.
  - The output is the gust's lingering table with the critical failure's inline roll, plus the size limit, the flying question and the surroundings reminder. The gust's success-row wind note is now optional.
- **Push (`compile-ability.js`):**
  - It reads "The creature takes @Damage[…] damage. The creature is pushed N feet away from the center of the burst and knocked Prone.".
  - A new direction, `from-center`, is accepted by the validator and shown by the runtime as "pushed N feet away from the center of the burst".
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-59.test.js` is new. Its negative case is another push wording (not read).

A whole-corpus compile (b482 → b483) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-59-live-results.json), case `rank3Batch59`, in the `pftest` world, through the lingering area's review.

| Creature | Result | Applied |
| --- | --- | --- |
| Walker | Failure | Prone, no damage, no push |
| Flyer | Failure → critical failure (flying) | Prone, 6 bludgeoning, push note |
| Large creature | Refused | Medium or smaller only |

**Cleanup:** fixtures removed.
