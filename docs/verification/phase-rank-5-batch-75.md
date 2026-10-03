# Rank 5 batch 75 — Rewrite Possibility

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Rewrite Possibility (5) | **The target's Effect** for 1 minute: +1 status to initiative. A recast by the same caster ends the previous one. **The card's reaction** (trigger: the target fails a check) runs PF2e's reroll of the target's latest failed check, keeping the higher result. The new roll gets the +2 status bonus, less any status bonus already on the check. |

## Rules

- **`src/compiler/rewrite-fate.js`:** reads the sentences and the reaction's trigger and effect.
- **Runtime:**
  - **New kind `rewrite-fate`.**
  - **`rewriteReroll`** (API and card button): PF2e's `rerollFromMessage` (keep higher), with a one-shot `pf2e.preReroll` hook adding the bonus to the new roll.

## Interpretation

- **"The target fails a check"** is the latest failed check in the chat by the target (or a given message).
- **Status bonuses don't stack**, so the bonus added is the difference from one already on the check.

## Tests

`test/rank-5-batch-75.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b683 → b684) changed only Rewrite Possibility.

## Evidence

[Live evidence](phase-rank-5-batch-75-live-results.json), case `rank5Batch75`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast on an ally | Initiative +1 |
| It fails a Fortitude save (DC 60); the reaction | PF2e's reroll "1d20 + 10 + 2"; the higher total kept |
| A recast on another creature | The first Effect gone; the second applied |

**Cleanup:** fixtures removed.
