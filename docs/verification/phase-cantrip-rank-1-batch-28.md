# Cantrip / rank 1 batch 28 — retaliation with an aura Effect

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| An emanation around the caster whose linked PF2e Effect is only an Aura: PF2e's Effect is the marker. “Each time a creature within the emanation takes fire damage, it catches on fire, taking (ceil(level/2)+1)d4 persistent fire damage.” is a **Retaliate** control in Ongoing spells | Incendiary Aura (1) |

**Kept strict (tests):**
- Without PF2e's Effect, the spell isn't read.
- Neither is an extra rule (a condition).

## Coverage

**Census:** **510 enabled**, up from 509.
- The b111 corpus diff against b110 changed only Incendiary Aura.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 567/567 tests pass (`test/cantrip-rank-1-batch-28.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-28-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch28`:
- The caster had PF2e's “Spell Effect: Incendiary Aura” (its Aura rule).
- Retaliating against a foe gave it 2d4 persistent fire.

**Regressions:** `cr1Batch24` passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b111
python3 tools/build-phase-spell-batches.py /tmp/phase23-b111/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch28`, then `cleanup`.
