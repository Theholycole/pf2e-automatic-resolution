# Rank 5 batch 27 — Impaling Spike

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Impaling Spike (5) | 8d6 piercing (cold iron, +2d6 a rank), Reflex. **Success:** half. **Failure:** full and Immobilized until it Escapes (spell DC). **Critical failure:** double, Immobilized until it Escapes, and Off-Guard for as long as it's immobilized. The failing rows carry an "Impaled" GM note: solid ground only, and damage equal to its cold iron weakness at the end of each of its turns. |

## Rules

- **Impale rows (`impale-rows.js` `rewriteImpaleRows`):**
  - It reads the narration, "The X is made of M and deals NdY T damage." (the entry's dice, type and material), the save sentence, and the four written rows (the impaling failure with its Escape and weakness sentences, and the "As failure, but … Off-Guard as long as it's impaled" critical failure).
  - The result is written out as plain rows, which the existing condition compilers read: Immobilized ends on an Escape, and Off-Guard ends with Immobilized.
  - The note is on the failing rows.
- **Interpretation and open question:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-27.test.js` is new. Its negative case is a material that isn't the damage entry's (not read).

A whole-corpus compile (b483 → b484) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-27-live-results.json), case `rank5Batch27`, in the `pftest` world, cast at 6th rank (10d6 piercing).

| Result | Lost | Immobilized | Off-Guard | Note |
| --- | --- | --- | --- | --- |
| Failure | 26 (26) | Yes | No | Yes |
| Critical failure | 68 (double 34) | Yes | Yes | Yes |
| Success | 19 (half 38) | No | No | No |

**Cleanup:** fixtures removed.
