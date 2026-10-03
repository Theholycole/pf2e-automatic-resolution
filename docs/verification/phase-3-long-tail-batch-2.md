# Long-tail batch 2 — verification

2026-09-26. This is a larger batch of unrelated rules, as requested: the long tail, spell by spell, starting from Sustain. Each rule is general, and one live run covers them all.

## Rules and spells

| Rule | Spell (phase) |
| --- | --- |
| A sustained basic save on the cast's own target, again on each Sustain, plus “The target is <Condition> for as long as the effect persists” | Interstellar Void (3, Sustain) |
| “… for an unlimited duration” (only the condition it follows) | Eclipse Burst (2) |
| “until it next gets eight hours of rest” / “decreasing these conditions by 1 for each eight hours of rest it gets” | Heinous Future (2) |
| A bare “for the duration”, and “The fatigued condition doesn't end when the spell's duration does (but can still be removed with a night's rest …)” | Day's Weight (2) |
| “At the end of each of its turns, the target can attempt to Escape. The Escape DC is equal to your spell DC.” | Mantis's Grasp (2) |
| “The creature moves N feet toward the center.” (a GM note) | Gravity Well (3) |

### Guard and fix

- **Haunting Spirit** compiled as a one-time save, although its target saves “at the start of each of the target's turns”. Only an unclaimed row kept it blocked. That wording is now an ongoing trigger, so it stays blocked honestly. Dehydrate and Inexhaustible Cynicism gained the same gap; both were already blocked.
- **Unfathomable Song:** during the batch, a table row's “for an unlimited duration” leaked onto another row's condition, because the table has no sentence breaks. The phrase now applies only to the condition it follows. The spell stays blocked.

## Coverage

**Census:** **402 enabled**, up from 396.
- Phase 2: 213 of 588.
- Phase 3: 48 of 615 (Sustain 9 of 153).
- The b63 corpus diff against b62 changed 11 plans: the 6 spells above, 3 new guard gaps on spells that were already blocked, Antlion Trap (its centre pull now read; still blocked), and Unfathomable Song (its row-5 condition only; still blocked).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 439/439 tests pass. `test/long-tail-batch-2.test.js` covers every rule above, the local unlimited phrase (Unfathomable Song) and the each-turn guard (Haunting Spirit).

[Live evidence](phase-3-long-tail-batch-2-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `longTailBatch2`:
- **Eclipse Burst:** rolled 53 (cold 38, void 15).
  - A living creature critically failed: it lost 106 and was Blinded with an unlimited duration.
  - An undead and a construct failed, and each lost only the cold (38). PF2e itself keeps void damage off non-living creatures.
  - The counteract-light reminder was shown.
- **Heinous Future** (player characters, since PF2e rests only characters):
  - The failure's Slowed 1 and Stupefied 1 were removed by one Rest for the Night.
  - The critical failure's Slowed 2 and Stupefied 2 became 1 and 1, then were removed by a second rest.
- **Day's Weight:** a critical failure gave Enfeebled 2 for 1 minute, and Fatigued with no timer, flagged to end at rest.
- **Mantis's Grasp:** a critical failure doubled the damage (66). “Immobilized (until Escape)” lasts 1 minute, against Escape DC 24.
- **Gravity Well:** the card showed “moved 5 feet toward the center” for a success and 30 feet for a critical failure.
- **Interstellar Void:**
  - Started for the targeted creature, which was Fatigued at once.
  - Cast save, failure: 3d6 cold, lost 13.
  - Sustain in combat, success: lost 7 of 15.
  - When the spell ended, Fatigued ended too.
- **Regressions:** `sustainedConditions`, `lingering`, `persistentOnce`, `forcedMovement` and `attackConditionRiders` passed.
  - `sustainDamage` and `degreeChoiceAndRift` failed in the long sequence. A creature from an earlier area case, left in the same map area (the harness cleans up only at the end), took the first exposure.
  - Both passed when each ran after cleanup. Both results are in the evidence file.
- Cleanup left no fixtures and no combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b63
node tools/diff-compiled-plans.mjs /tmp/phase23-b62/official-spell-compiler-report.json /tmp/phase23-b63/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b63/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `longTailBatch2`, then `cleanup`.
