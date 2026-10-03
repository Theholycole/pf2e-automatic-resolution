# Cantrip / rank 1 batch 82 — Rainbow's End

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Each creature in the area takes 1d4 spirit damage with a basic Fortitude save.” with the rider “Any creature that fails this save is additionally Dazzled for 1 round.”: PF2e's damage by row, and Dazzled for 1 round on a failure or critical failure. The verb now accepts “additionally”, which changed no other plan | Rainbow's End (1) |
| “Heightened (+2) … the duration of the dazzled condition on a failed save increases by 1 round …”: Dazzled for 2 rounds at 3rd rank, 3 at 5th, and so on | Rainbow's End |
| “For the spell's duration, an ally who's adjacent to you can Interact and be instantly teleported … as long as they don't travel more than 60 feet. This effect has the teleportation trait.”: a note Effect on the caster for the spell's maximum (1 minute), marked as sustained, with the Heightened text at the cast rank (the extra 10 feet) | Rainbow's End |

**Kept strict (tests):**
- A bonus or damage in the note sentence isn't read.
- An added condition sentence isn't read.
- The same spell without Sustain isn't read.
- A tampered note is refused.

## Coverage

**Census:** **564 enabled**, up from 563.
- The b165 corpus diff against b164 changed only Rainbow's End (route false → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 656/656 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-82-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch82`:
- **Rank 1:** `1d4 spirit` rolled 4. The targets lost 2, 4 and 8, and the failed and critically failed targets were Dazzled for 1 round.
- **Caster note:** one “Spell Note: Rainbow's End” Effect for 1 minute, marked as sustained, with the teleport text. The card said “applied (while Sustained, up to 1 minutes)”.
- **Rank 3:** `3d4 spirit`, Dazzled for 2 rounds, and the note carried “Heightened (+2) ×1 … increases by 10 feet”.

**Regressions:** `cr1Batch80` (Crushing Ground) and `cr1Batch71` passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b165
node tools/diff-compiled-plans.mjs /tmp/phase23-b164/official-spell-compiler-report.json /tmp/phase23-b165/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b165/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch82`, then `cleanup`.
