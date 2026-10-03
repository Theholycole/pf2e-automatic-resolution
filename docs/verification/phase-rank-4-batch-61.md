# Rank 4 batch 61 — Channel Arrogance

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Channel Arrogance (4) | Will, 5d10 mental (+1d10 a rank). **Success:** half damage, Fascinated for 1 round. **Failure:** full damage, Fascinated for 1 round, and the flat check on speech (a note). **Critical failure:** double damage, both for 1 minute. A 1-action cast gives a result one degree better (the GM's answer on the card). |

## Rules

- **Praise rows (`src/compiler/praise-rows.js` `rewritePraiseRows`):**
  - It reads the two preamble paragraphs, the four rows and the item's damage.
  - It writes the rows with Fascinated for each row's time.
  - Post-compile: a `gm-confirmed` degree adjustment (one better) for the 1-action cast, and the praise note on the failing rows for Fascinated's time.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-61.test.js` is new. Its negative case is another quick-cast effect (not read).

A whole-corpus compile (b521 → b522) changed only Channel Arrogance.

## Evidence

[Live evidence](phase-rank-4-batch-61-live-results.json), case `rank4Batch61`, in the `pftest` world, at 5th rank (6d10 mental = 29).

| GM's answer, result | Result |
| --- | --- |
| Not a 1-action cast, failure | 29 lost, Fascinated, praise note |
| 1-action cast, Will −10, rolled critical failure | Failure (one better), 29 lost |

**Cleanup:** fixtures removed.
