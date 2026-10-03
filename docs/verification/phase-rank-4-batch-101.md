# Rank 4 batch 101 — Mirror's Misfortune

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mirror's Misfortune (4) | Casting puts an illusory duplicate on the caster's square: a copy of the caster's token, unlinked. A caster Effect lasts the minute and removes the duplicate when it ends. When a creature takes a hostile action against the duplicate, the GM targets it and uses the control in Ongoing spells: it rolls its Will save against the spell DC. Failure: its next 2 attack rolls are rolled twice and the lower kept, for up to an hour. Critical failure: its next 4. Success: nothing. Either way, the duplicate shatters and the spell ends. |

## Rules

- **Mirror duplicate (`src/compiler/mirror-duplicate.js`, compiled in `compileSpell` like Albatross Curse's deferred save):**
  - It reads the split, the Step, where the duplicate appears, its course of action, the Seek to tell them apart, the hostile-action trigger, the save sentence, the spell ending on shattering, and the rows' misfortune (how many attack rolls, how long).
  - The Step, the placement, the course of action and the Seek become notes on the caster's Effect; the GM moves the token.
- **Runtime:**
  - **New resolution kind:** `mirror-duplicate` (effect runtime).
  - **The control:** `mirror-shatter` (stored triggers).
  - **The misfortune Effect:** RollTwice on attack rolls, keep lower, with PF2e's own after-roll removal off. It has its own Ongoing id, so it outlives the shattered cast.
  - **Counted uses:** `consumeOn` can now carry `count`. Each attack roll lowers it, and the Effect goes after the last.

## Interpretations

- The duplicate is a token of the caster's image (decision 2026-10-01: a conjured thing is a token). It isn't a creature, so hits on it are only the trigger.
- The attack that shatters the duplicate isn't itself affected; the misfortune is on the attacker's next rolls.

## Tests

`test/rank-4-batch-101.test.js` is new. It covers the kind, its rows and notes, the counted use, a row without a count (not read), and a duplicate that doesn't end the spell (not read).

A whole-corpus compile (b603 → b604) changed only Mirror's Misfortune.

## Evidence

[Live evidence](phase-rank-4-batch-101-live-results.json), case `rank4Batch101`, in the `pftest` world, at 4th rank.

| Step | Result |
| --- | --- |
| The cast | The duplicate token; the entry with DC 24 |
| A creature fails | "misfortune (2 attack rolls)" for 1 hour; the duplicate gone; the cast ended |
| Its first Strike | Two dice; "(1 attack roll)" left |
| Its second Strike | Two dice; the Effect gone |
| A critical failure | "misfortune (4 attack rolls)" |
| A success | Nothing; the cast ended |

**Cleanup:** fixtures removed.

During the first attempt, a stray click on the macro hotbar opened another suite's "Expiry investigation — controls" dialog. It was closed without any of its buttons being pressed.
