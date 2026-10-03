# Terrain batch 2 — verification

2026-09-26. The second terrain-family batch: areas whose penalties last until a creature leaves them.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| Inline results after an area trigger (“On a failure, it takes a –10-foot circumstance penalty to its Speeds until it leaves the area, and on a critical failure, it's also …”), read as a table | Sea of Thought (3), Entangling Flora (2) |
| A generated Speed penalty with no timer that ends when the creature leaves the lingering area (reconcile) or when the area ends | Sea of Thought, Entangling Flora |
| “Creatures can attempt to Escape to remove these effects.”: the penalty and the critical failure's Immobilized end on one Escape (the Escape card now ends a cast's Effects on that creature together) | Entangling Flora |
| Difficult terrain in degree-save areas (“All surfaces in the area are …”, “The area becomes difficult terrain, similarly to a shallow bog.”) | Sea of Thought, Entangling Flora |
| PF2e's Effect link restating the row's Speed penalty is set aside, and “all squares … that contain plants” becomes a GM note | Entangling Flora |
| **Guard:** an unread “difficult/hazardous terrain” sentence before a degree table now blocks the spell (`preamble:terrain`) instead of being dropped | 19 already-blocked plans |

**Still blocked:** Swampcall (its Effect should end on leaving the area) and Oneiric Mire (an end-of-turn save and disbelief), among others.

## Coverage

**Census:** **453 enabled**, up from 451.
- The b79 corpus diff against b78 changed 21 plans: Sea of Thought and Entangling Flora (enabled), plus 19 already-blocked plans with a new `preamble:terrain` blocker (Web, Swampcall, Mushroom Patch, Whirlwind, …).
- One variant plan (Telekinetic Bombardment's, already blocked) got the same blocker. No plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 491/491 tests pass. `test/terrain-batch-2.test.js` covers:
- the lingering declarations, the leave-area penalties, Prone, Immobilized with Escape, and the set-aside link and note;
- refusals: a leave-area proof without a lingering area, results after no area trigger or for another save, and Web's `preamble:terrain`.

[Live evidence](phase-terrain-batch-2-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `terrainBatch2`, in combat:
- **Sea of Thought:**
  - Each creature was exposed at the start of its turn. The failure and the critical failure dropped Speed 25 → 15, and the critical failure was knocked Prone.
  - The region carried difficult terrain.
  - The creature that walked out got Speed 25 back. Ending the spell removed the other's penalty and kept Prone.
- **Entangling Flora:**
  - Same penalties, and the critical failure was Immobilized.
  - Leaving the area removed the first creature's penalty.
  - A scripted Escape at the spell DC raised one card listing both Effects. Ending it removed both the penalty and Immobilized (Speed 25).
- **Regressions:** `lingering`, `sustainDamage`, `attackRowRules`, `compact`, `cantripBatch1`, `cantripBatch2`, `terrainBatch1`, and the Escape harness (`degrees`, `ranks`, `escape`, `multiple`, `timer`) passed. `multiple` checks that separate casts still escape separately. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b79
node tools/diff-compiled-plans.mjs /tmp/phase23-b78/official-spell-compiler-report.json /tmp/phase23-b79/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b79/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `terrainBatch2`, then `cleanup`; `tools/phase23-escape-verification.mjs` cases `degrees`, `ranks`, `escape`, `multiple`, `timer`.
