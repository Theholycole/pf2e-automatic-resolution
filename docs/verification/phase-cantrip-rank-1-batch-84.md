# Cantrip / rank 1 batch 84 — Savor the Sting

2026-09-27. Continuing spell by spell. This is the first spell whose PF2e Effect marks a target token; seven other spell Effects use TokenMark.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “This deals 1d4 mental damage and @Damage[(@item.level)d4[persistent,mental]] damage; the target must attempt a Will save.” with the rows unaffected / half and no persistent / full initial and persistent / double initial and persistent, heightened by 1d4 each: the degree persistent-damage rows | Savor the Sting (1) |
| “As long as the target is taking persistent damage from this spell, you gain a +1 status bonus to attack rolls and skill checks against the target.” with PF2e's Effect (a TokenMark and a +1 status FlatModifier on attack rolls and skill checks, predicated on the mark and the target's persistent mental damage): the Effect on the caster at Finalize for each failing or critically failing target, marking that target's token | Savor the Sting |

PF2e's Effect is unlimited; its bonus applies only while the target has the persistent damage. The card's data note says to remove it once that damage is gone.

**Kept strict (tests):**
- Another bonus value or statistic list isn't read.
- A narration with “suffer a curse” isn't read.
- A success row with persistent damage isn't read.
- Other heightening isn't read.
- A tampered slug, degree list or claim is refused.
- The persistent-family mutations (“create an ally”, “suffer a curse” on Puff of Poison) still gate.

## Coverage

**Census:** **566 enabled**, up from 565.
- The b167 corpus diff against b166 changed only Savor the Sting (route false → true).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 660/660 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-84-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch84`:
- **Damage:** `1d4 mental` rolled 2. The targets lost 1, 2 and 4, and took persistent `1d4` (failure) and `(2 * 1d4)` (critical failure) mental.
- **Marks:** the caster got two “Spell Effect: Savor the Sting” Effects. PF2e's `tokenMarks` showed `savor-the-sting` on the failing and critically failing targets' tokens and none on the successful one.
- **Card:** it named the two marked targets and showed the data note.

**Regressions:** `cr1Batch83` passed, with cleanup between runs. The run left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b167
node tools/diff-compiled-plans.mjs /tmp/phase23-b166/official-spell-compiler-report.json /tmp/phase23-b167/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b167/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch84`, then `cleanup`.
