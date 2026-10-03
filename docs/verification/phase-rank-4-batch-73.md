# Rank 4 batch 73 — Inevitable Destination

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Inevitable Destination (4, focus) | Will; only the enemy is a target ("you and 1 enemy"). Success: a –10-foot circumstance penalty to all Speeds (a note with PF2e's FlatModifier) until the end of the target's next turn. Failure: a "Tethered" note for the spell's 2 rounds; the GM enforces the distance rule, and a successful Escape against the spell DC offers the GM a button to end it. Critical failure: the same, plus Prone and a GM reminder to pull the target 10 feet toward the caster. |

## Rules

- **Tether rows (`src/compiler/tether-rows.js`):**
  - It reads the lead, the four rows, the target "you and 1 enemy", and the spell's rounds.
  - It produces:
    - a success note with an `all-speeds` FlatModifier;
    - a Tethered note with `escape: true` for both failing rows;
    - the critical failure's `forcedMovement` pull toward the caster, and Prone.
  - Targeting is an enemy of the caster.
- **Escapable notes (`scripts/note-effects.js`):** a fixed-time note may carry `escape: true`. The Effect then gets the outcome-Effect Escape flag at the spell DC, which the existing Escape termination grades.
- **Interpretation:** the Speed penalty is a note rule rather than a generated modifier, because the spell lasts 2 rounds. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-73.test.js` is new. Its negative cases are:

- an invalid `escape` value (refused);
- a push instead of the pull (not read).

A whole-corpus compile (b534 → b535) changed only Inevitable Destination.

## Evidence

[Live evidence](phase-rank-4-batch-73-live-results.json), case `rank4Batch73`, in the `pftest` world, at 4th rank (caster level 7, spell DC 24).

| Result | Notes | Land Speed | Prone | Escape 99 / 1 |
| --- | --- | --- | --- | --- |
| Critical success | — | 25 | — | — |
| Success | Hampered footsteps, 1 round (turn end) | 15 | — | — |
| Failure | Tethered, 2 rounds | 25 | — | escaped / not |
| Critical failure | Tethered, 2 rounds | 25 | yes | escaped / not |

The card showed the pull reminder ("pulled 10 feet toward the caster").

**Cleanup:** fixtures removed.
