# Cantrip / rank 1 batch 86 — Signal Skyrocket

2026-09-27. Continuing spell by spell. Signal Skyrocket was kept blocked in batch 18 because its damage applies only in a situation the plan couldn't gate. That gate now exists.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “If the rocket explodes in an enclosed space smaller than the full size of the burst, each creature in the area takes 1d10 sonic damage depending on the result of its Reflex save.”: the card asks the GM “Does this hold: …?”. Finalize waits for the answer; “no” leaves every creature unaffected, and “yes” applies the rows | Signal Skyrocket (1) |
| Rows: half / full and Dazzled 1 round / double and Blinded 1 round (as before) | Signal Skyrocket |
| “You can't change the direction or distance of the rocket …”: a GM placement note on the card. The visibility sentence and narration carry no rule | Signal Skyrocket |

**Kept strict (tests):**
- Other damage in the gated sentence isn't read.
- A placement sentence naming creatures or damage isn't read.
- A tampered or missing gate is refused (the placement note needs the gate).

## Coverage

**Census:** **568 enabled**, up from 567.
- The b169 corpus diff against b168 changed only Signal Skyrocket (route false → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 664/664 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-86-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch86`:
- **Before an answer:** Finalize was refused both times.
- **“Yes”:** `1d10 sonic` rolled 5. The targets lost 2, 5 and 10, and got none, Dazzled and Blinded. The card showed the placement note.
- **“No”:** the failing target lost 0 and got no condition.

**Regressions:** `cr1Batch85` passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b169
node tools/diff-compiled-plans.mjs /tmp/phase23-b168/official-spell-compiler-report.json /tmp/phase23-b169/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b169/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch86`, then `cleanup`.
