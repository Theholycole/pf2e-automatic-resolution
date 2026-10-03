# Cantrip / rank 1 batch 100 — Earth's Bile

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “When you Cast this Spell and the first time you Sustain it each round thereafter, choose an area within range.”: a sustained lingering area. Creatures in it save when it's cast and on each Sustain, after the GM moves it | Earth's Bile (1) |
| “Each creature in the area takes 1d4 fire damage, 1d4 bludgeoning damage, and (ceil(rank/2)) persistent fire damage (the persistent fire damage is negated on a successful save).”: both entries by the basic Reflex save; the persistent fire only on a failure (1) or critical failure (2) | Earth's Bile |

**Kept strict (tests):**
- A persistent damage halved rather than negated isn't read.
- Another persistent heightening isn't read.
- A missing damage entry isn't read.
- An added condition isn't read.

## Coverage

**Census:** **581 enabled**, up from 580.
- The b183 corpus diff against b182 changed only Earth's Bile.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 692/692 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-100-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch100`:
- **When cast:** the failing target lost 3 (the full roll) and got persistent `1` fire. The successful one lost 1 (half of 3) and got no persistent damage.
- **The caster's first combat turn (the spell was cast before initiative):** the GM moved the area onto a third creature and Sustained. That creature critically failed, lost 16 (double 8) and got persistent `(2 * 1)` fire.

The first attempt advanced past that turn without Sustaining, and the area correctly ended. The harness now Sustains on that turn.

**Regressions:** `cr1Batch99` and `cr1Batch88` (lingering areas) passed, with cleanup between runs. The runs left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b183
node tools/diff-compiled-plans.mjs /tmp/phase23-b182/official-spell-compiler-report.json /tmp/phase23-b183/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b183/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch100`, then `cleanup`.
