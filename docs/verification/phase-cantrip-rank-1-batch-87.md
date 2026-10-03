# Cantrip / rank 1 batch 87 — Zenith Star

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Rows: unaffected / Dazzled 1 round / Dazzled 1 round / As failure but Blinded 1 round (PF2e's Blinded overrides Dazzled) | Zenith Star (1) |
| “While the spell persists, … you can sense the approximate direction and distance to the creature by Sustaining the spell.” with “This is enough to track the creature, but not pinpoint their exact square …” and “You can set a number of zenith stars equal to your Wisdom modifier; if you exceed this number, your oldest zenith star is automatically Dismissed.”: one note Effect on failing targets for the spell's duration, which the critical failure inherits | Zenith Star |
| “Heightened (+1) The duration increases by 1 day.”: the note lasts 1 day plus 1 per rank | Zenith Star |
| “Heightened (4th) You ignore the Concealed condition …”: the existing rank gate refuses ranks 4 and above | Zenith Star |

**Kept strict (tests):**
- A continuation with damage isn't read.
- A limit sentence granting a condition isn't read.
- A condition inserted before the continuation isn't read.
- An interval duration needs the base rank and a fixed duration in the same unit.

**Side effect:** Heart's Desire and Trickster's Twin lost some manual flags, because their inherited notes now carry the inherited instructions. Both stay blocked.

## Coverage

**Census:** **569 enabled**, up from 568.
- The b170 corpus diff against b169 made only Zenith Star executable. The two plans above changed only their pending list.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 666/666 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-87-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch87`:
- **Rank 1 conditions:** Dazzled on the successful and failing targets, and Blinded on the critically failing one.
- **Rank 1 notes:** the tracking note lasted 1 day on the failing and critically failing targets.
- **Rank 3:** a failing target got Dazzled and a note lasting 3 days.

A first attempt right after a page reload failed on an unready canvas and passed on rerun.

**Regressions:** `cr1Batch19` passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b170
node tools/diff-compiled-plans.mjs /tmp/phase23-b169/official-spell-compiler-report.json /tmp/phase23-b170/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b170/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch87`, then `cleanup`.
