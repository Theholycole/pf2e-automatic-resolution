# Rank 3 batch 78 — Skyglass Prison

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Skyglass Prison (3) | Fortitude rows. Success: Immobilized until the start of the caster's next turn or until it Escapes. Failure: Immobilized until it Escapes. Critical failure: Restrained until it Escapes. Escapes are at the spell DC. Each held row adds a note whose Ongoing control deals the shards (PF2e's 3d4 slashing, +1d4 a rank) when the creature Escapes or the cage is destroyed or Dismissed; using it also ends the cage's restraint on that creature. The cage's AC, Hardness and Hit Points (+10 a rank) are a reminder. |

## Rules

- **Glass cage (`src/compiler/glass-cage.js`):**
  - It reads the preamble (cage statistics, shards, Dismiss), the rows and the heightening.
  - It rewrites the rows as "until it Escapes". The success's automatic destruction is "until the start of your next turn".
  - It adds the shards note with `triggeredDamage` to each held row. The success's note lasts as long as its condition.
- **New trigger `cage-broken`:**
  - The GM reports it (once). It ends the note, and the hostile-damage handler also removes that cast's restraint Effect on the creature.
  - Validator: once, ending the spell.
- **Interpretation:** the GM uses the control when the creature Escapes, the cage is destroyed, the caster Dismisses, or a success's cage breaks at the start of the caster's next turn. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-78.test.js` is new. It covers the rows, the notes, the reminder, a trigger that doesn't end (refused), and another preamble (not read).

A whole-corpus compile (b573 → b574) changed only Skyglass Prison.

## Evidence

[Live evidence](phase-rank-3-batch-78-live-results.json), case `rank3Batch78`, in the `pftest` world, at 4th rank (caster level 7).

| Step | Result |
| --- | --- |
| Failure | Immobilized; the cage note |
| Critical failure | Restrained (with PF2e's Immobilized); the cage note |
| GM: the first cage broke | 4d4 slashing = 12, lost 12; its Immobilized ended |
| The other creature | still Restrained |

**Cleanup:** fixtures removed.
