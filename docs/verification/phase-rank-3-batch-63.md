# Rank 3 batch 63 — Noxious Metals

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Noxious Metals (3) | 4d6 poison (+2d6 a rank) to living creatures in the area, basic Fortitude. Creatures with the plant or wood trait (read from PF2e), or that the GM says have an anathema toward metal, also take the rows: Success 1, Failure 1d4, Critical Failure 1d8 persistent poison, with Sickened 1/2/3 as long as it lasts. |

## Rules

- **Trait rows (`src/compiler/trait-rows.js` `extractTraitRows`):**
  - It reads the damage sentence, the "Any creature that has the X trait, has the Y trait, or has an anathema toward Z" sentence and the four rows.
  - It builds two degree tables: the plain basic rows and the rows with the persistent damage and the condition.
  - The compile pre-step sets `traitVariant {kind: "trait-rows"}`. The conditions end when the row's persistent damage ends.
- **Core:** the trait-variant validator covers that kind.
- **Runtime:**
  - The snapshot reads the traits.
  - For other creatures, the zone question is asked with the variant's labels ("Anathema toward metal" / "No such anathema"), and Finalize waits for the answers.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-63.test.js` is new. Its negative case is another subject (not read).

A whole-corpus compile (b505 → b506) changed only Noxious Metals.

## Evidence

[Live evidence](phase-rank-3-batch-63-live-results.json), case `rank3Batch63`, in the `pftest` world, at 4th rank (6d6 poison = 17).

| Creature | Result |
| --- | --- |
| Plant trait (no question), failure | 17 lost; 1d4 persistent poison; Sickened 2 |
| Plain, GM: no anathema, failure | 17 lost; nothing more |
| Plain, GM: anathema, critical failure | 34 lost; 1d8 persistent poison; Sickened 3 |

**Cleanup:** fixtures removed.
