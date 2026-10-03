# Cantrip / rank 1 batch 73 — Gift of the Anemos

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “When an enemy in the aura critically fails a Strike against you, they must succeed at a Reflex save or become Off-Guard until the end of your next turn.”: the stored-trigger route. A marker goes on the caster for the spell's minute, sustained; each trigger opens a Reflex save card for that enemy, and a failure is Off-Guard until the end of the caster's next turn | Gift of the Anemos (1) |
| “When you cast or sustain this spell, you can either Step, Shove … or jump 10 feet …”: a note on the marker | Gift of the Anemos |
| Sustained: a missed Sustain ends the spell | Gift of the Anemos |

**Kept strict (tests):**
- A save other than the item's isn't read.
- An added rule isn't read.
- An unsustained aura isn't read.

## Coverage

**Census:** **555 enabled**, up from 554.
- The b156 corpus diff against b155 changed only Gift of the Anemos. It's now on the stored-trigger route, which the census counts.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 638/638 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-73-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch73`:
- **Marker:** “Gift of the Anemos (waiting for its trigger)”, with the options note, on a sustained record.
- **Triggers:** the failing enemy became Off-Guard; the succeeding one didn't. The spell stayed active.
- **Sustain:** in combat, a missed Sustain ended it (`missed-sustain`).

**Regressions:** `longTailBatch3` (Animus Mine, Bandit's Doom and the other stored triggers) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b156
node tools/diff-compiled-plans.mjs /tmp/phase23-b155/official-spell-compiler-report.json /tmp/phase23-b156/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b156/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch73`, then `cleanup`.
