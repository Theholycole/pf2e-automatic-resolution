# Rank 3 batch 113 — Pyrotechnics

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Pyrotechnics (3) | Two lingering modes, each compiled from its own text, and the card asks which. Each is a sustained 20-foot burst: a creature starting its turn in it rolls a Fortitude save, then is immune for a minute. **Fireworks:** success, Dazzled until the end of its next turn; failure, Blinded until then; critical failure, Blinded for a minute. **Smoke:** failure or critical failure, Sickened 1. Reminders cover the fire source (and the 1d6 cold to a fire creature), the rise or fall on Sustain, the smoke's −4 Perception, and that it can't recover from Sickened while in the cloud. |

## Rules

- **`src/compiler/lingering-modes.js`:** `extractLingeringModes` reads:
  - the three lead sentences;
  - each list item's area, the Sustain move and the start-of-turn save with its immunity;
  - the smoke's Perception sentence and each item's rows (a missing critical success is unaffected).

  Each mode becomes the lingering wording with "The creature is then temporarily immune for 1 minute." — the save preamble's immunity.
- **`compileSpell`:** compiles each mode on a copy (no target, its area), attaches the reminders, and returns the first plan with `lingeringModes`.
- **`main.js`:** the lingering button asks the mode and starts that mode's plan.
- **Validation:** `basic-save-core` accepts spell-note reminders proved by the `lingeringModes` evidence.

## Interpretation

- **The cold damage to a fire creature is a reminder.** The GM rolls 1d6 cold.
- **The smoke's −4 to visual Perception is a reminder.** So is "can't recover while in the cloud".
- **The area rising or falling is moving the region.**

## Tests

`test/rank-3-batch-113.test.js` is new. It covers both modes' area, event, immunity and rows, and a changed immunity (not read).

A whole-corpus compile (b637 → b638) changed only Pyrotechnics.

## Evidence

[Live evidence](phase-rank-3-batch-113-live-results.json), case `rank3Batch113`, in the `pftest` world, sustained in combat.

| Mode | A failure | Its next turn start |
| --- | --- | --- |
| Fireworks | Blinded; immune | No save (immune); the area still active |
| Smoke | Sickened 1; immune | No save |

**Cleanup:** fixtures, combat and regions removed.
