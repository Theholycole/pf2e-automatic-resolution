# Rank 1 batch 8 — verification

2026-09-26. The eighth rank-1 batch: two lingering-area extensions.

## Rules and spells

| Rule | Spell (phase) |
| --- | --- |
| A degree Effect with a second ChoiceSet, the caster's damage type (a flag of damage types that its Weakness rules read). The preamble lists exactly those types. The caster chooses once per cast, and every exposure uses the same choice. | Circle of Weakness (3) |
| Row claims for a chosen-type weakness: “weakness N to the chosen damage type”, “except the weakness is doubled” (twice the named row) and “As failure, and … Immobilized for 1 round or until they Escape” (a detachable grant). Also opening narration that only mentions weakness. | Circle of Weakness (3) |
| “Any creature that's in the area or enters the area before the start of your next turn”: exposed on casting and on entering. The area ends on the caster's next turn (in combat), with no item duration. A cube is a placed area. | Astral Rain (3) |
| “4d4 bludgeoning or piercing damage (your choice)” on one untyped damage entry: the caster's type, and PF2e's `{4d4}` is rolled as `{4d4[type]}` | Astral Rain (3) |

**Left blocked:** Earth's Bile. Its caster chooses a new area on each Sustain, and its basic save negates the persistent damage on a success. Neither fits the lingering-area model.

## Coverage

**Census:** **436 enabled**, up from 434 (Phase 3: 56).
- The b73 corpus diff against b72 changed exactly Circle of Weakness and Astral Rain. No variant plan changed and no plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 476/476 tests pass. `test/rank-1-batch-8.test.js` covers:
- the lingering declarations, the choice and the per-row weakness;
- the heightened value;
- refusals: an unstated weakness value, a doubled claim against the wrong row, a list that differs from the ChoiceSet, a predicated or non-damage-type ChoiceSet, a Weakness reading another flag, a typed damage entry and an item with its own duration.

[Live evidence](phase-rank-1-batch-8-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank1Batch8`:
- **Circle of Weakness**, started with fire:
  - All three creatures inside were exposed on casting, and each card showed “Damage type: fire”.
  - Success: “Spell Effect: Circle of Weakness (Fire) (Success)”, weakness 1 to fire. Failure: weakness 2. Critical failure: weakness 2 and Immobilized.
  - Each Effect lasted 1 round to the turn start.
  - Removing Immobilized (an Escape) left the weakness in place.
  - In combat, the Sustain exposed all three again, and the new card carried fire.
- **Astral Rain** in combat, with piercing:
  - The record had no clock maximum, and only the creature in the cube was exposed.
  - Its card rolled `4d4 piercing` (one piercing instance), and the failure took the full total.
  - A creature that entered on its turn was exposed. The area stayed active until the caster's next turn started, then ended (reason `duration`).
- **Regressions:** `lingering`, `degreeChoiceAndRift`, `songbird`, `enemies`, `longTailBatch2`, `longTailBatch4` and `rank1Batch7` passed, with cleanup between them. The run left no P23 fixtures or combats.

**During the batch:**
- PF2e writes untyped damage as `{4d4}`, without an `[untyped]` tag. The first live run refused it; the retype now reads both forms and still refuses anything else.
- Two harness fixes: ending the spell already removes its area, and the Astral Rain square shared coordinates with the Circle of Weakness creatures.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b73
node tools/diff-compiled-plans.mjs /tmp/phase23-b72/official-spell-compiler-report.json /tmp/phase23-b73/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b73/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank1Batch8`, then `cleanup`.
