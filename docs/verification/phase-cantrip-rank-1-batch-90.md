# Cantrip / rank 1 batch 90 — Scrounger's Glee

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The target becomes Frightened 1 if it fails a Will save (or Frightened 2 on a critical failure).”: the compact table (unaffected on a success) | Scrounger's Glee (cantrip) |
| “This condition can't be reduced below 1 while the spell is active and the target can hear you.”: a Frightened floor at 1 for as long as the sustained spell lasts. Whether it can hear is the GM's (the floor Effect says to delete it while it can't) | Scrounger's Glee |
| “You can Dismiss the spell as a reaction when an ally critically succeeds at a Strike against the target, restoring (ceil(rank/2))d4 Hit Points to that ally.” with “Heightened (+2) … increases by 1d4”: an ongoing control that heals the targeted ally at the cast rank and ends the spell | Scrounger's Glee |

**Kept strict (tests):**
- Another floor qualifier isn't read.
- A Heightened entry out of step isn't read.
- An added condition after the payoff isn't read.
- Dealing instead of restoring isn't read.
- A forged payoff or floor qualifier is refused.

## Coverage

**Census:** **571 enabled**, up from 570.
- The b173 corpus diff against b172 changed only Scrounger's Glee (route → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 672/672 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-90-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch90`:
- **The floor:** the failing target was Frightened 1 with “Scrounger's Glee: frightened floor” (which names the hearing condition). Decreasing Frightened left it at 1.
- **The Dismiss:** the “reaction” Dismiss rolled `1d4` (2) and restored 2 HP to the targeted ally. The cast ended, and the floor went with it.

The first run's check expected the resolved dice; the runtime now resolves them (“1d4”, not “(ceil(1 / 2))d4”).

**Regressions:** `cr1Batch82` passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b173
node tools/diff-compiled-plans.mjs /tmp/phase23-b172/official-spell-compiler-report.json /tmp/phase23-b173/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b173/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch90`, then `cleanup`.
