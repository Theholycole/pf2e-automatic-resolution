# Rank 3 batch 110 — Primal Chorus

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Primal Chorus (3) | The rule-set family: the caster's Effect until the next daily preparations (PF2e's day). A toggle, "An enemy that replied to your call is in this encounter", gives +1 status to that initiative roll (+1 per 2 ranks), and the roll uses the Effect up. What the caster learns, the GM's Will saves for significant creatures, and the Coerce communication are notes. |

## Rules

- **Rule sets (`src/compiler/rule-sets.js`):** a new `chorus` reader handles the five sentences and the heightening. It returns the toggle, the initiative FlatModifier, the heightened values as `rankRules` (status bonuses don't stack, so each later one replaces the last) and `consumeOn` "check-with-option". It is read ahead of the "no defense" check, since its Will save is the GM's for distant creatures.
- **Consumption (`scripts/climb-aid-runtime.js`):** "check-with-option" now includes initiative rolls.

## Interpretation

- **"Until your next daily preparations" is 24 hours.** That's how PF2e writes it.
- **The Will saves are a note.** Significant creatures resisting the call aren't targets.

## Tests

`test/rank-3-batch-110.test.js` is new. It covers the duration, rules, rank rules and consumption, and a bonus to another roll (not read).

A whole-corpus compile (b634 → b635) changed only Primal Chorus.

## Evidence

[Live evidence](phase-rank-3-batch-110-live-results.json), case `rank3Batch110`, in the `pftest` world, initiative rolled in combat.

| Rank | The Effect | Toggle off | Toggle on |
| --- | --- | --- | --- |
| 3rd | 24 hours | No bonus; the Effect stays | +1; the Effect is used up |
| 5th | 24 hours | No bonus; the Effect stays | +2; the Effect is used up |

**Cleanup:** fixtures and combat removed.
