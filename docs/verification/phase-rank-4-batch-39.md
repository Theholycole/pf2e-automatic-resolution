# Rank 4 batch 39 — Mutilate

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mutilate (4) | One creature takes 5d8 slashing damage (+1d8 per rank), Fortitude save, written out as the basic save's rows. A critical failure adds (1d8 + rank − 4) persistent bleed. The caster takes 1d4 slashing once when the card finalizes. A card note covers the 3-action 5-foot burst. |

## Rules

- **Self-cost save (`self-cost-save.js` `rewriteSelfCostSave`):** it reads:
  - "These cuts are superficial and cause NdM type damage to you; …" (the caster's damage);
  - "The targeted creature takes … damage; a creature that critically fails this saving throw also takes @Damage[(1dX + @item.level - R)[bleed]] damage.", where R is the spell's rank and the damage is the item's;
  - the 3-action burst sentence, only on a "2 or 3" spell;
  - "Heightened (+1) Increase the damage dealt to the target by …, and increase the persistent bleed damage by 1.", against the item's step.

  It writes the four rows with the bleed as persistent.
- **Caster damage:** `resolution.casterDamage` is validated against the compiled sentence. At runtime the card rolls PF2e's damage roll once and applies it to the caster with IWR (`casterDamageResult`).
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-39.test.js` is new. Its negative cases:
- a forged caster damage;
- a bleed formula that doesn't start at the spell's rank.

A whole-corpus compile (b456 → b457) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-39-live-results.json), case `rank4Batch39`, in the `pftest` world, cast at 5th rank.
- The card shows the 5-foot burst note.
- The critical failure took double 6d8 slashing (64) and got persistent bleed "(1d8 + 5 - 4)".
- The caster took 1d4 slashing = 1, once.
- **Cleanup:** fixtures removed.
