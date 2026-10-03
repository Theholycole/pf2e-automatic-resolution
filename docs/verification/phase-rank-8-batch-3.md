# Rank 8 batch 3 — Spiritual Epidemic

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Spiritual Epidemic | Its table as compiled (two layers on a failure and a critical failure: the higher value for a minute, the lower permanently). The spreading sentences (`rewriteSpreadingCurse`) give each affected creature a repeatable card. The GM presses it whenever a creature casts a divine or occult spell on that creature, starting that caster's save with the same table, so the curse spreads again. The core accepts this chain without an immunity, proven by its sentences. |

## Tests

`test/rank-8-batch-3.test.js` is new. A whole-corpus compile (b730 → b731) changed only this spell.

## Evidence

[Live evidence](phase-rank-8-batch-3-live-results.json), case `rank8Batch3`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A failure | Enfeebled 2 and Stupefied 2 (with the permanent 1s beneath) |
| The victim's spread card pressed for two casters | Each gets its own save card (the card stays usable) |

**Cleanup:** fixtures removed.
