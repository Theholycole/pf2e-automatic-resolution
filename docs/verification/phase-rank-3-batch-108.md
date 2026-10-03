# Rank 3 batch 108 — Phantom Prison

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Phantom Prison (3) | Trickster's Twin's family. The cast's Will save: on a success the creature disbelieves, so it's unaffected. On a failure or critical failure it gets the prison note for the minute: it believes it's trapped, can't leave its space, and can't see outside. The note has a Will Disbelieve control, which the GM uses when it interacts with or tries to escape the walls, or something from outside affects it; a success ends the spell. "A Large or smaller creature" and the 8th-rank five targets are a card note. |

## Rules

- **`src/compiler/twin-illusion.js`:** `rewriteIllusoryPrison` reads the four sentences and the heightening. It returns unaffected rows, the failure and critical-failure notes with `disbelieve: {statistic: "will", endsSpell: true, needs: "success"}`, and a reminder.
- **`compileSpell`:** the twin post-step skips rows without a note and adds the reminder.
- **Validation:** `basic-save-core` accepts a spell-note reminder proved by the `twinIllusion` evidence.

## Interpretation

- **Trapped and blind to the outside are a GM-played note.** No condition is stated.
- **The incapacitation trait is PF2e's on the save.**

## Tests

`test/rank-3-batch-108.test.js` is new. It covers the save, the notes' Disbelieve, no note on a success, the reminder, and a changed ending (not read).

A whole-corpus compile (b632 → b633) changed only Phantom Prison.

## Evidence

[Live evidence](phase-rank-3-batch-108-live-results.json), case `rank3Batch108`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The reminder | Shown |
| Success | No note |
| Failure | The note (1 minute, needs a success) |
| Disbelieve at Will −40 | Believed; the note stays |
| Disbelieve at Will +60 | Disbelieved; the spell ended and the note was removed |

Trickster's Twin's case `rank4Batch75` was rerun and passed.

**Cleanup:** fixtures removed.
