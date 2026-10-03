# Rank 4 batch 100 — Shaken Confidence

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shaken Confidence (4) | A reaction against an enemy (Will save). The caster names on the card the roll whose critical failure triggered it: an attack roll, Perception or one skill (18 choices). A failure or critical failure gives a note with PF2e's misfortune: the next such roll is rolled twice and the lower kept. The note is removed after that roll, or at the end of the target's next turn if it makes none. A success does nothing. |

## Rules

- **Misfortune rows (`src/compiler/misfortune-rows.js`):**
  - It reads the trigger ("critically fails an attack roll, Perception check, or skill check"), the save sentence, the success row and the failure row's next-roll misfortune.
  - The rows are rewritten to nothing applied.
  - Post-hook: an option choice for the failing rows (like Dreamer's Call's course of action). Each option is a note with `RollTwice` (its selector, keep lower, remove after roll), lasting until the end of the target's next turn.
  - Targeting is an enemy of the caster, and the duration "varies" is read as the results'.
- **Core:** the option rows may also be notes lasting until the end of the target's next turn whose only rule is RollTwice (with this spell's evidence).
- **Note rules:** RollTwice that is removed after the roll may now target one attack roll, Perception or one skill.

## Tests

`test/rank-4-batch-100.test.js` is new. It covers the choice and its 18 notes per failing row, the rule and duration, the enemy constraint, the note-rule check (a skill allowed, a save refused), and another trigger (not read).

A whole-corpus compile (b602 → b603) changed only Shaken Confidence.

## Evidence

[Live evidence](phase-rank-4-batch-100-live-results.json), case `rank4Batch100`, in the `pftest` world, at 4th rank.

| Step | Result |
| --- | --- |
| Athletics named, a failure | The note's RollTwice (athletics, lower, remove after roll), 1 round to the end of its turn |
| Its next Athletics check | Rolled with two dice; the note then gone |
| Perception named, a critical failure | The note's RollTwice (perception) |
| A success | No note |

**Cleanup:** fixtures removed.
