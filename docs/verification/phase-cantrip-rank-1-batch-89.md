# Cantrip / rank 1 batch 89 — Putrefy Food and Drink

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Target “1 cubic foot of clean food or water”: a thing, not a creature. The spell is a note (instantaneous: the card carries its rules) | Putrefy Food and Drink (1) |
| “Heightened (2nd/3rd) You can target an alchemical elixir (a potion) …, attempting a counteract check against it.”: a rank gate. The note serves 1st rank, and 2nd rank and above are refused | Putrefy Food and Drink |

The same target rule cleared the `target-eligibility` gap on Cleanse Cuisine, Scrying Ripples, Shape Wood and Waters of Prediction (a ritual). All four were already note spells.

**Kept strict (tests):**
- A counteract check in the base text isn't read as a note.
- A counteract check in a (+N) entry isn't read as a note.
- A target naming a creature isn't a thing.

## Coverage

**Census:** **570 enabled**, unchanged. **Note only:** 368 non-ritual; Putrefy Food and Drink joins, and note spells are counted apart.
- The b172 corpus diff against b171 moved Putrefy to the note route. Ten other plans changed only their pending list: the four above lost `target-eligibility`, and Consecrate is a ritual still blocked by its Area paragraph.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 670/670 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-89-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch89`:
- **1st rank:** the note card carried the spell's text (without the counteract entries), and no Effect was made.
- **2nd rank:** refused with “at rank 2 and above its heightened rules aren't automated”.

**Regressions:** `cr1Batch14` (note spells) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b172
node tools/diff-compiled-plans.mjs /tmp/phase23-b171/official-spell-compiler-report.json /tmp/phase23-b172/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b172/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch89`, then `cleanup`.
