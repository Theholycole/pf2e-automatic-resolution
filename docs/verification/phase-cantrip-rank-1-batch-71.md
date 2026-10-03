# Cantrip / rank 1 batch 71 — Déjà Vu

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “The target must attempt a Will save. If the target fails, whatever actions the target uses on its next turn, it must repeat on its following turn. …” (no table): a success or better is unaffected; a failure or worse gets the “Spell's effect” note for the spell's 2 rounds | Déjà Vu (1) |
| “If the target can't repeat an action, …, it can act as it chooses for that action but becomes Stupefied 1 until the end of its turn.”: kept in the note; the GM applies the condition when it happens | Déjà Vu |

**Fix:** a linked condition in such an effect is now checked on the sentence itself. Before, links became their labels first, so a linked condition wasn't caught and would have become a note instead of blocking. The b154 diff shows no other plan changed.

**Kept strict (tests):**
- An unconditional “it becomes Stupefied 1 …” isn't read.
- Damage in the effect isn't read.

## Coverage

**Census:** **553 enabled**, up from 552.
- The b154 corpus diff against b153 changed only Déjà Vu.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 634/634 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-71-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch71`:
- **Success:** no note.
- **Failure and critical failure:** “Déjà Vu: Spell's effect” for 2 rounds, with the Stupefied sentence in its text, and no condition applied.

The live run used the code before the stricter condition check. Déjà Vu's compiled plan is the same with both.

**Regressions:** `cr1Batch70` (Personal Rain Cloud, the same note path) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b154
node tools/diff-compiled-plans.mjs /tmp/phase23-b153/official-spell-compiler-report.json /tmp/phase23-b154/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b154/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch71`, then `cleanup`.
