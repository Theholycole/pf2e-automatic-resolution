# Cantrip / rank 1 batch 70 — Personal Rain Cloud

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Creatures can attempt a Reflex save to avoid the cloud.” (no table): a success or better is unaffected; a failure or worse gets the spell's effect for its 1 minute. A **GM:** reminder says the save is optional (a willing creature's result is set to a failure) | Personal Rain Cloud (1) |
| “The target gains fire resistance 2.” with “Heightened (+1) The amount of fire resistance increases by 2.”: a `Resistance` rule on the “Spell's effect” note, at the cast rank; the Heightened line is added to the note's text | Personal Rain Cloud |
| The cloud's narration, “The rain extinguishes non-magical flames.” and “Creatures with weakness to water take damage equal to their weakness at the end of each of their turns.”: in the note, for the GM | Personal Rain Cloud |

**Kept strict (tests):**
- A Heightened entry for another resistance type isn't read.
- An added bonus in the resistance sentence isn't read.
- Damage the spell itself deals (“take 1d6 damage”) isn't read.
- A spell note still can't carry a `Resistance` rule.

## Coverage

**Census:** **552 enabled**, up from 551.
- The b153 corpus diff against b152 changed only Personal Rain Cloud.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 632/632 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-70-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch70`:
- **Success:** no note, no fire resistance.
- **Failure at rank 1:** “Personal Rain Cloud: Spell's effect” for 1 minute, with fire resistance 2.
- **Failure at rank 3:** fire resistance 6.
- **Card:** the optional-save reminder was shown.

**Regressions:** `cr1Batch16` (Forced Quiet and Clouded Focus, the “Spell's effect” notes) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b153
node tools/diff-compiled-plans.mjs /tmp/phase23-b152/official-spell-compiler-report.json /tmp/phase23-b153/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b153/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch70`, then `cleanup`.
