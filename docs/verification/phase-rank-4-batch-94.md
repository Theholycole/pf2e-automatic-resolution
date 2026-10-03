# Rank 4 batch 94 — Tomorrow's Dawn

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Tomorrow's Dawn (4) | PF2e's Spell Effect on the caster: light (bright 20 feet, dim 40) and mental resistance 5 (10 at 6th, 15 at 8th). A sustained 5-foot emanation around the caster (the caster out of it). A nindoru fiend or undead (the GM confirms) that starts its turn in it saves (Will rows). Success: Sickened 1 to the end of its turn. Failure: Sickened 1 and Slowed 1 to the end of its next turn. Critical failure: Sickened 2, and Slowed 1 while the aura lasts. A critical success makes it immune for the spell's minute. |

## Rules

- **Dawn aura (`src/compiler/dawn-aura.js`):**
  - It reads the benefit, the creatures, the four rows and the two heightened entries.
  - It rewrites the rows. The critical failure's Slowed is "by the area" (it ends with the aura; the aura is the spell).
  - Post-hook: the caster's Effect (`lingering.casterEffect`) with the benefit claim, the critical success's immunity, the GM-confirmed predicate, and `excludeCaster`.
- **Caster benefit proof (extended):** `inspectCasterBenefitClaim` now reads a TokenLight ("bright light in a 20-foot radius (and dim light for the next 20 feet)") and a Resistance stated with its heightened values (PF2e's ternary).
- **Interpretation:**
  - "Adjacent" is the 5-foot emanation.
  - The critical failure's Sickened 2 keeps its own recovery.
  - "Nindoru fiend or undead" is the GM's confirmation.
  - Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-94.test.js` is new. It covers the declaration, the Effect claim, the rows, the immunity, the exposure plan, another heightened resistance (not proven), and another creature type (not read).

A whole-corpus compile (b585 → b586) changed only Tomorrow's Dawn.

## Evidence

[Live evidence](phase-rank-4-batch-94-live-results.json), case `rank4Batch94`, in the `pftest` world, at 4th rank (caster level 7), in combat.

| Step | Result |
| --- | --- |
| Start | caster: Spell Effect: Tomorrow's Dawn; mental resistance 5 |
| An undead beside it starts its turn; critical failure | Sickened 2; Slowed 1 |
| End | Slowed removed; Sickened 2 stays; caster's Effect removed |

**Cleanup:** fixtures and combat removed.
