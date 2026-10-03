# Cantrip / rank 1 batch 46 — Eject Soul

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Failure: “The target is Stunned 1 as its soul briefly loses its connection to their body.”: Stunned 1 (existing) | Eject Soul (1) |
| Critical failure: “The target's soul exits its body and the target's body becomes stunned for 1 round. …”: the body is stunned for 1 round. A “Soul form” note for that round covers the soul's awareness, incorporeal trait, Invisible (the soul's, never applied to the body), 60-foot fly Speed, limits and return, plus the heightened willing-ally rule | Eject Soul |
| Target “1 living creature that has a soul”: living (PF2e traits), plus a GM question | Eject Soul |
| “You can allow allies to choose the degree of success instead of rolling a saving throw.”: the willing-choice reminder | Eject Soul |

**Correctness note:** the linked Invisible read as a condition on the target, which would make the stunned body invisible. The spell was blocked, so it was never applied.

Incapacitation is PF2e's: the module rolls saves with the spell item.

**Kept strict (tests):** another condition on the body isn't read.

## Coverage

**Census:** **528 enabled**, up from 527.
- The b129 corpus diff against b128 changed only Eject Soul.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 596/596 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-46-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch46`:
- **Questions:** each target got the GM soul question.
- **Failure:** Stunned 1, and no Invisible.
- **Critical failure:** stunned for 1 round, the 1-round “Soul form” note, and no Invisible.
- **Card:** it showed the allies-choose reminder.

The first attempt's check counted the module's condition Effects as notes; it was corrected and re-run.

**Regressions:** `cr1Batch37` (Shroud of Night's perceived condition) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b129
node tools/diff-compiled-plans.mjs /tmp/phase23-b128/official-spell-compiler-report.json /tmp/phase23-b129/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b129/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch46`, then `cleanup`.
