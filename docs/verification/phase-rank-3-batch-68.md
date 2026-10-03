# Rank 3 batch 68 — Behold the Weave

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Behold the Weave (3) | Will. Success, failure and critical failure each give a "Locked timeline" note until the end of the target's next turn. The note says how much it commits: a single action (or one activity), at least two actions, or all its actions. It also covers the locked-in rule and losing the last action if the commitment can't be met; the GM plays the commitment. A card reminder covers the 7th-rank option (every enemy in a 30-foot emanation instead of one target). |

## Rules

- **Weave rows (`src/compiler/weave-rows.js`):**
  - It reads the lead, the four rows (the success's full rules, the failure's "at least two" and the critical failure's "all") and the heightened entry.
  - It gives each affected row a note for the target's next turn.
  - The heightened area is a reminder, since the caster picks the targets.
- **Interpretation:** the commitment is GM-played. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-68.test.js` is new. Its negative case is another commitment (not read).

A whole-corpus compile (b547 → b548) changed only Behold the Weave.

## Evidence

[Live evidence](phase-rank-3-batch-68-live-results.json), case `rank3Batch68`, in the `pftest` world (caster level 13).

| Rank | Result | Note |
| --- | --- | --- |
| 3 | success | 1 round, ends at turn end — a single action |
| 3 | critical failure | all of its actions |
| 7 | failure | at least two |
| 7 | critical success | — |

**Cleanup:** fixtures removed.
