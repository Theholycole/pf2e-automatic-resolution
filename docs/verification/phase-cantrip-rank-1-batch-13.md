# Cantrip / rank 1 batch 13 — bare sustained durations, on-use links

2026-09-27. A small follow-up to batches 8 and 12. Both routes stay counted apart from enabled spells.

## Rules

| Rule | Example (live) |
| --- | --- |
| A bare `sustained` duration (no maximum) is PF2e's 10 minutes: a spell note lasting 10 minutes, marked sustained | Prestidigitation (cantrip): the caster's note, 10 minutes, sustained. Also Ghost Sound and Telekinetic Hand (cantrips) |
| Effect + note also takes one PF2e Effect applied on use (with nothing deferred or sequenced) | Uplifting Overture (cantrip): PF2e's Effect (3 rules) and the note on the targeted ally. Also Read the Air, Share Vision, Bit of Luck, Cutting Eye, Illusory Disguise, Practice Makes Perfect, Sweet Dream |
| Effect + note plans are **guided**, not automatic: PF2e's Effect isn't proven to carry the text (`effect-note:unproven-text`). Batch 12 had marked them automatic. Routing and execution go by the resolution kind, so they're unchanged | all 111 |

## Coverage

**Census:** **491 enabled**, unchanged.
- **Note only:** 304 non-ritual (310 in scope, 340 installed); cantrips 21, rank 1 77.
- **Effect + note:** 108 non-ritual (109 in scope, 111 installed); cantrips 14, rank 1 27.

**Compile checks:**
- The b96 corpus diff against b95 changed 121 plans: 10 new spell notes and 26 new Effect + note plans, all previously `unsupported`, plus the 85 Effect + note plans now marked guided.
- No plan became or stopped being executable.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 534/534 tests pass (`test/cantrip-rank-1-batch-13.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-13-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch13` (the two examples above).

**Regressions:** `cr1Batch12` (Effect + note, re-run with the guided level), `cr1Batch8` and `durationBuffs` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b96
node tools/diff-compiled-plans.mjs /tmp/phase23-b95/official-spell-compiler-report.json /tmp/phase23-b96/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b96/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch13`, then `cleanup`.
