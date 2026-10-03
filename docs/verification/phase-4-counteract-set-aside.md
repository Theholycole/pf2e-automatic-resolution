# Counteract family (part 3): suspend, suppress, possession — verification

2026-09-26. This continues the counteract family ([part 1](phase-4-counteract-care.md), [part 2](phase-4-counteract-spells.md)). Some counteracts don't end what they counteract: they suspend it for a while, or suppress it on a near miss. PF2e 8.5 has no way to switch an Effect off, so this batch adds a shared **set-aside** mechanism.

## Set aside (`scripts/set-aside-runtime.js`)

- **`setAsideEffect(document, …)`:**
  - stores the Effect's (or Pseudo Afflictions affliction's) source on a marker Effect on the same creature;
  - the marker lasts the set-aside time: a suspension's fixed time, or until the start of the caster's next turn, using the module's `nativeConditionTiming` (0 rounds if the caster's turn is still to come this round);
  - then deletes the original.
- **`restoreSetAside(marker)`:** recreates the source (with its id where free) and moves its `start` forward by the time it was away, so its own duration doesn't elapse. It removes the marker first and tolerates the marker being gone already.
- **When a restore happens:** the lead GM checks on `updateWorldTime`/`updateCombat`, and also when a marker is deleted (PF2e's “remove expired effects”, or the GM ending it early).
- **The race it guards against:** the first live run found that PF2e's expiry sweep and the module's restore both deleted the marker. The loser's error aborted the restore, and the effect was lost. The restore now deletes first and ignores “already gone”, and the delete hook leaves a marker that's already being restored alone.

## Compiler and runtime (care route)

| Spell | Sentences | Plan |
|---|---|---|
| Delay Affliction | “The target recovers 3d8 Hit Points.” · “You attempt to counteract any one affliction you are aware the target has, suspending its effects for 1 hour on a success rather than removing it.” · “The target is then temporarily immune to delay affliction for 1 day.” · the awareness sentence · Heightened (+1) “The target recovers an additional 1d8 Hit Points, and you can attempt to suspend an additional affliction” | `heal` 3d8; counteract `affliction`, `anyAffliction`, `setAside: suspend 1 hour`; immunity 1 day; `awareness` note; `counteractPickStep` (1 more per rank above 3rd) |
| Sound Body | “Attempt to counteract an effect of your choice imposing one of these conditions on the target: Blinded, Dazzled, Deafened, Enfeebled, or Sickened.” · near-miss suppression · “The effect's duration doesn't elapse while it's suppressed.” · exclusions · Heightened 4th/6th/8th add conditions | counteract `effect` by granted condition; `nearMiss` 2 ranks → suppress until the caster's next turn, duration paused; `excludeTraits` [curse, disease]; conditions added by rank |
| Luminous Stardust Healing | “The target regains 16 Hit Points.” · possession counteract · failure sentence · Heightened (+1) “The amount of healing increases by 8.” | `heal` 16; counteract `effect` [possession], `optional`; `counteractOutcome` success/failure notes |

**Checks:**
- A counteract with `setAside` removes nothing on success; it sets aside instead.
- A near miss is `counteracts(degree, castRank, rank − 2)` after a failed `counteracts(degree, castRank, rank)`.
- Excluded traits and set-aside markers are never offered as candidates.
- The heal operation now carries its `formula` (Harmonize Self's plan changed from `amount` to `formula` only).

## Coverage

**New:** Delay Affliction, Sound Body and Luminous Stardust Healing.

**Census:** **361 enabled**, up from 358 (these three are in Phase 4's Healing group, which has 39 left).
- The corpus diff against b49 changed exactly these 3 plans.
- The speed, escape and six rule-family checks report 0 regressions.

**Left in the family:**
- Soothing Ballad (up to 10 targets);
- Elemental Counter;
- Spell Turning;
- the standing wards (Spell Immunity, Veil of Privacy, Rigid Form, Planar Seal, Truesight);
- Unblinking Flame Revelation (suppress illusions for its duration), Umbral Graft, Seize Soul;
- counteracts inside other routes.

## Evidence

**Automated:** 395/395 tests pass.
- `test/counteract-care.test.js` covers:
  - each plan;
  - Delay Affliction's pick count by rank (1, 2, 4 at ranks 3, 4, 6);
  - Sound Body's conditions at 8th rank;
  - the refusal of a near miss without the duration sentence.
- `test/set-aside.test.js` covers the marker's duration: suspension, out of combat, and in combat before and at the caster's turn.

[Live evidence](phase-4-counteract-set-aside-live-results.json) on Foundry 14.367 / PF2e 8.5.0 / Pseudo Afflictions, `pftest` (PF2e “remove expired effects” on), case `counteractSetAside`:
- **Delay Affliction:**
  - It healed 16 (3d8).
  - Spider Sting was suspended: the affliction was gone and a 1-hour marker was present.
  - The creature got 1-day immunity.
  - After 3601 s of game time, Spider Sting was back at stage 2 and the marker was gone.
  - A second creature's suspension ended at once when the GM deleted the marker.
- **Sound Body:**
  - A rank-1 Blinded effect was counteracted, and Blinded was gone.
  - A rank-7 effect (critical success, reach 5, rank − 2 = 5) was suppressed. Blinded was gone and a 1-round marker was present.
  - After 7 s it was back, with Blinded, and its start moved forward 7 s.
  - A disease-trait effect wasn't offered.
- **Luminous Stardust Healing:**
  - It healed 16 and counteracted the possession, with the “cast out … 1 week” note.
  - With no possession, it only healed (“Nothing … to counteract”).
- **Regressions:** `counteractCare`, `counteractSpells` and `care` were rerun, then cleanup.
