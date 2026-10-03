# Rank 4 batch 80 — Ranage's Circle

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ranage's Circle (4) | Fortitude. Success, failure and critical failure each give a "Bound in stone" note that grants PF2e's Clumsy (1, 2 or 2) until the creature moves; the GM deletes the note then, which removes Clumsy. Failure also gives Immobilized, and critical failure Restrained; either lasts until it Escapes at the spell DC. A card reminder marks the target's adjacent squares as difficult terrain for 1 minute. |

## Rules

- **Stone bind (`src/compiler/stone-bind.js`):**
  - It reads the narration, the terrain sentence (with the save) and the four rows.
  - Clumsy becomes a note with a `GrantItem` at the row's value, unlimited. The holds use the existing "until it Escapes" lifetime.
  - The "varies" duration becomes the rows' own times.
- **Note `GrantItem` with a value (`scripts/note-effects.js`):** an optional badge-value override from 1 to 4.
- **Interpretation:** "until they move" ends when the GM deletes the note; the adjacent terrain is the GM's to mark. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-80.test.js` is new. Its negative cases are:

- a badge value out of range (refused);
- another Clumsy lifetime (not read).

A whole-corpus compile (b553 → b554) changed only Ranage's Circle.

## Evidence

[Live evidence](phase-rank-4-batch-80-live-results.json), case `rank4Batch80`, in the `pftest` world, at 4th rank.

| Result | Clumsy | Hold | Escapable |
| --- | --- | --- | --- |
| Success | 1 | — | — |
| Failure | 2 | Immobilized | yes |
| Critical failure | 2 | Restrained | yes |

Deleting the success's note (the creature moved) removed its Clumsy.

**Cleanup:** fixtures removed.
