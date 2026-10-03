# Rank 5 batch 84 — Symphony of the Unfettered Heart

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Symphony of the Unfettered Heart (5) | **The condition** (one of the six listed, present on the target), **the source's DC** and **its counteract rank** come from the GM (a dialog, or the `condition`, `dc` and `effectRank` options). **For each target** (yourself or 1 ally; up to 4 at 9th): the caster's Performance check against that DC, with PF2e's counteract rule at the cast rank. **A success** removes the condition and the Effects granting it. **A failure** locks that condition on that target for 1 day (an Effect; a later try is refused). |

## Rules

- **`src/compiler/skill-counteract.js`:** reads every sentence (the listed conditions are links) and the Heightened entry.
- **Runtime:** new kind `skill-counteract`; `counteracts` from `affliction-care-core`.

## Interpretation

- **QUESTION: "the same effect".** It's tracked per condition on that target, since the module can't identify the source effect.
- **One check per target** at 9th.

## Tests

`test/rank-5-batch-84.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b692 → b693) changed only Symphony of the Unfettered Heart.

## Evidence

[Live evidence](phase-rank-5-batch-84-live-results.json), case `rank5Batch84`, in the `pftest` world.

| Step | Result |
| --- | --- |
| An ally Grabbed by an Effect; DC 1, rank 1 | Counteracted: the Effect and Grabbed gone |
| An ally Restrained; DC 80, rank 10 | Failed; locked for 24 hours |
| Again on it | Refused (locked) |
| Two targets at 5th | Refused |
| Two at 9th | Each handled: one no longer has it, the other locked |

**Cleanup:** fixtures removed.
