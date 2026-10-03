# Rank 4 batch 88 — Achaekek's Clutch

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Achaekek's Clutch (4) | The target's Will save. On a success or worse, a note: 1 minute after a success, unlimited after a failure. Its Ongoing control is used when the creature gains persistent bleed damage: the GM gives the amount, and it takes that much slashing damage, once a round. The critical failure's flat-check DC (20, or 15 with particularly effective assistance) is in its note for the GM. |

## Rules

- **Mantis mark (`src/compiler/mantis-mark.js`):**
  - It reads the rows. Each failing row becomes a note with `triggeredDamage` `bleed-gained`, with its duration: 1 minute, or unlimited.
  - The save's text is restored from PF2e's defense; the preamble doesn't state it.
- **New trigger `bleed-gained`:**
  - The GM's control asks for the persistent damage's amount (a number or dice) and deals it as the stated type, once a round.
  - Validator: the types, once a round, no formula of its own.
- **Interpretation:** "that amount" is the persistent bleed damage's amount as written (its dice, rolled again as slashing). The flat-check DC is the GM's. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-88.test.js` is new. It covers the notes, the durations, the critical failure's DC, a frequency other than once a round (refused), and another failure row (not read).

A whole-corpus compile (b576 → b577) changed only Achaekek's Clutch.

## Evidence

[Live evidence](phase-rank-4-batch-88-live-results.json), case `rank4Batch88`, in the `pftest` world, at 4th rank (caster level 7).

| Step | Result |
| --- | --- |
| Failure | the note, unlimited |
| Control with no amount | refused |
| The GM reports 2d6 persistent bleed gained | 2d6 slashing = 7, lost 7; the note stays |

**Cleanup:** fixtures removed.
