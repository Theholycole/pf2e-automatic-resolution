# Rank 3 batch 107 — Ranger's Bramble

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ranger's Bramble (3) | Entangling Flora's own text and rules (its PF2e Effect), for the bramble's 5-foot burst and Reflex save, as a lingering area. The critical failure row also deals the inline roll as persistent bleed: `(max(0, rank − 1))d4`, so 2d4 at 3rd. "Escaping doesn't end the bleed" is a card note. |

## Rules

- **Borrowed spell (`src/compiler/borrowed-spell.js`):** `rewriteBorrowedCriticalRider` reads:
  - "with the effects of @UUID[…]{X}", the critical-failure damage sentence and the Escape sentence;
  - the heightening (one die a rank, matching the inline roll);
  - the referenced spell: the same non-basic save, whose critical failure names the same condition.
- **`compileSpell`:** it compiles the referenced spell's text on this item. When the critical-failure row deals no damage, it gets the persistent formula, plus a `borrowed-rider-note` reminder that `basic-save-core` accepts only as one of the compiled sentences.

## Interpretation

- **The bleed is persistent.** Bleed damage is persistent in PF2e, and "Escaping doesn't end it".
- **The area is the bramble's.** A 5-foot burst, not Flora's 20 feet of plants.

## Report tool

`tools/report-rule-family.mjs` now gives its detached-identity recompile every spell as `referencedSpells`, as the official compile does. Without them, a spell with another spell's effects compiled differently, and the escape family reported Ranger's Bramble as a regression.

## Tests

`test/rank-3-batch-107.test.js` is new. It covers the area, the row's damage, the note and support, the spell without its reference (not read), and a differing heightening (not read).

A whole-corpus compile (b631 → b632) changed only Ranger's Bramble.

## Evidence

[Live evidence](phase-rank-3-batch-107-live-results.json), case `rank3Batch107`, in the `pftest` world, cast at 4th rank, in combat.

| Creature | At its turn start | Result |
| --- | --- | --- |
| One | Critical failure | Immobilized, Speed 15, persistent "3d4 bleed" |
| Another | Failure | Speed 15 only |

**Cleanup:** fixtures, combat and region removed.
