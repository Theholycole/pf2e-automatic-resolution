# Rank 10 batch 1 — Hero's Defiance

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Hero's Defiance | Direct healing: "Just before applying the attack's damage, you recover 6d8+20 Hit Points." is the caster's healing. The reader now takes a free action's or reaction's Trigger paragraph as a note (Life Siphon's and Breath of Life's cards gain theirs too, with the same healing). What the healing prevents, and when it can be used again, are notes. |

## Tests

`test/rank-10-batch-1.test.js` is new. A whole-corpus compile (b732 → b733) changed Hero's Defiance, and added a trigger note to Life Siphon and Breath of Life (both still automatic healing).

## Evidence

[Live evidence](phase-rank-10-batch-1-live-results.json), case `rank10Batch1`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Hero's Defiance at 10 HP | The caster heals 40 (6d8+20); the card shows the trigger and the Refocus limit |

**Cleanup:** fixtures removed.
