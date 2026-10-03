# Rank 3 batch 77 — Steal Shadow

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Steal Shadow (3) | Fortitude rows. Success: Enfeebled 1 for 1 round. Failure: PF2e's 3d4 void damage (+1d4 a rank) and Enfeebled 1 for the spell's duration. Critical failure: the same damage and Enfeebled 2. On the first Sustain of each later round, a basic save card of the same damage opens for each target that failed. The missing shadow is a reminder. |

## Rules

- **Shadow theft (`src/compiler/shadow-theft.js`):**
  - It reads the four rows and the heightening.
  - It rewrites the failing rows' inline damage as PF2e's item damage, so it heightens.
  - It adds `resolution.sustainStrike`: the throttle's degrees, statistic and sentence.
- **Sustain's basic save (new, `sustainStrike`):**
  - `sustainStrikePlan` builds the throttle's plan: a plain basic save of the spell's damage, one creature, no conditions.
  - The native sustained record keeps the failed targets' tokens.
  - The first Sustain each round opens the card for them. The caster may leave it unfinalized ("you can throttle").
  - Validator: a sustained degree save, failing degrees only, the compiled sentence, and an executable basic save.
- **Interpretation:** a critical failure's cast damage is full, not double ("As failure, but … Enfeebled 2"). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-77.test.js` is new. It covers the rows, the Sustain plan, a non-failing degree (refused), and another throttle save (not read).

A whole-corpus compile (b571 → b572) changed only Steal Shadow.

## Evidence

[Live evidence](phase-rank-3-batch-77-live-results.json), case `rank3Batch77`, in the `pftest` world, at 4th rank (caster level 7), in combat.

| Step | Result |
| --- | --- |
| Cast: failure | 4d4 void = 9, lost 9; Enfeebled 1 |
| Cast: success | no damage; Enfeebled 1 (1 round) |
| Next round's Sustain | card for the failed target only; failure: 4d4 void = 13, lost 13 (the other lost 0) |
| End | Enfeebled removed |

**Cleanup:** fixtures and combat removed.
