# Cantrip / rank 1 batch 56 — Dirge of Doom

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Enemies within the area are Frightened 1.” (a 30-foot emanation, no check): the enemies the caster targets in it get PF2e's Frightened 1 for the composition's round. The card refuses the caster or an ally | Dirge of Doom (cantrip) |
| “They can't reduce their frightened value below 1 while they remain in the area.”: the grant restricts removal, so Frightened can't drop below 1 while the spell lasts. The Effect tells the GM to delete it if the creature leaves the area | Dirge of Doom |

**Kept strict (tests):** a floor at another value, or no floor sentence, isn't read.

## Coverage

**Census:** **538 enabled**, up from 537.
- The b139 corpus diff against b138 changed only Dirge of Doom.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 606/606 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-56-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch56`, in combat:
- **Enemy and ally targeted together:** refused (“target only the enemies in the area”).
- **Enemy alone:** Frightened 1, with the 1-round Effect.
- **Floor:** PF2e's decrease (as at the end of its turn) left it at 1.
- **After the round:** the Effect was gone.

The first attempt checked the floor after the round had already ended (the spell was over); the case now checks while it lasts.

**Regressions:** `cr1Batch21` (Genie's Veil condition note) passed in the same session. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b139
node tools/diff-compiled-plans.mjs /tmp/phase23-b138/official-spell-compiler-report.json /tmp/phase23-b139/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b139/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch56`, then `cleanup`.
