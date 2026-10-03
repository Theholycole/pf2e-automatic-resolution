# Rank 1 batch 3 — verification

2026-09-26. The third rank-order batch: rank-1 spells whose trigger is held on the cast's own target.

## Rules and spells

| Rule | Spell |
| --- | --- |
| A trigger held on the target, any number of times while sustained; “Name yourself or one of your allies.” as a note; `1 enemy` targets | Needle of Vengeance (1) |
| A trigger held on the target, once on its next turn, then temporarily immune for 1 minute; the locked action as a note | Forbidden Thought (cantrip) |

## Coverage

**Census:** **427 enabled**, up from 425 (Phase 2: 234; Phase 3: 52).

**The b68 corpus diff against b67 changed four plans:**
- the two spells above;
- Connective Current and Bound in Death, whose `target-eligibility` gap closed with the `1 enemy` target. Both stay blocked for other gaps.

No variant plan changed, and no plan lost a route. The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 464/464 tests pass. `test/rank-1-batch-3.test.js` covers:
- both held shapes and their exposure plans (the enemy predicate, the immunity);
- an extra rule sentence, which is refused;
- a sustained once-only trigger, which is refused.

[Live evidence](phase-rank-1-batch-3-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank1Batch3`, in combat:
- **Needle of Vengeance:**
  - The marker went on the enemy target, not the caster.
  - Two triggers opened two basic Will saves: a failure lost 2, a critical failure 4, total 6. The spell stayed active after each.
  - A Sustain on the caster's turn kept it active. The next missed Sustain ended it (`missed-sustain`) and removed the marker.
- **Forbidden Thought:**
  - The marker lasted to the end of the target's current-round turn (initiative 20, `turn-end`, value 0).
  - Triggered on that turn, it rolled `2d6 mental`: the failure lost 6.
  - The spell ended and the marker was removed. The target got “Forbidden Thought: Temporary immunity” for 1 minute.
- **Regressions:** `longTailBatch3`, `longTailBatch4` (the other stored triggers), `rank1Batch1` and `rank1Batch2` passed, with cleanup between them. Cleanup left no fixtures and no combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b68
node tools/diff-compiled-plans.mjs /tmp/phase23-b67/official-spell-compiler-report.json /tmp/phase23-b68/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b68/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank1Batch3`, then `cleanup`.
