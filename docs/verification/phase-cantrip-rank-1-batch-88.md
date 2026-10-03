# Cantrip / rank 1 batch 88 — Swampcall

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The area becomes difficult terrain.” / “Creatures in the area when you Cast this Spell must attempt a Reflex saving throw.”: a lingering area with PF2e's difficult terrain on its region for 1 minute, and a save only for the creatures inside when cast | Swampcall (1) |
| Failure / critical failure (−10 / −15 feet to Speeds except swim, and Off-Guard): PF2e's Effect preset to the row (its ChoiceSet, Speed modifier and granted Off-Guard proved against the rows) | Swampcall |
| “These effects last until the creature leaves the area or until the end of its next turn, whichever comes first.”: the area removes the Effect when the creature is outside at a turn change. Otherwise PF2e's one-round duration applies (a data note says so) | Swampcall |
| “Heightened (3rd) … the area increases to a 20-foot burst.”: the area is placed from PF2e's variant at the cast rank | Swampcall |

**Kept strict (tests):**
- Other penalty values aren't read.
- A missing swim exception isn't read.
- Another critical value isn't read.
- Without the terrain sentence it isn't a lingering area.
- A narration with damage isn't read.
- An Effect with an extra rule, or rows without a matching lifetime, is refused.
- The lingering test now uses Swampcall without its terrain as the cast-only example.

## Coverage

**Census:** **570 enabled**, up from 569.
- The b171 corpus diff against b170 changed only Swampcall.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 668/668 tests pass (`test/cantrip-rank-1-batch-59.test.js`, `test/lingering-area.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-88-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch88`:
- **Region:** it carried `modifyMovementCost` walk 2.
- **Saves:** land Speeds were 25 (success), 15 (failure) and 10 (critical failure). The failing creatures were Off-Guard, and their Effects (“Spell Effect: Swampcall (Failure)” / “(Critical Failure)”) carried the area's `leaveArea` flag.
- **Leaving the area:** the failing creature moved out; at the next turn its Effect was removed, and the critically failing creature's stayed.
- **3rd rank:** PF2e's variant reports a 20-foot burst.

**Harness issues, fixed:**
- The first attempt left a combat behind; the case now deletes its own combat, and the leftover was deleted.
- An earlier assertion expected the Effect's plain name.
- With the caster acting first, PF2e's one-round duration ran out before the leave check.

**Regressions:** `cr1Batch84` passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b171
node tools/diff-compiled-plans.mjs /tmp/phase23-b170/official-spell-compiler-report.json /tmp/phase23-b171/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b171/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch88`, then `cleanup`.
