# Rank 4 batch 79 — Planar Tether

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Planar Tether (4) | Will. Success, failure and critical failure each give a "Planar tether" note for the row's time: 1 minute, 10 minutes or 1 hour. The note carries a ward, so Ongoing spells shows "Counteract with Planar Tether". When a teleportation or planar-travel effect would move the creature, the GM enters it there and the module rolls the spell's counteract at the cast rank. |

## Rules

- **Plane anchor (`src/compiler/plane-anchor.js`):**
  - It reads the lead (the counteract sentence, the save) and the "The effect's duration is …" rows.
  - It gives each affected row a note with a `ward {trigger, successText}`.
  - The "varies" duration becomes the rows' own times.
- **Notes with a ward (`scripts/note-effects.js`):** a validated `ward` goes into the note's runtime flags with the cast rank, so the existing ward control and its counteract roll apply.
- **Interpretation:** the counteract happens when the GM uses the control; nothing detects teleportation. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-79.test.js` is new. It checks that the prepared note source carries the ward at the cast rank. Its negative cases are:

- an empty trigger (refused);
- another duration wording (not read).

A whole-corpus compile (b545 → b546) changed only Planar Tether.

## Evidence

[Live evidence](phase-rank-4-batch-79-live-results.json), case `rank4Batch79`, in the `pftest` world, at 6th rank (heightened; caster level 11).

| Result | Note | Ward rank |
| --- | --- | --- |
| Success | 1 minute | 6 |
| Failure | 10 minutes | 6 |
| Critical failure | 1 hour | 6 |

The failure's ward counteract against a rank-1 effect at DC 5 was a critical success: countered.

**Cleanup:** fixtures removed.
