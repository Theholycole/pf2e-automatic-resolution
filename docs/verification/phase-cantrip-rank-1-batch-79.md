# Cantrip / rank 1 batch 79 — Draconic Barrage

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Choose fire, force, mental, or spirit damage when you Cast the Spell. For the duration of the spell, your Strikes … deal 1 additional damage of the chosen type …”: PF2e's Effect on the caster, proved (the damage-type toggle offers exactly those types; Strike damage 1 per rank; this spell's damage retyped) | Draconic Barrage (1) |
| “You can Sustain the spell to change the damage type.”: a note (the Effect's toggle) | Draconic Barrage |
| “… you can Sustain the spell to have the dragons fly off to bombard a creature within 60 feet. That creature takes 2d4 damage of the chosen type (basic Reflex save). … the spell ends.”: the stored-trigger route with PF2e's Effect as the marker. Trigger opens the basic save card in the Effect's chosen type and ends the spell | Draconic Barrage |

**Kept strict (tests):**
- Another type list isn't read.
- Another Strike amount isn't read.
- Another die isn't read.
- An added rule isn't read.

## Coverage

**Census:** **561 enabled**, up from 560.
- The b162 corpus diff against b161 changed only Draconic Barrage, now on the stored-trigger route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 650/650 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-79-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch79`:
- **The marker:** “Spell Effect: Draconic Barrage” on the caster, toggled to mental.
- **The bombard:** the card's damage type was mental, it rolled `2d4 mental`, and the failing foe lost 2.
- **The end:** the spell ended and the Effect was removed.

**Regressions:** `longTailBatch3` (stored triggers) and `cr1Batch52` (the damage-type choice) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b162
node tools/diff-compiled-plans.mjs /tmp/phase23-b161/official-spell-compiler-report.json /tmp/phase23-b162/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b162/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch79`, then `cleanup`.
