# Cantrip batch 2 — verification

2026-09-26. The second cantrip batch: three cantrips, each needing a new general rule.

## Rules and spells

| Rule | Spell |
| --- | --- |
| A spell attack whose Effect link follows the attack sentence: PF2e's degree Effect on each hit row, with the `critical-success` value. Rows prove a Speed penalty (with the Effect's granted condition). “It can attempt to Escape against your spell DC to remove …” (naming every granted condition) ends the whole Effect on a successful Escape. “Heightened (2nd) The effects last for 2 rounds.” sets the duration by rank. | Tangle Vine |
| “Your eidolon can benefit from either A or B, but not both; … the newer spell replaces the older one.”: applying this spell's Effect first removes the caster's Effect from the other spell | Boost Eidolon |
| A stated resistance number or “(minimum N)” must be the Effect's value at the spell's rank (`effect-value-mismatch`) | Keeps Reinforce Eidolon blocked (its Effect gives 0 at rank 1) |
| “The sickened value can't be reduced below 1 while the spell is active.”: a floor Effect that ends with the sustained spell, while the condition itself keeps PF2e's own lifetime | Buzzing Bites |
| “Once this spell ends, the target becomes temporarily immune for 1 minute.”: immunity with no timer while the spell lasts; the Ongoing record starts its minute when the spell ends | Buzzing Bites |

**Changed tests:** two existing tests pinned the old behaviour and now check the new rules.
- `test/compiler.test.js`: Tangle Vine's Effect was an unscoped link.
- `test/duration-bound-effect.test.js`: Boost Eidolon's replacement was a gap.

## Coverage

**Census:** **447 enabled**, up from 444. Cantrips: 50 of 120.
- The b77 corpus diff against b76 changed exactly Tangle Vine, Boost Eidolon and Buzzing Bites. No variant plan changed and no plan lost a route.
- A first version of the resistance check also caught Enduring Might, whose Effect value reads the actor. The check now applies only when the text states a number, and Enduring Might is unchanged.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 486/486 tests pass. `test/cantrip-batch-2.test.js` covers:
- Tangle Vine's rows, Escape, heightened durations and inspections;
- the replacement rule and the resistance check;
- Buzzing Bites' floor and immunity;
- refusals: an Escape that doesn't name the granted condition, a different penalty, a replacement naming neither spell, a floor above the condition, and a floor on a spell with no lifetime.

[Live evidence](phase-cantrip-batch-2-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cantripBatch2`:
- **Tangle Vine:**
  - Critical hit: “Spell Effect: Tangle Vine (Critical Success)”, Immobilized, Speed 25 → 15, 1 round, Escape DC 24.
  - Hit: “(Success)”, Speed 15, not Immobilized. Miss: nothing.
  - A scripted Escape check at DC 24 raised the Escape card. Ending it removed the Effect and Immobilized, and restored Speed 25.
  - At caster level 3 (rank 2) the Effect lasted 2 rounds.
- **Boost Eidolon:** the target's “Spell Effect: Reinforce Eidolon” (from the same caster) was replaced by “Spell Effect: Boost Eidolon”.
- **Buzzing Bites:**
  - The critical failure took double damage and Sickened 1 with “Buzzing Bites: sickened floor”. The success took half.
  - Both creatures got immunity with no timer while the spell lasted.
  - Ending the spell removed the floor, kept Sickened 1, and gave both creatures 1-minute immunities.
- **Regressions:**
  - Before Buzzing Bites was added: `degreeChoiceAndRift`, `rank1Batch8`, `attackConditionRiders`, `attackRowRules`, `durationBuffs`, `heightenedDuration`, `cantripBatch1`.
  - After: `sustainedConditions`, `marinersCurse`, `cordyceps`, `goblinImmunity`, `blisterImmunity`, `attackConditionRiders`, `rank1Batch9`, and the Escape harness (`degrees`, `ranks`, `escape`, `multiple`, `timer`).
  - All passed, with cleanup between them. The run left no P23 fixtures or combats.

**Harness fix:** the Escape harness created every caster at level 5. PF2e clamps an NPC's spell to its maximum rank (a level-5 NPC's rank-5 Grasping Grave is rank 3), and the runtime correctly refused to roll at that rank. The harness now creates each caster at the level of the spell's own rank.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b77
node tools/diff-compiled-plans.mjs /tmp/phase23-b76/official-spell-compiler-report.json /tmp/phase23-b77/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b77/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cantripBatch2`, then `cleanup`; `tools/phase23-escape-verification.mjs` cases `degrees`, `ranks`, `escape`, `multiple`, `timer`.
