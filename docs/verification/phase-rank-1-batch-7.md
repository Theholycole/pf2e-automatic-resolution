# Rank 1 batch 7 — verification

2026-09-26. The seventh rank-1 batch, a single spell: it needed two new general mechanisms.

## Rules and spell

| Rule | Spell |
| --- | --- |
| A condition chosen per target by its highest attribute modifier (a tie across conditions is the creature's choice); the row's value for the spell's duration; a repeat Will save at the start of the caster's turns that ends it | Jealous Hex (1) |

The other bespoke rank-1 spells (Circle of Weakness, Earth's Bile, Astral Rain) each need a lingering-area extension with several parts. They stay for a later batch.

## Coverage

**Census:** **434 enabled**, up from 433 (Phase 3: 54).
- The b72 corpus diff against b71 changed exactly Jealous Hex. No variant plan changed and no plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions (including recurring saves).

## Evidence

**Automated:** 472/472 tests pass. `test/rank-1-batch-7.test.js` covers the options, values, duration and caster-turn save, the chosen and pending targets, and a map missing an attribute, which is refused.

[Live evidence](phase-rank-1-batch-7-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank1Batch7`, in combat:
- **Strength 4 target:** chosen as Enfeebled. Its critical failure gave Enfeebled 2.
- **Dexterity/Constitution tie:** held as a choice (clumsy or drained). Finalizing was refused until the creature chose Drained; its failure gave Drained 1.
- **At the start of the caster's next turn:** each creature got a Will save card, labelled “at the start of the caster's turn”. The Strength target succeeded and lost Enfeebled. The tied target failed and kept Drained 1.
- **Regressions:** the recurring-save harness (`endMode`, `reduceMode`, `jump`) and `rank1Batch4` / `rank1Batch5` passed, with cleanup between them. The run left no fixtures or combats of its own.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b72
node tools/diff-compiled-plans.mjs /tmp/phase23-b71/official-spell-compiler-report.json /tmp/phase23-b72/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b72/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank1Batch7`, then `cleanup`.
