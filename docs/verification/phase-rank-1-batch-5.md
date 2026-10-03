# Rank 1 batch 5 — verification

2026-09-26. The fifth rank-1 batch.

## Rules and spells

| Rule | Spell |
| --- | --- |
| An Effect after the table whose rule a row states (“loses any immunity to bleed”), inherited by “As success” rows and applied before the damage; the thrall form “A creature within 15 feet of the target thrall …”; display-only inline options | Blood Infusion (1) |
| A condition chosen by one d4 for the cast (a 4 is the caster's choice); a critical row restating the value and duration | Temporal Distortion (1) |

### Looked at and left

- **Sleep:** PF2e's Unconscious grants Prone with `restrict`, so the granted Prone can't be removed while Unconscious lasts. Sleep's “doesn't fall Prone” can't be honoured with the real condition.
- **Soul Siphon:** its temporary Hit Points state no duration.
- **Forge:** its critical-failure Effect isn't in the catalog.
- **Curse of Recoil:** “the same weapon, spell, or ability” is wider than its Effect.
- **Signal Skyrocket and Deathly Scream:** their conditional or audience sentences are rules.
- **Faerie Dust and Command:** they restrict actions, which the module doesn't model.

## Coverage

**Census:** **431 enabled**, up from 429 (Phase 2: 237).
- The b70 corpus diff against b69 changed exactly these two plans. No variant plan changed and no plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 469/469 tests pass. `test/rank-1-batch-5.test.js` covers:
- Blood Infusion's thrall, rows and dropped display option, plus an immunity claim that doesn't match;
- Temporal Distortion's roll map, critical-row values, the rolled condition only, and nothing before a choice.

[Live evidence](phase-rank-1-batch-5-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank1Batch5`:
- **Blood Infusion:**
  - A failure got “Spell Effect: Blood Infusion” and persistent bleed `1d6`.
  - A construct that was immune to bleed critically failed: it lost bleed immunity and took persistent bleed `2d6`.
  - The thrall reminder showed.
- **Temporal Distortion:**
  - Rolled 3: a success got Stupefied 1 for 1 round, and a critical failure Stupefied 3 for 2 rounds; no other condition.
  - Rolled 4: finalizing was refused until the caster chose. Choosing Enfeebled gave the failure Enfeebled 1 for 4 rounds.
- **Regressions:** `thrallSpells`, `longTailBatch4`, `rank1Batch4`, `rank1Batch2`, `compact` and `persistentOnce` passed, with cleanup between them. Cleanup left no fixtures and no combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b70
node tools/diff-compiled-plans.mjs /tmp/phase23-b69/official-spell-compiler-report.json /tmp/phase23-b70/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b70/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank1Batch5`, then `cleanup`.
