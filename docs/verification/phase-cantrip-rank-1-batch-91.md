# Cantrip / rank 1 batch 91 — Vengeful Glare

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The gaze deals 1d4 damage (basic Fortitude save). It deals your choice of cold damage or fire damage …” (PF2e's item has no damage entry): the text's damage, of the type the caster picks, heightened by 1d4 a rank | Vengeful Glare (1) |
| “If you already dealt damage to the creature earlier this turn, it also takes 1 persistent damage of the gaze's type …”: the caster answers on the card. A yes adds the rank's persistent damage of the chosen type, which the save scales with the rest | Vengeful Glare |
| Target “one creature you can see”: the creature the caster targets | Vengeful Glare |

**Kept strict (tests):**
- Another persistent amount isn't read.
- Another heightened step isn't read.
- A persistent type that isn't one of the two offered isn't read.
- An added condition isn't read.
- A forged rider formula is refused.

## Coverage

**Census:** **572 enabled**, up from 571.
- The b174 corpus diff against b173 changed only Vengeful Glare (route → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 674/674 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-91-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch91`:
- **Before the answers:** Finalize was refused both times.
- **Fire, “yes”:** `1d4 fire + 1 persistent fire`. The failing target lost 3 and got persistent `1` fire.
- **Cold, “no”:** `1d4 cold` (1). The failing target lost 1 and got no persistent damage.

**Regressions:** `cr1Batch86` (the cast gate) and `cr1Batch90` (the Dismiss payoff) passed in a follow-up run, with cleanup between runs. The runs left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b174
node tools/diff-compiled-plans.mjs /tmp/phase23-b173/official-spell-compiler-report.json /tmp/phase23-b174/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b174/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch91`, then `cleanup`.
