# Rank 4 batch 87 — Bloodspray Curse

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Bloodspray Curse (4) | The target's Fortitude save. On a success or worse, a 1-minute note with one Ongoing control per damage type (piercing, slashing), used when a single Strike would deal it 10 or more of that type. Once a round, it deals the added (rank ÷ 2)d6 of that type. On a failure or critical failure it also deals (rank ÷ 2)d6 persistent bleed. |

## Rules

- **Bloodspray (`src/compiler/bloodspray.js`):**
  - It reads the lead, the three rows (a critical failure is a failure's) and the heightening.
  - The rows become notes with `triggeredDamage` `strike-wound`: the row's formula, its two types, the threshold, once a round, and the failure's extra persistent bleed.
  - The duration "varies" is the rows' (1 minute).
- **New trigger `strike-wound`:**
  - The GM reports the Strike and its type (one control per type). The once-a-round check is the existing one.
  - The extra roll is applied as persistent damage.
  - Validator: the formula (rank or level only), the two types, once a round, the extra persistent.
- **Interpretation:** the failure's inline "bleed" damage is persistent bleed (the heightening says "the persistent bleed damage"). The 10-damage threshold is the GM's judgement ("would take"). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-87.test.js` is new. It covers the notes, the extra bleed, once only (refused), and another heightening (not read).

A whole-corpus compile (b575 → b576) changed only Bloodspray Curse.

## Evidence

[Live evidence](phase-rank-4-batch-87-live-results.json), case `rank4Batch87`, in the `pftest` world, at 4th rank (caster level 7), in combat.

| Step | Result |
| --- | --- |
| Failure; a slashing Strike wounds it | 2d6 slashing = 6, lost 6; 2d6 persistent bleed on it |
| Again the same round | refused |
| Next round; a piercing Strike | 2d6 piercing = 10, lost 10 |

**Cleanup:** fixtures and combat removed.
