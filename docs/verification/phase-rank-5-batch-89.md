# Rank 5 batch 89 — Mirecloak

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mirecloak (5) | **PF2e's Spell Effect** on each of up to 4 targets for 1 minute: +1 status to AC and +2 status to Stealth in dim light or darkness (proved). **Text over data:** PF2e's dim-light toggle is named `mireclock-darkness` while its rules check `mirecloak-darkness`, so the toggle is renamed to work. **The card's control** per wearer "A creature damaged it in melee or touched it (target it)" posts that creature's Will save card: 2d8 mental; half on a success; full and Sickened 1 on a failure; double and Sickened 2 on a critical failure. The creature is then immune for 24 hours, and that wearer's cloak ends. An immune attacker leaves the cloak in place. The information gleaned is a GM line. |

## Rules

- **`src/compiler/mire-cloak.js`:** reads every sentence and row; the catalog proves the Effect's bonuses and finds the option its rules check.
- **`compile-ability`:** the attacker's save is a compiled plan of the item's damage and the stated rows, with a 24-hour `temporaryImmunity`.
- **Runtime:** new kind `mire-cloak`; `mireRetaliate` (API and card button).

## Interpretation

- **"The spell ends for the cloaked creature"** removes only that wearer's Effect.

## Tests

`test/rank-5-batch-89.test.js` is new. It covers the data, the toggle override, the plan (supported) and an unrecognised clause (not read).

A whole-corpus compile (b697 → b698) changed only Mirecloak.

## Evidence

[Live evidence](phase-rank-5-batch-89-live-results.json), case `rank5Batch89`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Two wearers; the dim-light toggle on | AC +1 |
| An attacker (Will −40) hit the first; it fails | 12 mental, Sickened 1; the first cloak ends; immune 24 hours |
| It hits the second | Immune: the second cloak stays |

**Cleanup:** fixtures removed.
