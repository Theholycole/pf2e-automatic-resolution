# Rank 1 batch 6 — verification

2026-09-26. The sixth rank-1 batch: two Effect-route spells, one of them the widely used Protection.

## Rules and spells

| Rule | Spell |
| --- | --- |
| A heightened caster option: from 3rd rank, the Effect may also go to the caster's allies within 10 feet of the target | Protection (1) |
| The Effect's own rules state the text: extra 1d4 vitality on Strikes (rank dice via PF2e's `ternary/gte`) and the holy trait for the Strikes | Infuse Vitality (1) |

`test/compiler.test.js` used to assert that Protection's heightened emanation leaves its Effect unscoped. It now asserts the carried option instead; that was the intended change.

The heavier rank-1 spells stay for later: Circle of Weakness, Jealous Hex, Earth's Bile and Astral Rain.

## Coverage

**Census:** **433 enabled**, up from 431.
- The b71 corpus diff against b70 changed exactly Protection and Infuse Vitality. No variant plan changed and no plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 471/471 tests pass. `test/rank-1-batch-6.test.js` covers:
- Protection's option, and a changed option wording, which is refused;
- Infuse Vitality's proof, the rank arithmetic, a mismatched die, and actor-level arithmetic, which is refused.

[Live evidence](phase-rank-1-batch-6-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank1Batch6`:
- **Protection:**
  - 1st rank: the target got the Effect (AC 20 → 21).
  - 3rd rank with the option chosen: the target and an ally 10 feet from it got the Effect. An ally 30 feet away and an enemy 5 feet away didn't.
  - With the option declined, only the target did.
- **Infuse Vitality:** both targets got PF2e's Effect (d4 Strike dice, rank 1, 1 minute).
- **Regressions:** `durationBuffs`, `heightenedDuration`, `rank1Batch1`, `reactionBuffs` and `directHealing` passed, with cleanup between them. Cleanup left no fixtures and no combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b71
node tools/diff-compiled-plans.mjs /tmp/phase23-b70/official-spell-compiler-report.json /tmp/phase23-b71/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b71/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank1Batch6`, then `cleanup`.
