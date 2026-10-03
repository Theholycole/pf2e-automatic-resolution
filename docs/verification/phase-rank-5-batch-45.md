# Rank 5 batch 45 — Vindicator's Judgment

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Vindicator's Judgment (5, focus) | Fortitude; the target must be the caster's hunted prey (the GM confirms on the card). Each affected row gives a "Judgment" note with the weakness at the cast rank (5; 10 at 7th; 15 at 9th): until the end of the caster's next turn on a success (next Strike or divine spell only), or the spell's minute otherwise. The note also carries the critical failure's Off-Guard against the caster's first attack each round. The GM adds the weakness and Off-Guard to the caster's Strikes and divine spells, because PF2e's Weakness can't be limited to one attacker. |

## Rules

- **Judgment rows (`src/compiler/judgment-rows.js`):**
  - It reads the lead, the target "your hunted prey", the rows, and the two heightened weakness entries. They must be one even step (base at the rank, +step every interval).
  - It gives each affected row a note with `rankAmount`.
  - Targeting is a GM-confirmed hunted prey.
- **Interpretation:** the attacker-scoped weakness and Off-Guard are GM-applied notes. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-45.test.js` is new. It checks the amounts at ranks 5–9. Its negative case is an uneven heightening (not read).

A whole-corpus compile (b546 → b547) changed only Vindicator's Judgment.

## Evidence

[Live evidence](phase-rank-5-batch-45-live-results.json), case `rank5Batch45`, in the `pftest` world. The GM confirmed the hunted prey each time.

| Rank (caster level) | Result | Note |
| --- | --- | --- |
| 5 (9) | success | 1 round, ends at turn end, weakness 5 |
| 7 (13) | critical failure | 1 minute, weakness 10, Off-Guard in the note (no condition) |

**Cleanup:** fixtures removed.
