# Cantrip / rank 1 batch 96 — Withering Grasp

2026-09-27. Continuing spell by spell. You asked for Withering Grasp to bypass immunity for this spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Make a spell attack … Your touch deals 1d12 void damage plus 1d4 persistent void damage.” with “Your touch deals double damage (both initial and persistent).” / “… full damage.”: the attack's rows | Withering Grasp (1) |
| “Unlike normal void damage, the void damage from withering grasp damages objects, constructs, and the like …”: a construct's void immunity (PF2e's) is lifted by an `Immunity` remove Effect for this spell's damage, kept while its persistent void damage lasts | Withering Grasp |
| “If a creature uses an item to block withering grasp, …, the creature doesn't take damage …”: a GM reminder (exclude it; the shield takes the spell) | Withering Grasp |
| “If you target an object, lower its Hardness by 4 (2) for 1 minute.” and its Heightened step: a GM reminder | Withering Grasp |

**Kept strict (tests):**
- Naming undead too isn't read.
- Another block rule isn't read.
- An object rule with more in it isn't read.
- A forged bypass type is refused.

## Coverage

**Census:** **578 enabled**, up from 577.
- The b179 corpus diff against b178 changed only Withering Grasp (route → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 684/684 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-96-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch96`:
- **The construct:** it had PF2e's void immunity before the cast. On a hit (`1d12 void + 1d4 persistent void`) it lost 2 and got persistent `1d4` void. It had the lifting Effect and no void immunity during that time.
- **The living target:** on a critical hit it lost 4 and got persistent `2 * 1d4` void, with no lifting Effect.
- **After the construct's persistent void was removed:** the lifting Effect was gone, and its void immunity was back.

**Regressions:** `cr1Batch85` (persistent-damage links) passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b179
node tools/diff-compiled-plans.mjs /tmp/phase23-b178/official-spell-compiler-report.json /tmp/phase23-b179/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b179/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch96`, then `cleanup`.
