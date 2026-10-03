# Rank 5 batch 38 — Crucible of Iron

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Crucible of Iron (5) | Reflex. **Success:** Dazzled for 1 round. **Failure:** Dazzled and Enfeebled 1. **Critical failure:** Dazzled, Enfeebled 2 and Immobilized. The failing rows last for 1 minute or until the creature Escapes. Each row also deals 1d10 persistent fire (+1d10 every 2 ranks). |

## Rules

- **Encasing rows (`src/compiler/encasing-rows.js` `rewriteEncasingRows`):**
  - It reads the narration, the save, the four rows (the body parts are narration) and the heightening.
  - It writes the rows with their conditions and an inline persistent formula `(1 + floor((@item.rank - 5)/2))d10`.
  - The item's persistent entry is set aside; the text's step replaces it.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-38.test.js` is new. Its negative case is another lifetime (not read).

A whole-corpus compile (b512 → b513) changed only Crucible of Iron.

## Evidence

[Live evidence](phase-rank-5-batch-38-live-results.json), case `rank5Batch38`, in the `pftest` world, at 7th rank.

| Result | Result |
| --- | --- |
| Failure | Dazzled, Enfeebled 1 (Escape Effect), 2d10 persistent fire |
| Critical failure | Dazzled, Enfeebled 2, Immobilized (Escape Effect), 2d10 persistent fire |

**Cleanup:** fixtures removed.
