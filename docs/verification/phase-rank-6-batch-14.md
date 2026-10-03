# Rank 6 batch 14 — Claim Undead

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Claim Undead | A success: Stunned 1 and Confused for 1 round. A failure: PF2e's Controlled for the spell's 10 minutes, ended by the end-of-turn Will save (a note: when that save frees it, it's then Stunned 1 and Confused for 1 round, for the GM to apply; it doesn't act on a self-destructive order). A critical failure: Controlled for the 10 minutes, with a note that a new save comes only when the caster orders something against its nature. An undead already controlled by another creature: that controller attempts the save (a reminder: roll its save for the target's result). |

## Tests

`test/rank-6-batch-14.test.js` is new. A whole-corpus compile (b749 → b750) changed only Claim Undead.

## Evidence

[Live evidence](phase-rank-6-batch-14-live-results.json), case `rank6Batch14`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Two undead: success / failure | Stunned 1 and Confused / Controlled for 10 minutes with the end-of-turn save and the Claimed note; the controller reminder on the card |

**Cleanup:** fixtures removed.
