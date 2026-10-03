# Rank 7 batch 7 — Defy the Gods

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Defy the Gods | The rows' Drained and Stupefied (1 round on a success, 1 minute otherwise). "If the target has the divine, holy, or unholy trait and becomes drained by this spell, you gain resistance 15 to holy and unholy for 1 minute.": PF2e's Effect (proved to be exactly that resistance for 1 minute) goes on the caster once, at Finalize, when a target with one of those traits (read from PF2e) lands on a row that drains it. This extends the caster-row-Effect route (Mental Map) with a trait gate. |

## Tests

`test/rank-7-batch-7.test.js` is new. A whole-corpus compile (b737 → b738) changed only Defy the Gods.

## Evidence

[Live evidence](phase-rank-7-batch-7-live-results.json), case `rank7Batch7`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A target with no such trait fails | Drained 2, Stupefied 2; no Effect on the caster |
| A holy target fails | Drained 2; the caster's Effect for 1 minute (resistance 15 to holy) |

**Cleanup:** fixtures removed.
