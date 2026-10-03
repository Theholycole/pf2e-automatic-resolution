# Rank 4 batch 96 — Purifying Veil

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Purifying Veil (4) | An area on the target (Large or smaller) for the minute. It is Concealed, with the note that creatures outside are concealed to it. When it moves through the veil, the GM uses the Ongoing control: that opens its basic Will save against PF2e's 4d6 spirit (+1d6 a rank), and the spell then ends. "Doesn't impede attacks or movement" is a note. |

## Rules

- **Purifying veil (`src/compiler/purifying-veil.js`):**
  - It reads the five sentences and the target's size.
  - It writes the lingering declaration: centred on the targets, no events, concealment, and `gmAction` ending the spell, plus the note.
  - It adds the size predicate.
- **A target's own GM action (extended):** the GM-only lingering control may be centred on the cast's target with this spell's sentence. The exposure then ends the spell once resolved (the existing `endsSpell`).
- **Interpretation:** "moves through the veil" and "leaves the veil" are the same crossing: the damage, then the end. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-96.test.js` is new. It covers the declaration, the size, the exposure plan, a crossing without its sentence (refused), and another ending (not read).

A whole-corpus compile (b590 → b591) changed only Purifying Veil.

## Evidence

[Live evidence](phase-rank-4-batch-96-live-results.json), case `rank4Batch96`, in the `pftest` world, at 4th rank (caster level 7).

| Step | Result |
| --- | --- |
| Start | the target is Concealed |
| The GM: it moved through the veil; failure | 4d6 spirit = 11, lost 11 |
| After | the spell ended; Concealed removed |

**Cleanup:** fixtures removed.
