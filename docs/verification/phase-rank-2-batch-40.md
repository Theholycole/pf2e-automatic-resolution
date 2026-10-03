# Rank 2 batch 40 — two more Effect + note spells proved

2026-10-01. Follows the user's decision of 2026-10-01: an Effect + note spell counts once the module covers what PF2e's Effect doesn't.

| Spell | Now |
| --- | --- |
| Thundering Dominance (2) | PF2e's Effect on the targeted companion or eidolon. The +1 status bonus to Intimidation rises by 1 every 2 ranks to a maximum of +4 at 8th; PF2e's `match(when(btwn …))` table is checked against that at every rank. It also grants the Thundering Roar action (using it once is the GM's). The roar's +2d8 every 2 ranks is PF2e's dice alteration, which rises by 2 dice every 2 ranks. |
| Imitate Fauna (2) | PF2e's Effect on the targeted animals (a creature without the animal trait is refused): +4 status bonus to Deception to Impersonate against animals. One target, or up to six at 5th. The look, the species' language, the disguise, ignoring the dissimilar-creature penalties, and Dismiss are the note. |

## Rules

- **`effect-note-proof.js`:**
  - `ruleValueAt` also evaluates PF2e's `match`, `when`, `btwn`, `gte`, `lte`, `gt` and `lt`.
  - A scaled value may have a stated maximum.
  - A heightened step may claim another rule (the roar's dice alteration).
  - A heightened target count is allowed.
  - New readers for the skill bonus, the granted action and the animal disguise.
- **`note-effects.js`:** the heightened target limit also reads "animals".
- **Runtime:** the trait refusal now reads "doesn't have the X trait". Batch 39's evidence shows the earlier wording, and its case now expects the new one.

## Tests

884/884 pass. `test/rank-2-batch-40.test.js` is new. It checks:
- both proofs and the table evaluator;
- the target limit;
- that a cap other than PF2e's isn't proved.

A whole-corpus compile (b293 → b294) changed only these two spells.

## Coverage

**Census:** **1113 enabled**, up from 1111. Rank 2: 199 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-40-live-results.json), case `rank2Batch40`, in the `pftest` world.
- **Thundering Dominance at 4th:** the companion's Intimidation rose by 2, and it has the Thundering Roar action.
- **Imitate Fauna:**
  - At 2nd, two animals were refused (at most 1), and a creature without the animal trait was refused.
  - At 5th, both animals got the Effect.
