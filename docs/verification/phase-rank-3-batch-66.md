# Rank 3 batch 66 — Croak Voice

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Croak Voice (3) | Fortitude. Each failing row is a 1-minute note (the DC 5 flat check on auditory actions and non-subtle spells). **Success and failure:** the creature can massage its throat once a round (its Fortitude save against the spell DC; a success ends the spell). **Failure:** each auditory action deals 2d10 mental (+1d10 a rank), the GM's control. **Critical failure:** that damage doubled, and no massage. |

## Rules

- **Hoarse voice (`src/compiler/hoarse-voice.js` `compileHoarseVoice`):**
  - It reads the three rows, the item's damage entry and the heightening.
  - It writes each row's note with `endSave` (success, failure) and `triggeredDamage {trigger: "auditory"}` (failure; `multiplier: 2` on a critical failure).
- **New:**
  - The note field `endSave {statistic, label, oncePerRound}`: `validNoteEffect`, the runtime flag with the DC, `storedTriggers.endSave` and the Ongoing control "— massage its throat (Interact) (Fortitude save to end it)".
  - The `auditory` trigger, with its doubling, in `isTriggeredDamage` and the hostile-damage control.
  - The residual-prose claim for the note's own row.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-66.test.js` is new. Its negative case is another ending (not read).

A whole-corpus compile (b515 → b516) changed only Croak Voice.

## Evidence

[Live evidence](phase-rank-3-batch-66-live-results.json), case `rank3Batch66`, in the `pftest` world, at 4th rank.

| Result | Result |
| --- | --- |
| Controls (success, failure, critical failure) | massage only; massage and damage; damage only |
| Failure's auditory action | 3d10 mental = 4 lost |
| Critical failure's | 2 × 3d10 = 30 lost |
| Success's massage (Fortitude +30) | Critical success: the spell ended |

**Cleanup:** fixtures removed.
