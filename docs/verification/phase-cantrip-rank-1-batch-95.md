# Cantrip / rank 1 batch 95 — Winter Bolt

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The bolt deals 1d8 piercing damage and lodges in the target.” with the rows “The initial bolt deals full damage …” / “The bolt and its explosion deal full damage.”: full damage on a critical hit and on a hit | Winter Bolt (1) |
| “At the end of the target's next turn, the bolt shatters, … (@item.rank)d12 cold … to the target and all adjacent creatures.” (doubled after a critical hit): a “Lodged bolt” note until the end of the target's next turn. Its Ongoing control deals the explosion to the target and the adjacent creatures the GM targets | Winter Bolt |
| “The bolt can be removed with an Interact action …” (2 after a critical hit): in the note (delete it when removed) | Winter Bolt |

**Kept strict (tests):**
- Another explosion heightening isn't read.
- An extra rule on removal isn't read.
- Another explosion multiplier isn't read.
- Another explosion area isn't read.
- A forged multiplier or trigger kind is refused.

## Coverage

**Census:** **577 enabled**, up from 576.
- The b178 corpus diff against b177 changed only Winter Bolt (route → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 682/682 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-95-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch95`:
- **The critical hit:** `1d8 piercing` (5), and the target lost 5. The note lasted 1 round, ending at the end of the target's turn.
- **The explosion control:** it rolled `2 * 1d12 cold` (8). The target and the adjacent creature each lost 8, and the note ended.

**Runtime fixes:**
- The first attempts found an edit placed in the wrong function; it was moved.
- PF2e's damage application ignored a multiplier option; the doubling is now in the roll.

**Regressions:** `cr1Batch80` (Crushing Ground, the same triggered-damage control) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b178
node tools/diff-compiled-plans.mjs /tmp/phase23-b177/official-spell-compiler-report.json /tmp/phase23-b178/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b178/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch95`, then `cleanup`.
