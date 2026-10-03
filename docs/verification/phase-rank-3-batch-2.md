# Rank 3 batch 2 — verification

2026-09-26. The rank-order pass continued past rank 3. Ranks 3 and 4 had no more cheap general rules. The push-row family reaches rank 5, so this batch extends it. It also fixes three compiler faults found along the way.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| “The creature takes double damage. The creature is pushed 20 feet away from you and is then knocked Prone.”: a damage sentence, then the push and Prone | Repelling Pulse (5) |
| “Heightened (+2) … the distance the target is moved on a failure and critical failure increases by 5 feet.”: the push distance at the cast rank | Repelling Pulse |
| “The target takes double damage, is pushed 10 feet away from you, and is knocked Prone.” | Tornadic Gale (5) |
| “All Medium or smaller creatures that are adjacent to the line are pulled to the nearest unoccupied space within the line.”: a **GM:** reminder before the saves | Tornadic Gale |
| **Guard:** any other “creatures that … are pushed/pulled” sentence before the table blocks (`preamble:forced-movement`) instead of being dropped | |

## Correctness fixes

- **A reaction's Trigger paragraph isn't a rule.** “Trigger: A creature within range becomes Frightened” had blocked Fearful Feast as an extra condition. The preamble scan now skips the Trigger paragraph.
- **“equal to half the damage” isn't the row's multiplier.** With its Trigger no longer blocking, Fearful Feast showed a wrong plan:
  - failure ×0.5 and critical failure ×0.5, from “you regain Hit Points equal to half the damage the target takes”;
  - Frightened set to 4 instead of increased by 1;
  - the caster's healing missing.

  `inferDamageMultiplier` now ignores “equal to (half) the damage …”.
- **A lowercase “you …” clause after a semicolon is the caster's.** Fearful Feast's healing clause is now unaccounted prose, so the spell stays blocked, as it should: its row-level healing and capped Frightened increase aren't compiled. Puppet Strings (already blocked) also reports its caster clause.

**Still blocked:**
- Fearful Feast;
- Unfolding Wind Buffet (push distance from its Strikes);
- Anchoring Air (its degree-choice Effect's timing “until the end of its turn” against PF2e's 1-round turn-end duration);
- the rest of ranks 3–4, which are one-off wordings.

## Coverage

**Census:** **464 enabled**, up from 462. Rank 5: 39 of 202.
- The b83 corpus diff against b82 changed 4 plans. Repelling Pulse and Tornadic Gale are newly enabled.
- Fearful Feast and Puppet Strings changed outcomes and stay blocked.
- No plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 502/502 tests pass.
- `test/rank-5-push.test.js` covers both spells, the pull guard and Fearful Feast's multipliers.
- `test/cantrip-batch-1.test.js` now checks that an unstated heightened distance wording is still refused. It had pinned Repelling Pulse's refusal.

[Live evidence](phase-rank-3-batch-2-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank3Batch2`:
- **Repelling Pulse:** pushes of 10 and 20 feet at rank 5, and 15 and 25 feet at rank 7 (caster level 13).
  - Prone on each critical failure.
  - At rank 5 the failure took the full 38 and the critical failure 76.
- **Tornadic Gale:** the **GM:** reminder “Before the saves: All Medium or smaller creatures … are pulled to the nearest unoccupied space within the line. Move them; the module doesn't.”
  - A first run showed the renderer's default counteract sentence appended to it. The `area-pull` kind now renders plainly, and the case checks that.
  - Pushes of 5 and 10 feet, with Prone on the critical failure.
- **Regressions:** `rank3Batch1`, `cantripBatch1`, `attackRowRules` and `longTailBatch2` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b83
node tools/diff-compiled-plans.mjs /tmp/phase23-b82/official-spell-compiler-report.json /tmp/phase23-b83/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b83/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank3Batch2`, then `cleanup`.
