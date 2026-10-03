# Rank 5 batch 50 — Pack Breaker

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Pack Breaker (5, focus) | Will. Every result makes the creature temporarily immune for 1 hour. Success, failure and critical failure give a "Pack broken" note for 1 minute: it grants PF2e's Unfriendly and says the creature treats no one as an ally. Failure adds Confused for 1 round, critical failure for 1 minute. For each affected creature, a card asks the GM to target its former allies within reach and starts their saves against the same spell; their own immunity stops repeats. |

## Rules

- **Pack break (`src/compiler/pack-break.js`):**
  - It reads the lead (save and the immunity regardless of result) and the rows.
  - Unfriendly comes from PF2e's condition through a note (the compiler treats attitudes as manual). The rows are reduced to their Confused.
  - It sets `chainSave {degrees, label, sourceText}`.
- **Chained save:**
  - The validator requires the stated results, an immunity and this evidence.
  - At Finalize, the runtime posts one card per affected creature, carrying the same plan.
  - `chainSave(message, targets)` (the button, or the API) starts the saves for the GM's targets, once per card.

## Tests

`test/rank-5-batch-50.test.js` is new. Its negative cases are:

- a chain sentence that isn't the spell's (refused);
- another reach (not read).

A whole-corpus compile (b556 → b557) changed only Pack Breaker.

## Evidence

[Live evidence](phase-rank-5-batch-50-live-results.json), case `rank5Batch50`, in the `pftest` world, at 5th rank (caster level 9).

| Step | Result |
| --- | --- |
| The wolf fails | Unfriendly, Confused, immune; a chained card is posted |
| The card starts its ally's save | critical success: no Unfriendly, immune |
| The card is pressed again | refused ("already started") |
| A second cast on the wolf | not eligible (immune) |

**Cleanup:** fixtures removed.
