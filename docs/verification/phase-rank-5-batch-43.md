# Rank 5 batch 43 — Wish-Twisted Form

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Wish-Twisted Form (5, focus) | Will. The caster picks the energy type on the card. PF2e's Effects apply by result: the 1-round Effect on a success; the 1-minute Effect preset to "failure" on a failure, or to "critical failure" (adding –1 status to AC) on a critical failure. The Effects carry weakness to the chosen type equal to the rank (5, +1 per rank as the text says), a –10-foot status penalty to Speeds, and –1 status to saves. The "resistances reduced by 5 (+1 per rank)" part isn't in PF2e's Effects, so each affected row also gets a "Twisted defenses" note with the amount at the cast rank. |

## Rules

- **Twisted form (`compileTwistedFormEffects`, proof `twisted-form-effect`):**
  - It reads the four listed effects, the rows, the critical failure's AC penalty, and the heightening step.
  - The weakness and the reduction must equal the rank.
  - The shared `twistedFormRulesMatch` checks both of PF2e's Effects:
    - the flag ChoiceSet of energy types;
    - the Weakness at `@item.level`;
    - the Speed and save modifiers;
    - in the minute Effect, the result ChoiceSet and the AC modifier predicated on the critical failure.
  - The proof returns the caster's choice and the row's preset. The card's caster choice accepts the kind.
- **Interpretation:** the resistance reduction is a note, since PF2e's Effect lacks it. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-43.test.js` is new. Its negative case is another Speed penalty (not read: the Effect wouldn't state it).

A whole-corpus compile (b542 → b543) changed only Wish-Twisted Form.

## Evidence

[Live evidence](phase-rank-5-batch-43-live-results.json), case `rank5Batch43`, in the `pftest` world (caster level 13), fire picked.

| Rank | Result | Effect | Fire weakness | AC | Will | Land Speed | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | success | 1 round | 7 | — | –1 | –10 | reduced by 7 |
| 7 | critical failure | 1 minute | 7 | –1 | –1 | –10 | reduced by 7 |
| 5 | failure | 1 minute | 5 | — | –1 | –10 | reduced by 5 |

**Cleanup:** fixtures removed.
