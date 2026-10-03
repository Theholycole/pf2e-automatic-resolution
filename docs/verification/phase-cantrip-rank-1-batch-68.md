# Cantrip / rank 1 batch 68 — Lament

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “… deals 1d8 mental damage (basic Will save) to each creature in the area.”: the basic save on the item's damage; the caster targets the creatures in the item's 30-foot cone | Lament (1) |
| “If you have any harmful conditions imposed by emotion effects, lament deals additional mental damage equal to the counteract rank of the highest-level effect.”: before damage, the card asks the caster for that rank (0–10, 0 if none) and adds it to the roll | Lament |

**Kept strict (tests):**
- Another damage type than the entry's isn't read.
- Another measure than the counteract rank isn't read.

## Coverage

**Census:** **550 enabled**, up from 549.
- The b151 corpus diff against b150 changed only Lament.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 628/628 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-68-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch68`:
- **Before the answer:** Finalize was refused with the caster's question.
- **The roll:** after answering 2, the damage was `1d8 + 2 mental` (6). The failing foe lost 6 and the critically failing foe 12.
- **Card:** it recorded “(0 if none) 2 (+2 mental damage)”.

**Earlier run:** a first run also passed (a total of 8), but its evidence upload failed because the Foundry session had dropped. The first pipeline run therefore missed this batch's progress entry, and its speed check failed on the unrecorded spell. After rejoining as Gamemaster, the case was re-run and uploaded, and the pipeline was run again in order.

**Regressions:** `rank1Batch2` (the dice-upgrade question) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b151
node tools/diff-compiled-plans.mjs /tmp/phase23-b150/official-spell-compiler-report.json /tmp/phase23-b151/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b151/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch68`, then `cleanup`.
