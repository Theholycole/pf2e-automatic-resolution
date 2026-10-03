# Rank 7 batch 11 — Inexhaustible Cynicism

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Inexhaustible Cynicism | Each failing row ("affected for 1 round / 1 minute / 1 hour") is a note for that time, holding the doubts (unwilling to receive effects, refusing to ingest, treating no one as an ally, believing nothing, distrusting its Recall Knowledge). Its Ongoing control — the GM reports a turn ending without Seeking or interacting to disbelieve — deals the item's 6d6 mental, no save. |

Runtime: a new triggered-damage trigger, "no-seek".

## Tests

`test/rank-7-batch-11.test.js` is new. A whole-corpus compile (b753 → b754) changed only this spell.

## Evidence

[Live evidence](phase-rank-7-batch-11-live-results.json), case `rank7Batch11`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A failure | The 1-minute note, no damage yet |
| Its control | 6d6 mental (27) |

**Cleanup:** fixtures removed.
