# Rank 4 batch 68 — Steal Voice

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Steal Voice (4) | Fortitude. PF2e has no voiceless condition, so each failing row gives a "Voiceless" note Effect (can't speak, make vocal sounds or take auditory actions; the caster may speak in the target's voice): until the end of the target's next turn on a success, 1 minute on a failure, unlimited on a critical failure. Every target is temporarily immune for 1 minute. Creatures with no voice are immune — a card reminder tells the GM to leave them out. |

## Rules

- **Stolen voice (`src/compiler/stolen-voice.js`):**
  - It reads the lead (save, 1-minute immunity, voiceless immunity), the success row's definition and the two "As success, but the duration is …" rows.
  - The rows become "unaffected" with a `Voiceless` note each, with the row's duration (unlimited for "permanent").
  - The immunity sentence is a `spell-note` reminder.
- **Interpretation:** voiceless is a note because PF2e has no condition for it (note Effects policy). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-68.test.js` is new. Its negative case is another duration wording (not read).

A whole-corpus compile (b529 → b530) changed only Steal Voice.

## Evidence

[Live evidence](phase-rank-4-batch-68-live-results.json), case `rank4Batch68`, in the `pftest` world, at 4th rank.

| Result | Voiceless note | Temporary immunity |
| --- | --- | --- |
| Critical success | — | yes |
| Success | 1 round, turn end | yes |
| Failure | 1 minute | yes |
| Critical failure | unlimited | yes |

**Cleanup:** fixtures removed.
