# Rank 4 batch 90 — Ymeri's Mark

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ymeri's Mark (4) | The target's Fortitude save (the text's; PF2e's defense is the explosion's Reflex). It is Fatigued for the row's time (1 minute, 7 days, or unlimited), held so it can't be reduced or removed normally. A note on it has two Ongoing controls: Dismiss to detonate, with or without the marked creature. That opens a basic Reflex card of PF2e's 5d6 fire (+2d6 a rank) for the creatures within 10 feet of it, and the spell ends. The sensed direction and "a lapsed mark doesn't detonate" are reminders. |

## Rules

- **Detonating mark (`src/compiler/detonating-mark.js`):**
  - It reads the three preamble paragraphs, the duration rows and the heightening.
  - It rewrites the save as the Fortitude rows (the week as 7 days). The held condition is `locked`.
  - Each held row gets a note with `triggeredDamage` `detonate` (the emanation). It also adds `resolution.detonation`.
- **Held conditions:** a `locked` row condition's grant uses PF2e's `grantee: "restrict"`. The card's snapshot keeps the flag.
- **Detonation (new):**
  - `detonationPlan` builds the explosion's plain basic save: the statistic, PF2e's damage entry and the emanation.
  - `storedTriggers.detonate` finds the creatures within the emanation around the marked token, opens the card at the cast rank and DC, and ends the spell.
  - Validator: the `detonate` trigger (emanation, once, ending), the explosion's damage and sentence, and an executable basic save.
- **Interpretation:** "1 week" is 7 days. The marked creature's inclusion is the caster's choice per detonation. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-90.test.js` is new. It covers the rows, the held flag, the note, the explosion plan, an emanation that isn't a multiple of 5 (refused), and another preamble (not read).

A whole-corpus compile (b580 → b581) changed only Ymeri's Mark.

## Evidence

[Live evidence](phase-rank-4-batch-90-live-results.json), case `rank4Batch90`, in the `pftest` world, at 5th rank (caster level 9).

| Step | Result |
| --- | --- |
| Failure | Fatigued (grant `restrict`); the mark's note |
| Deleting its Fatigued | refused (still Fatigued) |
| Dismiss: detonate without it | card for the creature beside it only; failure: 7d6 fire = 20, lost 20; the marked one lost 0 |
| After | the spell ended; Fatigued removed |

**Cleanup:** fixtures removed.
