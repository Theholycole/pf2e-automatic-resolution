# Rank 5 batch 34 — Divine Immolation

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Divine Immolation (5) | 6d6 fire and (rank − 3)d6 persistent fire, by Reflex save (+1d6 each per rank). A success halves the damage with no persistent damage; a failure deals full damage and the persistent damage; a critical failure doubles both. A creature that spirit damage hurts more (by PF2e's immunities, weaknesses and resistances) takes spirit instead, its persistent part too. |

## Rules

- **Detrimental type (`src/compiler/detrimental-type.js` `rewriteDetrimentalType`):**
  - It reads the damage sentence (the item's entry and the persistent formula), the "more detrimental" sentence, the four rows and the heightening.
  - It writes the rows with the persistent formula (doubled as `(2*(…))` on a critical failure) and `resolution.damageSwap` `{when: "more-detrimental"}`.
- **Core:**
  - `executableDamageSwap` covers that kind.
  - `moreDetrimental(actor, from, to)` compares the two types.
  - `swapDamageType` also renames the persistent spellings.
- **Runtime:** the shared roll and each row's persistent roll take the swapped type for those creatures.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-34.test.js` is new. It checks the comparison cases. Its negative case is another determination (not read).

A whole-corpus compile (b504 → b505) changed only Divine Immolation.

## Evidence

[Live evidence](phase-rank-5-batch-34-live-results.json), case `rank5Batch34`, in the `pftest` world, at 6th rank (7d6 fire = 25).

| Creature | Result |
| --- | --- |
| Plain, failure | 25 lost; 3d6 persistent fire |
| Fire resistance 10, failure | Spirit instead: 25 lost; 3d6 persistent spirit |
| Plain, critical failure | 50 lost; (2 × 3d6) persistent fire |

**Cleanup:** fixtures removed.
