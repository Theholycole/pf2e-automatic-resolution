# Cantrip / rank 1 batch 36 — Wilding Word

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “When the target attempts an attack roll or skill check that would harm you, it takes a -2 status penalty to its roll.”: a “Penalty against the caster” note for the spell's duration. Which rolls would harm the caster is the table's call | Wilding Word (cantrip) |
| “As success, but the target also becomes Sickened 1 each time it damages you.” / “As failure, but the sickened value is 2.”: a “Sickened when it damages you” note (1 or 2) as well as the penalty note. The cast applies no Sickened | Wilding Word |
| “…; if the creature is an animal, fungus, or plant, it takes a –1 circumstance penalty to its save.”: the existing GM save question | Wilding Word |

It's sustained (up to 1 minute), so the notes join the sustained cast and a missed Sustain ends them.

**Correctness note:** before this batch the rows' Sickened would have been read as applied on the cast. The spell was blocked, so nothing wrong was ever applied; now the Sickened is only a note.

**Test update:** `cantrip-rank-1-batch-6` used Wilding Word as a “stays blocked” example. It now checks a changed trigger (“each time it hits an ally”), which still blocks.

**Kept strict (tests):**
- A critical failure raising another condition isn't read.
- A penalty against rolls that don't harm the caster isn't this rule.

## Coverage

**Census:** **518 enabled**, up from 517.
- The b119 corpus diff against b118 changed only Wilding Word.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 583/583 tests pass (`test/cantrip-rank-1-batch-35.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-36-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch36`, in combat:
- **Save question:** each target got the GM's animal/fungus/plant question.
- **Notes:**
  - **Success:** the penalty note (1 minute).
  - **Failure and critical failure:** the penalty note, plus a Sickened note (Sickened 1 and 2).
- **No Sickened:** no Sickened was applied.
- **Missed Sustain:** after rounds without Sustaining, all notes were gone.

**Regressions:** `cr1Batch6` (Heart's Hook notes) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b119
node tools/diff-compiled-plans.mjs /tmp/phase23-b118/official-spell-compiler-report.json /tmp/phase23-b119/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b119/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch36`, then `cleanup`.
