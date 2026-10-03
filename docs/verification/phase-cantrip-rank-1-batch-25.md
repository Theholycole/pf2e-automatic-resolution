# Cantrip / rank 1 batch 25 — temporary Hit Points from the triggering creature

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Trigger “A living creature within 20 feet of you dies, or an undead creature within 20 feet of you is destroyed.” The GM targets that creature. “You gain temporary Hit Points equal to the triggering creature's level plus your spellcasting attribute modifier. If the triggering creature was undead, double …”: an Effect on the caster with PF2e's TempHP rule, for the spell's 1 minute. Deleting it removes the temporary Hit Points | Death's Call (1) |

**Kept strict (tests):**
- Another formula (“half your level”) isn't read.
- Neither is an extra rule after the rules (healing).

**Limit:** “the spell ends if all the temporary Hit Points are depleted earlier” isn't tracked. The Effect lasts its minute, and holds no temporary Hit Points once they're used.

## Coverage

**Census:** **507 enabled**, up from 506.
- The b108 corpus diff against b107 changed only Death's Call.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 561/561 tests pass (`test/cantrip-rank-1-batch-25.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-25-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch25`. The fixture caster's spellcasting modifier is +0.
- A level-3 living creature gave 3 temporary Hit Points.
- Deleting the Effect removed them.
- A level-3 undead gave 6.
- The Effect lasted 1 minute.

**Regressions:** `cr1Batch22` passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b108
python3 tools/build-phase-spell-batches.py /tmp/phase23-b108/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch25`, then `cleanup`.
