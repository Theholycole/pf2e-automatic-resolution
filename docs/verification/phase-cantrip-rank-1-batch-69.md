# Cantrip / rank 1 batch 69 — Victory Cry

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Trigger An ally within range critically succeeds at a melee Strike.” / “The weapon used to make the Strike deals an additional 1d6 sonic damage (not doubled due to the critical hit), …”: the no-check damage route, on the creature struck (the caster targets it). The damage is rolled on its own, not doubled | Victory Cry (1) |
| The item has no damage entry: the text's 1d6 sonic, heightened by “Heightened (+2) The sonic damage increases by 1d6.” at the cast rank, with a **PF2e data** note | Victory Cry |
| “… the ally can immediately attempt to Shove the creature struck, …” and the Athletics bonus sentence: **GM:** notes on the roll | Victory Cry |

**Kept strict (tests):**
- “doubled” isn't read.
- A non-critical trigger isn't read.
- A heightened die that isn't the text's isn't read.
- A different bonus isn't read.

**Side change:** the Target “the triggering ally” also clears Champion's Sacrifice's target-eligibility gap. It stays a spell note.

## Coverage

**Census:** **551 enabled**, up from 550.
- The b152 corpus diff against b151 made only Victory Cry executable.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 630/630 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-69-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch69`:
- **Rank 1:** `1d6 sonic` rolled 1; the targeted foe lost 1.
- **Rank 3** (a 5th-level caster, since a focus spell heightens with the caster): `2d6 sonic` rolled 9; the foe lost 9.
- **Notes:** the struck-creature, Shove and data notes were on the roll.

The first run cast rank 3 with the 1st-level fixture caster and rolled 1d6. That was correct for a focus spell, so the case was changed and re-run.

**Regressions:** `rank1Batch10` (Force Bolt) and `cr1Batch31` (Force Fang), the existing direct-damage route, passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b152
node tools/diff-compiled-plans.mjs /tmp/phase23-b151/official-spell-compiler-report.json /tmp/phase23-b152/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b152/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch69`, then `cleanup`.
