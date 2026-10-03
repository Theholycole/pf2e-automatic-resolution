# Spell-attack condition riders — verification

2026-09-26. This batch continues Phase 4's largest group, **Attack and dependent result** (50 blocked at the start).

## Choosing the batch

The remaining 50 attack spells were sorted by what blocks each. Most are one-off wordings with their own mechanism:
- Strike modifiers (reach, range, concealment);
- creature-type branches;
- a condition that increases an existing one;
- healing driven by bleed damage;
- delayed explosions.

Soul Cutter stays blocked for a data reason: its PF2e variants deal bludgeoning damage while the text says spirit, and `matchesDamage` refuses the mismatch, as it should.

This batch takes the attacks whose result is damage plus a condition or persistent damage, where each blocker is a general wording rule. There's no spell-name dispatch.

## Compiler (`spell-attack-table.js`)

- **Hit and critical-hit conditions with their own durations:** “On a hit, you deal <damage>, plus <flavour>, making them <condition> [as …]. On a critical hit, double the [<type>] damage, and the target becomes <condition> [by …].”
  - The critical row's condition replaces the hit row's.
  - A named type must be the damage entry's.
- **A cosmetic mark:** “The <x> stain remains for N hours before fading, although … can remove the <x> before then.” carries no rule and is set aside. Any other sentence after the attack still blocks the spell.
- **An empty Target:** read as one creature when the attack says “… spell attack roll against the target(’s AC).”. `compile-ability.js` then sets the Target to `1 creature` for any accepted attack with an empty Target (before, only repeated blasts got this).
- **Reactions:**
  - `the triggering creature` / `the creature that took damage` are one target, but only if the attack reads “against the triggering creature's AC”.
  - `target-predicate-compiler.js` accepts “the creature that took damage”, like its other trigger-named targets.
- **Only persistent damage:** a lone persistent damage entry reads as the damage list, and the new form “On a hit, <flavour>, dealing <damage>.” reads it.
  - The `attack-component-rows` proof (compiler, `validate-plan.js`, `inspectDegreeSavePlan`) accepts one component only when it's persistent.
  - A critical hit doubles it.
- **A condition for the duration that ends with the persistent damage:** “If you hit, you deal <damage list>, and the target is <condition> for the duration.” together with “When the target's persistent <type> damage ends, the spell automatically ends.”
  - This becomes a persistent-linked condition on both hit rows.
  - It has no timer of its own, so the carrier Effect takes the spell's fixed duration (1 minute) and the persistent link removes it sooner.
  - Without the ending sentence, “for the duration” is refused.
- **Removal:** “The <x> can be removed with N Interact actions, which ends the persistent <type> damage.” (plus “These Interact actions don't need to be consecutive.”) becomes a `removal` reminder.
  - `inspectDegreeSavePlan` accepts it only on a spell attack with a persistent-linked condition.
  - The card tells the GM to remove the persistent damage condition once the actions are taken, and the linked condition ends with it.

**Incapacitation needs no module code.** `spell.rollAttack` gets the spell and the target, so PF2e's check lowers a `spell-attack-roll` by one degree against a creature above twice the spell's rank. The live test below confirms it.

## Coverage

**New:**
- **Inkshot:**
  - Critical hit: double damage and Dazzled for 1 minute.
  - Hit: full damage and Dazzled for 1 round.
  - Miss: nothing.
- **Brine Dragon Bile:** a reaction against the triggering creature. A hit applies 2d6 persistent acid, and a critical hit doubles it.
- **Blinding Foam:** damage, 1d6 persistent acid, and Blinded for 1 minute or until the acid ends. There's a GM note for the three Interact actions, and the attack is subject to incapacitation.

**Census:** **344 enabled**, up from 341 (Attack and dependent result: 49 of 96, 47 left).
- The corpus diff against b45 changed exactly these 3 plans, with none lost.
- Variant plans are unchanged.
- The speed (after this entry), escape and six rule-family checks report 0 regressions.

**Still blocked nearby:**
- **Barbed Spear:** increases an existing clumsy condition, and the spear is removed by an Athletics check.
- **Tangle Vine:** a degree-chosen Effect, Escape ending a Speed penalty, and heightened durations by fixed rank.
- **Warshard Shot:** its AC penalty is linked to persistent damage but has no PF2e Effect.
- **Moonlight Ray:** its critical row names “fiend or undead” where its conditional damage names the unholy trait.
- **Sun Blade:** two trait-conditional extras and a sunlight die-size change.

## Evidence

**Automated:** 379/379 tests pass. `test/attack-condition-riders.test.js` covers:
- the rows and durations of all three spells, plus the empty-Target and triggering-target readings;
- the lone persistent component;
- the linked Blinded and the removal reminder's text;
- **refusals:**
  - a critical hit doubling a different damage type;
  - a non-cosmetic trailing sentence;
  - a triggering Target whose attack doesn't name it;
  - “for the duration” without the spell-ending sentence;
  - a removal reminder without a linked condition.

[Live evidence](phase-4-attack-condition-riders-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `attackConditionRiders`:
- **Inkshot:**
  - Critical hit: rolled 3, the target lost 6, and got Dazzled for 1 minute.
  - Hit: rolled 7, the target lost 7, and got Dazzled for 1 round.
  - Miss: no damage and no Effects.
- **Brine Dragon Bile:**
  - Hit: `2d6 acid` persistent damage and no immediate HP loss.
  - Critical hit: `2 * 2d6 acid`.
- **Blinding Foam, hit:**
  - The target lost 24 (the roll), and got `1d6 acid` persistent damage and “Blinding Foam: Blinded (while taking persistent acid damage)” (1 minute, `persistentLink` acid).
  - The card showed the 3-Interact removal note.
  - Deleting the persistent acid removed the Blinded Effect.
- **Incapacitation:**
  - Against a level-12 creature: 22 against AC 20 (natural 8) was recorded as a miss, one degree below the hit.
  - Against a level-9 creature: 34 (natural 20) stayed a critical hit.
- **Regressions:** `spellAttack`, `persistentLinked`, `attackComponents`, `attackRowRules` and `attackAdjustments` were rerun, and all passed. Cleanup left no fixtures.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b46
node tools/diff-compiled-plans.mjs /tmp/phase23-b45/official-spell-compiler-report.json /tmp/phase23-b46/official-spell-compiler-report.json
node tools/report-enabled-spells.mjs /tmp/phase23-b46/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b46/official-spell-compiler-report.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/phase23-b46/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `attackConditionRiders`, then `cleanup`.
