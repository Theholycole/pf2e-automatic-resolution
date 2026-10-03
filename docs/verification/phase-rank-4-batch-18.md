# Rank 4 batch 18 — Diamond Dust

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Diamond Dust (4) | The caster's 15-foot emanation (a lingering area). A creature other than the caster that enters it or ends its turn in it is exposed to 2d6 cold with a basic Fortitude save: the GM's review, then the save card. Exposure is once per turn, not per round. The light effects' +2 and the Sustain toggle are notes. Dismissable. |

## Rules

- **Lingering areas (`lingering-area-compiler.js`):**
  - "A creature can take this damage only once per turn." sets `oncePerTurn` (once per round stays as it was).
  - The light-refraction and toggle sentences are notes.
  - "You can Dismiss this spell." is read like "the spell".
- **Runtime (`ongoing-families.js`):** with `oncePerTurn`, a creature already exposed during the combat's current turn isn't exposed again in that turn.

## Tests

1072 pass. `test/rank-4-batch-18.test.js` is new, with a negative case: another light rule stays blocked.

A whole-corpus compile (b404 → b405) changed only Diamond Dust.

## Evidence

[Live evidence](phase-rank-4-batch-18-live-results.json), case `rank4Batch18`, in the `pftest` world, in combat.
- A creature entering was exposed once.
- Leaving and re-entering in the same turn added no exposure.
- In the next turn, re-entering added one.
- The record holds the two notes, with the caster excluded.
- **Cleanup:** fixtures removed.
