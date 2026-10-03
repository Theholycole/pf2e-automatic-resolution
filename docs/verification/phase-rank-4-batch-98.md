# Rank 4 batch 98 — Overflowing Sorrow

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Overflowing Sorrow (4) | The caster's sustained 15-foot emanation (+5 feet every 2 ranks), the caster out of it. A creature entering or starting its turn inside saves (Will) once: it's immune for the spell after any result. Success: a note with PF2e's −1 status modifier to skill and Perception checks. Failure: a note with the emotion suppression and the DC 11 flat check. Critical failure: the same, and it can't use emotion actions or spells. Each note lasts while the creature is in the area. Re-entry (its original result) and the optional larger area are reminders. |

## Rules

- **Sorrow aura (`src/compiler/sorrow-aura.js`):**
  - It reads the preamble, the four rows (the flat check from its `@Check`) and the heightening.
  - It writes the trigger and the rows as notes.
  - Post-hook: the notes, a per-result immunity for the spell's minute, `excludeCaster`, the area step, and the reminders.
- **Notes while in the area (new):**
  - `whileInArea` (unlimited duration) flags the note with the lingering record's `leaveArea`, so `clearLeaveArea` removes it when the creature leaves. The card passes its `lingeringCastId`.
  - New note rule: a status or circumstance FlatModifier (−1 to −4) on `["skill-check","perception"]`.
- **Interpretation:**
  - "Uses the same effect as before" is no new save; the GM re-applies the note on re-entry.
  - The heightened area is always taken (shrink it if not chosen).
  - The suppression and flat check are the GM's (a note).
  - Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-98.test.js` is new. It covers the declaration, the notes and rule, the immunity, the exposures, an in-area note with a fixed time (refused), and another re-entry rule (not read).

A whole-corpus compile (b593 → b594) changed only Overflowing Sorrow.

## Evidence

[Live evidence](phase-rank-4-batch-98-live-results.json), case `rank4Batch98`, in the `pftest` world, at 4th rank (caster level 7).

| Step | Result |
| --- | --- |
| A creature walks in; success | its note; Perception −1 |
| It walks out | note removed |
| It walks back in | not asked again |

**Cleanup:** fixtures removed.
