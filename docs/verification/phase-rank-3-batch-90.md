# Rank 3 batch 90 — Stone Lance

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Stone Lance (3) | A spell attack. **Hit:** 6d6 piercing (2d6 more per rank) and a –10-foot circumstance penalty to its Speeds until it Escapes, for the spell's minute at most. **Critical hit:** double damage, the penalty, and Immobilized until it Escapes. An Escape ends both, since they're one restraint. On Escaping, the creature takes 3 persistent bleed damage (1 more per rank). Only a creature on the ground is Immobilized; the GM removes it from one that isn't (a reminder). |

## Rules

- **Impaling lance (`src/compiler/impaling-lance.js`):**
  - It reads the attack, hit, critical-hit, bleed-on-Escape and crumbling sentences and the heightening, and checks them against PF2e's damage and heightening.
  - It rewrites the prose into the spell attack's rows.
  - It keeps the bleed as `resolution.escapeDamage` (core-checked against its sentence).
  - The on-the-ground rule and the crumbling are a reminder.
- **Generated Speed penalties:**
  - The lifetime "until/unless it Escapes" is the spell's fixed time, carrying the outcome Effect's escape (DC, first of time or Escape).
  - A fixed-duration spell may carry such penalties when every one lasts until Escape.
  - A row's lead may be "takes double damage, is {condition} until it Escapes, and takes …".
- **Escape:** an Escape-ended Effect with `escape.damage` deals that persistent damage (PF2e's roll) to the creature that escaped.

## Tests

`test/rank-3-batch-90.test.js` is new. It covers the attack rows, the modifiers and their lifetime, the critical hit's condition, the escape damage, a tampered amount (rejected), a penalty not tied to Escaping (not read), and another heightening (not read).

A whole-corpus compile (b608 → b609) changed only Stone Lance.

## Evidence

[Live evidence](phase-rank-3-batch-90-live-results.json), case `rank3Batch90`, in the `pftest` world, at 4th rank (caster level 7).

| Step | Result |
| --- | --- |
| A hit | 8d6 piercing (24 lost of 24); a −10-foot Speed penalty for 1 minute; not Immobilized |
| It Escapes | The penalty gone; 4 persistent bleed |
| A critical hit | The penalty and Immobilized |
| It Escapes | Both gone; 4 persistent bleed |

**Cleanup:** fixtures removed.
