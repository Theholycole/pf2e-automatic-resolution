# Cantrip / rank 1 batch 54 — Sepulchral Mask

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “You manifest a supernatural funerary mask, granting you a +1 status bonus to Will saving throws against emotion effects for 1 minute.”: PF2e's linked Effect (Will +1 status, predicated on emotion, 1 minute) on the caster when the area starts | Sepulchral Mask (1) |
| “Each enemy in the area when you Cast the Spell or that starts its turn in the area takes 1d4 mental damage and must attempt a Will save.”: the existing lingering emanation (enemies only) | Sepulchral Mask |
| Failure: “The creature takes full damage and takes a –1 status penalty to Will saves against emotion effects for 1 round.”; critical failure: “… double damage and a –1 status penalty … for 1 minute.”: the damage and a note with a Will −1 status modifier predicated on emotion | Sepulchral Mask |

**Note rules.** A note's generated modifier may now name a single save (Fortitude, Reflex, Will) and carry one `item:trait:<trait>` predicate. The b137 diff shows only Sepulchral Mask changed.

**Kept strict (tests):**
- A caster bonus other than the Effect's isn't proved.
- A note predicate other than a single trait is refused.

## Coverage

**Census:** **536 enabled**, up from 535.
- The b137 corpus diff against b136 changed only Sepulchral Mask.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 604/604 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-54-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch54`:
- **Caster:** PF2e's Effect with Will +1 against emotion, for 1 minute.
- **Enemy inside:** the GM reviewed it into the save, and on a failure it lost 3 (the roll).
- **Note:** the enemy got the 1-round “Will penalty against emotion effects” note, with Will −1 predicated on emotion.
- **End:** the cast was ended.

**Regressions:** `drought` (lingering area) passed. The run left no P23 fixtures or combats.

The evidence counts 10 leftover `PFTEST` regions on the scene. They came from older cases (Animated Assault, Petal Storm, The Queen's Rainbow, Heal, Flame source), not this run, and were deleted after it.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b137
node tools/diff-compiled-plans.mjs /tmp/phase23-b136/official-spell-compiler-report.json /tmp/phase23-b137/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b137/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch54`, then `cleanup`.
