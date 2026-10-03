# Rank 3 batch 116 — Curse of Lost Time

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Curse of Lost Time (3) | Save modes by the target's kind; the card asks. **A living creature** rolls Fortitude: a critical success is unaffected; a success gives Clumsy 1 and Enfeebled 1 for 1 round; a failure, for 1 hour; a critical failure, unlimited. **A construct** takes the item's 4d6 (+1d6 per rank) with a basic Fortitude save, and on a failure or critical failure the same conditions for 1 hour or unlimited. Reminders cover the immunities, a construct's "can't be Repaired" and counteracted healing, and the object case (the GM's: the bearer's save, 4d6 with Hardness, the curse). |

## Rules

- **`src/compiler/save-modes.js`:** `extractTargetKindModes` reads the lead, the three list items and the living creature's rows, checking the damage against the item and the heightening. It returns each creature mode's save text and the reminders.
- **`compileSpell`:** compiles each mode on a copy (one creature, instantaneous; Fortitude, non-basic; no damage for the living mode) and returns the first with `saveModes`.
- **`main.js`:** `chooseSaveMode` asks the target's kind before the save card starts.
- **Validation:** `basic-save-core` accepts reminders proved by the `saveModes` evidence.

## Interpretation

- **The construct's basic save is written as its four rows.** Half, full or double damage, plus the conditions on the failing rows.
- **The object is the GM's.** It's a reminder, including its Hardness.
- **The immunities are the caster's or GM's call.** Ageless creatures, and precious-material constructs and artifacts.

## Tests

`test/rank-3-batch-116.test.js` is new. It covers both modes' rows, damage and conditions, and different construct damage (not read).

A whole-corpus compile (b640 → b641) changed only Curse of Lost Time.

## Evidence

[Live evidence](phase-rank-3-batch-116-live-results.json), case `rank3Batch116`, in the `pftest` world.

| Target | Result |
| --- | --- |
| Living, failure | Clumsy 1, Enfeebled 1, 1 hour, no damage |
| Construct, failure | 4d6 (11) and the same conditions |
| Living, critical failure | The conditions unlimited |

**Cleanup:** fixtures removed.
