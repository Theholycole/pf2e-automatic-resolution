# Cantrip / rank 1 batch 42 — Veil of Dreams

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The target takes a -1 status penalty to Perception, attack rolls, and Will saves. This penalty increases to -2 for Will saves against sleep effects.”: PF2e's linked Effect states exactly this (a FlatModifier on attack, Perception and Will, and an AdjustModifier overriding Will to −2 against sleep). It's applied on success, failure and critical failure (“As success, …”) for the spell's sustained minute | Veil of Dreams (1) |
| “As success, and any time the target uses a concentrate action, it must succeed at a DC 5 flat check or the action is disrupted.”: a “Concentrate actions” note the GM plays | Veil of Dreams |

**Proof changes.**
- The stated-effect proof now takes two consecutive sentences.
- It dedupes a link listed in several rows.
- It accepts a sustained spell whose maximum equals PF2e's sustained Effect.

The b125 diff changed only Veil of Dreams. Blood Infusion, the other stated-effect spell, is unchanged.

**Kept strict (tests):** another penalty value, statistic or override value isn't stated, and the spell stays blocked.

## Coverage

**Census:** **524 enabled**, up from 523.
- The b125 corpus diff against b124 changed only Veil of Dreams.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 591/591 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-42-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch42`:
- **Critical success:** no Effect.
- **Success and failure:** PF2e's sustained Effect, with the AdjustModifier. Perception went 0→−1 and Will 10→9.
- **Failure:** also the “Concentrate actions” note.

**Regressions:** `longTailBatch4` (Blood Infusion's stated Effect) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b125
node tools/diff-compiled-plans.mjs /tmp/phase23-b124/official-spell-compiler-report.json /tmp/phase23-b125/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b125/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch42`, then `cleanup`.
