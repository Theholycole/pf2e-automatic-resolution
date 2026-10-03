# Cantrip / rank 1 batch 34 — Overstuff

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| PF2e's Effect chooses `{badge, degree}` by the save result (a flag ChoiceSet), grants Sickened at that badge, and has a −10-foot status land Speed penalty only while Sickened. The module applies it with each row's choice preset, and the row's Sickened is carried by it, not applied twice | Overstuff (1) |
| “A target sickened by this spell takes a –10-foot status penalty to its Speed until it's no longer sickened.”: the Effect's predicated FlatModifier | Overstuff |
| Success: “The target is Sickened 1, but if it spends an action to end the condition, it succeeds automatically.”: PF2e's own addendum on the Sickened for the success choice | Overstuff |

When the Sickened ends, PF2e's cascade removes the Effect, so nothing is left behind.

**Kept strict (tests):**
- A different Speed value in the text blocks.
- So does a row condition value that isn't the badge, or the success extra on another row.
- An unknown extra rule, or a choice value with another key, isn't read.
- At play time the live template is proved again.

## Coverage

**Census:** **516 enabled**, up from 515.
- The b117 corpus diff against b116 changed only Overstuff.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 579/579 tests pass (`test/cantrip-rank-1-batch-34.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-34-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch34`:
- **Rows:** success, failure and critical failure each got PF2e's Effect, preset to `{1, success}`, `{1, failure}` and `{2, critical-failure}`, with Sickened 1, 1 and 2 (one each).
- **Speed:** land Speed went from 25 to 15.
- **Addendum:** only the success's Sickened shows it.
- **Recovery:** removing the failure target's Sickened restored Speed 25 and removed the Effect.

The first two runs failed on the harness's own reads (PF2e renames the Effect with the degree, the Speed path, and the addendum only appearing in the rendered description). Those were corrected and the case re-run.

**Regressions:** `degreeChoiceAndRift` (Distracting Decoy, Ill Omen) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b117
node tools/diff-compiled-plans.mjs /tmp/phase23-b116/official-spell-compiler-report.json /tmp/phase23-b117/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b117/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch34`, then `cleanup`.
