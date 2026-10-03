# Rank 9 batch 3 — Unblinking Flame Ignition

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Unblinking Flame Ignition | PF2e's Effect on the caster, proved against the text (greater darkvision, low-light vision and see invisibility; a fly Speed equal to the land Speed; Quickened). The extra action's limit (only Strike or Fly) is a note. A 5-foot emanation on the caster for the 3 rounds deals 1d12 fire (no save) to each other creature as its turn starts (Manifest Will's turn-start aura, now able to deal damage). |

## Tests

`test/rank-9-batch-3.test.js` is new. A whole-corpus compile (b745 → b746) changed only this spell.

## Evidence

[Live evidence](phase-rank-9-batch-3-live-results.json), case `rank9Batch3`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast | The caster's Effect: Quickened, fly Speed 25 |
| A combat round: an adjacent creature, one 50 feet away, the caster | 9 fire to the adjacent one; 0 to the far one; 0 to the caster |

**Cleanup:** fixtures removed.
