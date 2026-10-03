# Rank 1 batch 9 — verification

2026-09-26. The ninth rank-1 batch: two more lingering-area extensions, and a guard on Area paragraphs.

## Rules and spells

| Rule | Spell (phase) |
| --- | --- |
| An Area paragraph “three 5-foot bursts that don't overlap” (two to five of the item's shape and size). The caster places each area, overlapping circles are refused, and a creature in any area is inside. The areas' own noun (“one of the clusters”, “a cluster”) is the area. | Corpse Bloom (2) |
| “the first time a creature enters a cluster each round”: one enter exposure per creature per round, while starting a turn inside still counts. Also “…, it takes 3d4 poison damage with a Fortitude save as …” as a degree-area trigger, and corpse narration. | Corpse Bloom (2) |
| A basic area exposed only on casting (“Each creature except you in the area when you Cast the Spell takes …”) lingers when it conceals. It carries the save's degree riders and ends at the start of the caster's next turn (any 1-round area). “This smoke can be dispersed by a strong wind.” is a GM note on the concealment Effect. | Noxious Vapors (2) |
| An Area paragraph that isn't read now blocks the spell (pending `area-paragraph`) instead of being ignored | 52 plans, all already blocked |

**Left blocked:**
- **Sting of the Sea:** its Effect gives a circumstance penalty where the text says an untyped one.
- **Sepulchral Mask:** it needs generated Will penalties against emotion effects, and a caster Effect inside a lingering area.

## Coverage

**Census:** **438 enabled**, up from 436 (Phase 2: 240, Phase 3: 57).
- The b74 corpus diff against b73 changed 54 plans: Corpse Bloom and Noxious Vapors, plus 52 already-blocked plans with an Area paragraph that now also carry `area-paragraph`.
- No variant plan changed and no plan lost a route. The one enabled spell with an Area paragraph (Elemental Blast's shape list) is unchanged.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 478/478 tests pass. `test/rank-1-batch-9.test.js` covers:
- the declarations and the per-degree Sickened;
- refusals: an Area paragraph that doesn't match the item, a noun other than the areas' own, a cloud without concealment (an ordinary area save) and a dispersal sentence in other words.

[Live evidence](phase-rank-1-batch-9-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank1Batch9`, in combat:
- **Corpse Bloom:**
  - Three overlapping circles were refused (“Corpse Bloom's areas can't overlap.”). Three separate clusters were recorded.
  - Nobody was exposed on casting. The creature inside got one “started its turn in the area” exposure.
  - A creature that entered the third cluster, left and entered again in the same round got one “entered the area” exposure.
  - The confirmed failure took the full `3d4 poison` roll and Sickened 1.
  - Deleting one cluster put the cast into review. After the GM resumed and ended it, no clusters were left.
- **Noxious Vapors:**
  - Around the caster, with no clock maximum. Only the nearby creature was exposed: not the caster, and not the creature outside.
  - The caster and the nearby creature were concealed, and the Effect's description carries the strong-wind note.
  - The critical failure took double the `1d6 poison` roll and Sickened 1.
  - The cloud stayed until the caster's next turn started, then ended and removed both creatures' concealment.
  - Older bystander tokens near the caster on the shared scene were marked unaffected by the GM.
- **Regressions:** `lingering`, `songbird`, `degreeChoiceAndRift`, `enemies`, `longTailBatch2` and `rank1Batch8` passed, with cleanup between them. The run left no P23 fixtures, combats, regions or concealment Effects.

**Harness notes:**
- A cast under review can't simply be ended: the GM resumes it (`resume-reviewed`) or takes it over.
- The shared pftest scene has older tokens around the caster's usual spot.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b74
node tools/diff-compiled-plans.mjs /tmp/phase23-b73/official-spell-compiler-report.json /tmp/phase23-b74/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b74/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank1Batch9`, then `cleanup`.
