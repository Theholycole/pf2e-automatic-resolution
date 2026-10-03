# Rank 3 batch 55 — Soul Cutter

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Soul Cutter (3) | Each PF2e variant (1, 2 or 3 actions) is a melee spell attack with its own paragraph's rows. **1 action:** 3d6. **2 actions:** 6d6, and Enfeebled 1 for 1 round on a hit. **3 actions:** 6d6, half damage and Enfeebled 1 on a miss, nothing on a critical miss. Every variant doubles on a critical hit. Damage is spirit, as the text says; PF2e's variants say bludgeoning. It heightens by 1d6 (1 action) or 2d6 (2 or 3 actions). |

## Rules

- **Action attack variant (`action-attack-variant.js` `rewriteActionAttackVariant`):**
  - It reads the lead: the attack, "On a success, you deal T damage", the double on a critical success, and the action-count sentence.
  - It reads each variant's glyph paragraph: an adjacent target with an optional hit condition, or "flies out … within N feet" with half damage on a failure and "Unless you critically fail".
  - The Heightened entry must match the variant's PF2e step.
  - The result is written out as the attack's rows (hit rows only when a miss does nothing). The reach becomes a note.
- **Spell attack table:** a written four-row table is also read when the miss is "The target takes half damage (and is …)" and the critical miss is unaffected.
- **Type override (`sharedDamage.typeOverride`):**
  - The runtime retypes PF2e's rolled instances from the data's type to the text's. It refuses if any instance is another type.
  - The validator requires the one entry of the data's type, plus the evidence sentence.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-55.test.js` is new. Its negative cases are:
- a type override whose `from` isn't the data's type (blocked);
- a variant whose heightening step isn't the text's (not read).

A whole-corpus compile (b472 → b473) changed only Soul Cutter's three variants.

## Evidence

[Live evidence](phase-rank-3-batch-55-live-results.json), case `rank3Batch55`, in the `pftest` world.

| Cast | Result | Damage | Lost | Enfeebled |
| --- | --- | --- | --- | --- |
| 1 action, 3rd | Hit | 3d6 spirit = 13 | 13 | 0 |
| 2 actions, 4th | Critical hit | 8d6 spirit = 31 | 62 | 1 |
| 3 actions, 3rd | Miss | 6d6 spirit = 10 | 5 | 1 |
| 3 actions, 3rd | Critical miss | — | 0 | 0 |

**Cleanup:** fixtures removed.
