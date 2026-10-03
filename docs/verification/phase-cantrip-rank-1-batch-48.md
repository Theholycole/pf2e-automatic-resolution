# Cantrip / rank 1 batch 48 — Ignite Ambition

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Success: “The target takes a -1 status penalty to its defenses against the triggering effect. This penalty is -2 if the target is being encouraged to advance its own ambitions. The target doesn't realize you Cast the Spell on it.”: a 1-round note (the penalty applies only against the triggering effect, and its size depends on what's asked) | Ignite Ambition (1) |
| Failure “As success, but the penalty is -4 if …”; critical failure “As success, but the creature automatically follows a suggestion that advances its own ambitions.”: the same note with the row's addition | Ignite Ambition |
| Critical success: “The target is unaffected and realized you attempted to influence its reaction with magic.”: unaffected | Ignite Ambition |
| Target “one creature being influenced”: the creature the trigger names | Ignite Ambition |

**Kept strict (tests):** a penalty not limited to the triggering effect stays unaccounted.

## Coverage

**Census:** **530 enabled**, up from 529.
- The b131 corpus diff against b130 changed only Ignite Ambition.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 598/598 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-48-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch48`:
- **Critical success:** nothing.
- **Success, failure and critical failure:** each got its 1-round note. The failure's has the −4 case, and the critical failure's the automatic suggestion.

**Regressions:** `cr1Batch6` (note Effects) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b131
node tools/diff-compiled-plans.mjs /tmp/phase23-b130/official-spell-compiler-report.json /tmp/phase23-b131/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b131/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch48`, then `cleanup`.
