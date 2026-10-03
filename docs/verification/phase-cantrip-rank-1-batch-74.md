# Cantrip / rank 1 batch 74 — Song of the Soul

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Choose one living or undead creature of your choice within 15 feet of the target thrall. That creature regains 1d8 Hit Points immediately and gains fast healing 1 …”: the Effect route with healing, on the creature the caster targets (not the thrall). PF2e's roll heals it, and PF2e's Effect gives fast healing at the cast rank | Song of the Soul (1) |
| The thrall's range and “This spell has the vitality trait if you heal a living creature or the void trait if you choose an undead creature.”: **Caster:** notes on the healing roll; either kind of creature can be healed | Song of the Soul |
| “… for as long as it's within 15 feet of the target thrall”: a **PF2e data** note, since the Effect lasts its full minute; remove it if the creature moves away | Song of the Soul |

**Kept strict (tests):**
- Another healing die isn't read.
- “Choose one creature” (without living or undead) isn't read.
- An added rule isn't read.

## Coverage

**Census:** **556 enabled**, up from 555.
- The b157 corpus diff against b156 changed only Song of the Soul.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 640/640 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-74-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch74`:
- **A wounded living creature:** healed 8 (the roll) and got the fast-healing Effect for 1 minute.
- **A wounded undead creature:** healed 3 (the roll), with the same Effect.
- **Notes:** the thrall note and the data note were posted.

**Regressions:** `directHealing` and `healingRiders` passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b157
node tools/diff-compiled-plans.mjs /tmp/phase23-b156/official-spell-compiler-report.json /tmp/phase23-b157/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b157/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch74`, then `cleanup`.
