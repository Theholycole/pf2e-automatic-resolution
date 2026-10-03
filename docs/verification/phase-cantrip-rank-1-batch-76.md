# Cantrip / rank 1 batch 76 — Barbed Spear

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Make a ranged spell attack roll, dealing 1d8 piercing damage on a success and double damage on a critical success.”: the spell-attack route | Barbed Spear (1) |
| “The spear remains lodged within a creature it hits, making the target Clumsy 1 (or increasing its clumsy condition by 1 if it is already clumsy) for 1 minute or until the spear is removed with a successful Athletics check against your spell DC as an Interact action, whichever comes first.”: on a hit, Clumsy 1, or one more than the creature already has, for 1 minute or until it uses an Interact action | Barbed Spear |
| The removal's Athletics check: a **GM:** reminder to end it only on a success | Barbed Spear |
| The item's `varies` duration: the condition's own lifetime | Barbed Spear |

**Kept strict (tests):**
- A mismatched condition name isn't read.
- Another skill isn't read.
- An added rule isn't read.

## Coverage

**Census:** **558 enabled**, up from 557.
- The b159 corpus diff against b158 changed only Barbed Spear.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 644/644 tests pass (`test/cantrip-rank-1-batch-59.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-76-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch76`:
- **A hit on a creature with no Clumsy:** 6 damage and Clumsy 1 (“Barbed Spear: Clumsy 1 (ends on Interact)”, 1 minute).
- **A hit on a creature already Clumsy 1:** 6 damage and Clumsy 2.
- **A miss:** nothing.
- **Card:** the removal reminder was shown.

The first run left the already-clumsy creature at Clumsy 1: the card's condition snapshot didn't carry the increment flag. It was added and the case re-run.

**Regressions:** `rank1Batch10` (spell attacks) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b159
node tools/diff-compiled-plans.mjs /tmp/phase23-b158/official-spell-compiler-report.json /tmp/phase23-b159/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b159/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch76`, then `cleanup`.
