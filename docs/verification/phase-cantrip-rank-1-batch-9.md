# Cantrip / rank 1 batch 9 — ground hazards

2026-09-27. Your direction: for burning-ground damage, place something on the map that triggers when a token meets the spell's condition (ends its turn in the area, or moves into it).

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “On any result other than a critical failure, the ground in the target's space catches fire, dealing @Damage[(@item.rank)d6[fire]] damage to each creature that ends its turn in one of the squares.” At Finalize, a region is placed over the target's squares. Each time a creature ends its turn inside, the module rolls and applies the damage (no save, no GM prompt). Also read: “On a hit” / “On a critical hit”, and triggers “starts its turn”, “enters”, “enters or ends its turn” | Fire Ray (1) |
| Duration “until the end of the target's next turn”: the region ends after that turn's damage (out of combat, after one round of world time). A fixed number of rounds or minutes also works | Fire Ray |
| One-sentence attack “The ray deals 2d6 fire damage on a hit (or double damage on a critical hit).” | Fire Ray |

The spell's card shows an **Area:** line for each qualifying target, saying where the region was placed.

**Kept strict (tests):**
- An unread trigger (“stands in”) keeps the spell blocked.
- So does a formula reading anything but the item's rank or level (`@actor.level`), or a duration the region can't keep (daily preparations).
- A tampered hazard (unknown event) is refused at inspection.

## Coverage

**Census:** **487 enabled**, up from 486. Rank 1: 148 of 387. Note-only spells are unchanged (294 non-ritual).
- The b92 corpus diff against b91 changed only Fire Ray (route null → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 524/524 tests pass (`test/cantrip-rank-1-batch-9.test.js`). `test/spell-attack.test.js` no longer expects Fire Ray to be blocked; it now checks an unread hazard wording instead.

[Live evidence](phase-cantrip-rank-1-batch-9-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch9` (in combat):
- A critical failure placed no region.
- A hit placed one region, covering the target's square only.
- A bystander that moved in and ended its turn there took 4 fire damage (1d6).
- The target took 2 at the end of its next turn. The region was then removed and the record ended with `duration`.

**Regressions:** `lingering`, `sustainArea`, `terrainBatch1`, `terrainBatch2`, `spellAttack`, `cr1Batch3` and `cr1Batch7` passed, with cleanup between them. The harness `cleanup` now also removes hazard regions whose record is gone. The run left no P23 fixtures, combats or hazard regions.

## Limits

- The region covers the target's squares when the spell is resolved; it doesn't follow the target.
- Walls and elevation aren't considered: a token whose centre is inside the region when the trigger fires is in it.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b92
node tools/diff-compiled-plans.mjs /tmp/phase23-b91/official-spell-compiler-report.json /tmp/phase23-b92/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b92/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch9`, then `cleanup`.
