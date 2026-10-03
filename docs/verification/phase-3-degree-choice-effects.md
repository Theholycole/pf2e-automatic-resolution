# Degree-of-success Effects and Fiendish Rift — verification

2026-09-26. This is the long tail, spell by spell, starting with the largest group (Phase 3 **Sustain**). Each fix is still a general rule.

## Choosing the spells

**Fiendish Rift** (Sustain) was the closest. Two wordings stopped it:
- its trigger split across two sentences;
- a semicolon trait-extra clause.

**Leaden Steps** (next in Sustain) showed that PF2e models many degree tables with one Effect whose ChoiceSet picks rules by degree. 16 blocked spells link such an Effect. The two that this rule fully frees are Distracting Decoy and Ill Omen. Leaden Steps, Circle of Weakness, Anchoring Air and Crushing Ground need more (see below).

## Compiler

**`degree-choice-effect.js`** accepts the Effect only when:
- it has exactly one degree ChoiceSet;
- every other rule is `FlatModifier`, `RollTwice` or a condition `GrantItem`, gated only on the Effect's own degree choice;
- it lasts 1 round, ending at the start of a turn.

For each offered degree, `proveDegreeChoiceRow` must explain the row:
- **attack penalties:** value, type, and “while it's off-guard” only if the Effect grants Off-Guard;
- **rolling twice:** “the first time” means removed after the roll, “every time” means kept;
- **granted conditions:** must be the row's own. They're marked `carriedBy` the Effect.

A rule the row doesn't state, or a claim the rules don't give, leaves the Effect unbound.

**Lingering areas:**
- “…, each creature in the area takes 7d6 spirit damage. An affected creature attempts a Fortitude save.” is one trigger.
- “; creatures with the holy trait take an additional @Damage[10[spirit]] damage” is the holy extra damage.

## Runtime

- **The Effect:** created with its ChoiceSet preset to the target's degree, so PF2e doesn't prompt and appends the degree to the name. The runtime inspector re-proves the row claims against the live template.
- **Carried conditions:** not applied by the module (`snapshotEffect` keeps `carriedBy`).

## Coverage

**New:**
- **Distracting Decoy** (Phase 2).
- **Ill Omen** (Phase 2).
- **Fiendish Rift** (Phase 3 Sustain): a sustained lingering area.

**Census:** **396 enabled**, up from 393.
- The b62 corpus diff against b61 changed exactly these 3 plans.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

**Still blocked with degree-choice Effects:**
- **Leaden Steps:** weakness by degree, and “The spell can't be sustained.”
- **Circle of Weakness:** a second ChoiceSet for the energy type.
- **Anchoring Air:** a one-Strike modifier; critical failure inherits failure's choice.
- **Crushing Ground:** a Speed modifier, and damage when the spell ends.
- **Equal Footing:** two Effects and speed suppression.
- **Others:** further clauses.

## Evidence

**Automated:** 434/434 tests pass.
- `test/degree-choice-effect.test.js` covers:
  - Distracting Decoy's binding and carried Off-Guard;
  - Ill Omen's “every time”;
  - proof refusals: wrong value, wrong type, the off-guard guard without Off-Guard, an unstated rule, and a foreign predicate;
  - Fiendish Rift's lingering declaration and holy extra.
- `test/sustained-conditions.test.js`: its Fiendish Rift example now asserts the lingering route (still never a one-time save).

[Live evidence](phase-3-degree-choice-effects-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `degreeChoiceAndRift`:
- **Distracting Decoy:**
  - **Failure:** “Spell Effect: Distracting Decoy (Failure)”, selection `failure`, 1 round. The creature is off-guard through the Effect, with no module Off-Guard Effect and no active attack penalty.
  - **Critical failure:** selection `critical-failure`, off-guard, and an active −2 attack penalty.
  - **Success:** nothing.
- **Ill Omen:** failure has one active RollTwice (keep lower, removed after the roll). Critical failure has one with `removeAfterRoll: false`.
- **Fiendish Rift** (holy creature):
  - **Cast, failure:** 7d6 spirit (30) plus the holy 10. It lost 40 and was Grabbed.
  - **Sustain in combat, success:** 20 + 10, halved to 15.
  - **Ending:** the cast ended.
- **Regressions:** `sustainedConditions`, `conditionalDamage`, `persistentLinked` and `selfConditional` passed. `lingering`, `sustainDamage` and `compact` failed once when my regression batches overlapped in the slow `pftest` tab. Rerun alone after cleanup, all three passed; the compiled plans for those spells are unchanged in b62. Cleanup left no fixtures.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b62
node tools/diff-compiled-plans.mjs /tmp/phase23-b61/official-spell-compiler-report.json /tmp/phase23-b62/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b62/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `degreeChoiceAndRift`, then `cleanup`.
