# Rank 5 batch 69 — Establish Ward

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Establish Ward (5) | **The ward** is a burst around the caster's position when cast (30 feet, +5 per 2 ranks), made as a region (or the GM's selected region), for 1 minute. **The caster** is Quickened while inside the ward (the extra action only for its Strikes, a note) and Slowed 1 while outside. Both are Ongoing's area rules: they swap as the caster moves and end with the spell. **The card's Strikes** (nature's wrath) have three buttons, one per multiple attack penalty (0, −5, −10). Each is a melee spell attack against a creature in the ward, made while the caster is in it, dealing 3d8 (+1d8 per 2 ranks) damage of the physical type picked, doubled on a critical hit. The first can be part of the cast. |

## Rules

- **`src/compiler/ward.js`:** reads every sentence and the Heightened entry; `wardAt` gives the radius and dice at a rank.
- **`startAreaRules`:** takes `only` (one creature's rules) and `outside` (that creature's Effect while it's not in the area, removed on re-entering and when the area ends).
- **Runtime:** new kind `ward`; `cardAction("ward-strike-N")` / `wardStrike` (API).

## Interpretation

- **QUESTION: the ward's centre.** The burst has no range, so it's placed around the caster's position when cast. A GM-selected region is used instead when passed.
- **The multiple attack penalty** is the button the caster picks (it also counts other attacks that turn).
- **"Target any creature within the ward"**: both the caster and the target must be inside the region.

## Tests

`test/rank-5-batch-69.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b677 → b678) changed only Establish Ward.

## Evidence

[Live evidence](phase-rank-5-batch-69-live-results.json), case `rank5Batch69`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 5th | 30-foot ward, 3d8; the caster Quickened, not Slowed |
| A Strike (slashing) on a creature inside (AC 5) | Hit; its damage applied |
| A Strike on a creature 50 feet away | Refused (not within the ward) |
| The caster walks 45 feet out | Slowed 1, not Quickened; its Strike refused |
| The caster walks back | Quickened, not Slowed |
| The spell ends | Neither; the ward's region removed |
| Cast at 7th | 35 feet, 4d8 |

**Cleanup:** fixtures and the records removed.
