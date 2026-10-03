# Rank 3 batch 79 — Unravel Knowledge

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Unravel Knowledge (3) | The target's Will save. On a failure or worse, a note (the sustained spell's time) with two Ongoing controls for when the target uses the chosen ability, once a round: the chosen ability (3d8 mental, +1d8 a rank) or a basic or untrained skill action (3d4, +1d4). A critical failure also gets PF2e's Spell Effect: a toggle that gives its −2 status penalty the first time each round. The choice of ability is a reminder. |

## Rules

- **Knowledge unravel (`src/compiler/knowledge-unravel.js`):**
  - It reads the preamble (narration, the choice, the save), the three rows (a critical success is a success's) and the heightening.
  - It rewrites the rows. The critical failure keeps PF2e's Spell Effect link.
  - The notes carry `triggeredDamage` `ability-used`, with its two variants.
- **New trigger `ability-used`:** variants with their own dice and heightening; one control per variant, once a round.
- **New Effect proof `toggle-penalty-effect`:** PF2e's Effect must be exactly the toggle (RollOption) and a FlatModifier on `all` gated by it, of the row's type and value.
- **Interpretation:** the GM picks the variant that matches the chosen ability. The penalty's "first time each round" is the creature's toggle. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-79.test.js` is new. It covers the notes and variants, the Effect proof, another penalty (refused), no variants (refused), and another heightening (not read).

A whole-corpus compile (b578 → b579) changed only Unravel Knowledge.

## Evidence

[Live evidence](phase-rank-3-batch-79-live-results.json), case `rank3Batch79`, in the `pftest` world, at 3rd rank (caster level 5).

| Step | Result |
| --- | --- |
| Critical failure | PF2e's Spell Effect: Unravel Knowledge; the note |
| It used the chosen ability | 3d8 mental = 6, lost 6 |
| A basic action instead | 3d4 mental = 9, lost 9 |

**Cleanup:** fixtures removed.
