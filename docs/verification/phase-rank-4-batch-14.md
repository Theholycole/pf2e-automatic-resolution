# Rank 4 batch 14 — Font of Serenity

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Font of Serenity (4) | The GM places the burst. The caster's allies inside (not the caster) hold PF2e's Effect while inside: +1 status to saves against emotion effects, +2 from 8th rank, by the text. The card's Counteract button rolls the caster's counteract against an emotion effect the GM names, for an ally who touches the font. |

## Rules

- **Effect proof (`effect-note-proof.js`):**
  - "Allies within the area gain a +N status bonus to saving throws against X effects." is an area reader for allies, stepped by "The bonus increases by N".
  - Where PF2e's value doesn't follow the text's steps, the reader gives a rule override with the text's formula. Overrides now receive the match and step.
  - The touch-counteract sentence is the card's counteract, and the "If the spell succeeds …" sentence is a note.
- **Area boon (`ongoing-families.js`, `effect-runtime.js`):**
  - `startAreaBoon` takes `allies` (the caster's allies, not the caster) and `ruleOverrides`.
  - The area card carries the counteract button and flag.
- **Interpretation (logged):** PF2e's +2 from 4th rank versus the text's +1 (+1 per 4 ranks): the text.

## Tests

1059 pass. `test/rank-4-batch-14.test.js` is new, with a negative case: another trait than the Effect's predicate stays blocked.

## Evidence

[Live evidence](phase-rank-4-batch-14-live-results.json), case `rank4Batch14`, in the `pftest` world.
- At 4th: an ally and an enemy in the burst; only the ally held the Effect (bonus 1), and the caster didn't.
- The card's Counteract against a DC 10, rank 1 "Fear effect" succeeded.
- Ending the area removed the Effect.
- At 8th: the ally's bonus was 2.
- **Cleanup:** fixtures removed.
