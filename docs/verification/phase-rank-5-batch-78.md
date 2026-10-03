# Rank 5 batch 78 — Arcane Countermeasure

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Arcane Countermeasure (5) | **PF2e's Spell Effect** on each of the countered spell's targets (the GM targets them), until the end of the turn. Its +2 status bonus is proved against the text. **Text over data:** the bonus is keyed to an "Against the countered spell" option (on by default; switched off for anything else that turn) and also covers the save DCs. **The rank reduction** (1, not below the spell's minimum) is a GM line; the countered spell's card corrects its rank. |

## Rules

- **`src/compiler/countermeasure.js`:** reads the trigger and every sentence; the catalog proves PF2e's rule.
- **Runtime:** new kind `countermeasure`.

## Interpretation

- **"Against it"** can't be detected per roll, so it's a toggle that defaults on: the Effect lasts only that turn.
- **The DC** is the save DCs (`saving-throw-dc`); other DCs are the GM's.

## Tests

`test/rank-5-batch-78.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b686 → b687) changed only Arcane Countermeasure.

## Evidence

[Live evidence](phase-rank-5-batch-78-live-results.json), case `rank5Batch78`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Two targets | Both hold the Effect; AC, Fortitude and the Will DC +2 |
| One switches the option off | Back to normal |

**Cleanup:** fixtures removed.
