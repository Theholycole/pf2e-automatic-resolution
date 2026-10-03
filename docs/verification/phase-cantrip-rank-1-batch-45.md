# Cantrip / rank 1 batch 45 — Airburst

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Target “all creatures and unattended objects”, with “Large or smaller creatures must attempt a Fortitude save.”: only creatures of PF2e size Large or smaller are eligible | Airburst (1) |
| “Unattended objects of 1 Bulk or less are pushed 5 feet away from you.”: a **GM:** reminder, noting 10 feet from 4th rank | Airburst |
| Success: “The creature takes a -2 status penalty to checks made during its reactions until the end of your turn.”: the existing reactions note | Airburst |
| Failure: “As success, and the creature is pushed 5 feet away from you.”: the push, plus the success's note | Airburst |
| Critical failure: “The creature is pushed 5 feet away from you and can't use reactions until the end of your turn.”: the push, plus a no-reactions note to the end of your turn | Airburst |
| “Heightened (4th) Increase the area to a 10-foot emanation and increase the distance objects and creatures are pushed to 10 feet.”: pushes of 10 feet from 4th rank. The GM places the larger emanation | Airburst |

The objects sentence used to pass with no signal. It's now claimed by the reminder.

**Kept strict (tests):** another heightening wording, or a size limit that isn't a size, isn't read.

## Coverage

**Census:** **527 enabled**, up from 526.
- The b128 corpus diff against b127 changed only Airburst.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 595/595 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-45-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch45`:
- **Eligibility:** the Huge creature was ineligible.
- **Notes:** success, failure and critical failure each got their Reactions note, lasting 1 round to a turn's end.
- **Card:** it asked for 5-foot pushes and showed the objects reminder with its 10-feet-at-4th note.
- **Rank 4:** the target's push was 10 feet.

**Regressions:** `forcedMovement` passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b128
node tools/diff-compiled-plans.mjs /tmp/phase23-b127/official-spell-compiler-report.json /tmp/phase23-b128/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b128/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch45`, then `cleanup`.
