# Rank 4 batch 46 — Freezing Touch

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Freezing Touch (4) | 5d4 persistent cold (+1d4 a rank), Fortitude. **Success:** floor(XdY/2) persistent. **Failure:** XdY persistent and Immobilized for 1 minute or until it Escapes. **Critical failure:** (2 × XdY) persistent, Immobilized, and Off-Guard while immobilized. The fire-trait escape is a GM note on the failing rows. |

## Rules

- **Persistent rows (`persistent-rows.js` `rewritePersistentRows`):**
  - It reads the lead ("takes NdY persistent T damage and must attempt a [save] save") and the four written rows.
  - It writes plain rows (half, full or double damage; Immobilized for the time or until it Escapes; Off-Guard while immobilized) and sets `sharedDamage.persistentScaled`.
- **Runtime:** PF2e ignores a damage multiplier on persistent damage (checked live: 0.5, 1 and 2 all gave "5d4"). For a result other than ×1, the card builds a new persistent roll, `{(floor(F/2))[persistent,T]}` or `{(2*F)[persistent,T]}`, from PF2e's own formula, which can be written in either type order.
- **Validator:** scaled persistent damage needs the one persistent entry and the stated rows. The shared-damage category check accepts it.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-46.test.js` is new. Its negative case is scaling without the stated rows (blocked).

A whole-corpus compile (b489 → b490) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-46-live-results.json), case `rank4Batch46`, in the `pftest` world, cast at 5th rank (6d4).

| Result | Persistent damage | Immobilized | Off-Guard | Note |
| --- | --- | --- | --- | --- |
| Success | floor(6d4/2) cold | No | No | No |
| Failure | 6d4 cold | Yes | No | Yes |
| Critical failure | (2 × 6d4) cold | Yes | Yes | Yes |

**Cleanup:** fixtures removed.
