# Damage typed by a sorcerer bloodline — verification

2026-09-26. This batch works on Phase 4's largest group, **Attack and dependent result** (46 blocked).

## Choosing the batch

Healing's remaining 34 spells are one-offs:
- Effect-carried fast healing;
- triggered self-heals;
- area splits;
- reactions with their own rules.

In Attack, the one shared rule is damage whose type PF2e takes from the caster's sorcerer bloodline:
- the Draconic bloodline's type, applied by the item's own rule;
- the Elemental bloodline's own alteration of PF2e's listed spells.

The same rule blocks two Phase 2 basic saves, so the whole family is taken together, as the rule-family approach requires. There's no spell-name dispatch.

## Compiler

**`src/compiler/bloodline-damage.js`** claims the sentence together with the PF2e mechanism that makes it true.

| Sentence | Required mechanism |
| --- | --- |
| “The damage type depends on the magical tradition related to the dragon that influenced your bloodline.” | An untyped entry, and the item's DamageAlteration: override, `damage-type`, `spell-damage`, value `{actor|flags.system.dragonBloodline.damageType}`, predicate `item:slug:<slug>`. |
| “This spell deals damage according to your elemental influence (for instance, slashing for air or fire for fire) and has your element's trait.” | An untyped entry, and no item rules. PF2e's Elemental bloodline carries a DamageAlteration and a trait ItemAlteration for `elemental-toss` and `elemental-blast`. |
| “On a hit, the creatures takes 1d8 slashing plus 1d4 additional damage of a type determined by the magical tradition related to the dragon that influenced your bloodline: arcane force, divine spirit, occult mental, or primal fire.” | The entry is the typed part. The item's DamageDice must have the same die, the `dragonBloodline` type, the `spell-damage` selector and the slug. With the heightened sentence, it scales with `@item.level` (rank 1). |

- The claimed rule leaves the list of item rules, so an unknown rule still blocks the spell.
- The plan gets `resolution.bloodlineDamage`.
- `executableBloodlineDamage` accepts it only with PF2e item damage, and only untyped components for a type rule.

**New general readings:**
- **`area-choice.js`:** an Area paragraph of `@Template` shapes, plus “in one of the various listed shapes of your choosing”, becomes an `area-choice` card reminder. The item must have no area. “30 feet (burst only)” is shown with the burst.
- **Targets close together:** `target-predicate-compiler.js` reads “2 creatures no more than 10 feet from each other” as `mutualWithin: 10`.
- **The attack table:**
  - accepts “against each creature”;
  - accepts the shared-penalty sentence between the attack and its hit sentence;
  - accepts `N creatures no more than X feet from each other` as several targets.

## Runtime (`basic-save-runtime.js`)

- **Start:**
  - A caster without the bloodline choice (`flags.system.<flag>.damageType`) is refused.
  - With `mutualWithin`, every pair of target tokens must be within that distance.
- **Damage roll:** PF2e's roll must include the bloodline's type, and have no untyped part for a type rule. Otherwise nothing is recorded.

## Coverage

**New:**
- **Dragon Breath** (Phase 2 basic save).
- **Elemental Blast** (Phase 2 basic save, with the area choice).
- **Elemental Toss** (spell attack).
- **Flurry of Claws** (two attacks with one penalty, the bloodline's extra dice, targets within 10 feet).

**Census:** **387 enabled**, up from 383.
- Attack and dependent result: 52 of 96, 44 left.
- Phase 2: 204 of 588.
- The b58 corpus diff against b57 changed exactly these 4 plans.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 418/418 tests pass.

`test/bloodline-damage.test.js`:
- **Dragon Breath:** the route, plus refusals for a different flag and for no rule.
- **Elemental Blast and Elemental Toss:** routes, the area reminder, and refusals for a typed entry and for a list without “of your choosing”.
- **Flurry of Claws:** the extra dice, the shared penalty and target spacing, plus a refusal for a different die.
- **Runtime helpers:** `bloodlineDamageType` and `bloodlineRollMatches`.

`test/homebrew-guide.test.js` compiles the guide's Draconic example.

[Live evidence](phase-4-bloodline-damage-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `bloodlineDamage`:
- **The caster:** a level-10 character holding PF2e's “Bloodline: Draconic (Divine Dragon)” and “Bloodline: Elemental (Fire)”, with the choices preset on the ChoiceSet rules.
- **Dragon Breath at rank 5** (focus spells heighten to half level): PF2e rolled `9d6 spirit` (30). Two creatures failed, and each lost 30.
- **Elemental Blast:** PF2e rolled `8d6 fire` (32). A success lost 16. The card showed the area choices, and PF2e gave the spell the fire trait.
- **Elemental Toss:** `5d8 fire` (26). A critical hit lost 52.
- **Flurry of Claws:**
  - `5d8 slashing + 5d4 spirit` (31); a hit lost 31 and a critical hit lost 62.
  - Both targets had attack number 1.
  - Targets 25 feet apart were refused (“more than 10 feet from each other”).
- **No bloodline:** an NPC casting Dragon Breath was refused (“has no draconic bloodline choice in PF2e”).
- **Regressions:** `spellAttack`, `actionVariants`, `attackComponents`, `attackRowRules`, `energyByCreature` and `persistentOnce` all passed. Cleanup left no fixtures.

**Note:** a probe showed that PF2e silently drops class features added to an NPC, so the bloodline caster is a character.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b58
node tools/diff-compiled-plans.mjs /tmp/phase23-b57/official-spell-compiler-report.json /tmp/phase23-b58/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b58/official-spell-compiler-report.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/phase23-b58/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `bloodlineDamage`, then `cleanup`.
