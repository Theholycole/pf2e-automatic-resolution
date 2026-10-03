# Rank 6 batch 12 — Boots on the Ground, Crusade

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Boots on the Ground | A note on the caster until daily preparations (1 day). The illusory troops' AC (the spell DC) and saves (the spell DC − 10), and the flat check when one is hit, are the GM's. |
| Crusade | A 10-minute note on each target (up to 4). The level tiers (pursue to the death; end at half HP; an end-of-turn Will save at 15th; +2 levels at 10th) are the GM's to play by each creature's level. |

## Tests

`test/rank-6-batch-12.test.js` is new. A whole-corpus compile (b744 → b745) changed only these two.

## Evidence

[Live evidence](phase-rank-6-batch-12-live-results.json), case `rank6Batch12`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Boots on the Ground | The caster's 1-day note |
| Crusade on two creatures | A 10-minute note on each, with the tiers |

**Cleanup:** fixtures removed.
