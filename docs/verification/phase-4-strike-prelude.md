# Strike-prelude spells — verification

2026-09-26. This adds the first rule for spells that include a Strike.

**How it works:** the caster makes the Strike with PF2e as usual, and PF2e rolls and applies its damage. The module resolves the rest of the spell, which doesn't depend on the Strike's result. Additional damage on a hit joins the Strike's own damage roll through a generated PF2e damage-dice Effect. There's no spell-name dispatch.

**Scope:** 3 of the group's Strike-based spells. The others change the Strike itself (range, damage type, multiple attack penalty, concealment, reach) or depend on its result, so they stay unresolved (listed below).

## Compiler (`src/compiler/strike-prelude.js`)

- **Requirements:** PF2e repeats the item's Requirements at the start of the description. That copy is dropped only when it equals the Requirements field.
- **Strike sentence:** exactly one, from:
  - “Make a melee Strike (with your two-handed weapon | against a creature in your reach)(; if you hit, you deal an additional XdY type damage).”
  - “Make a ranged (firearm) Strike.”
  - At most two sentences may mention a Strike.
- **Narration before the Strike** must carry no rule words (digits, damage, save, bonus, penalty, Strike, condition, immune). It isn't compiled.
- **After the Strike:**
  - “Regardless of the result (of your Strike), ” is removed.
  - The area subject must be the item's own area (“a 15-foot cone from you”, “a 20-foot emanation around you”, “that cone”) and becomes “the cone” / “the emanation”.
  - “… must attempt a basic <save> save against your spell DC or take N type damage” becomes a basic-save damage sentence.
  - “against your spell DC” is removed before a one-sentence degree table.
  - Placement sentences (“The target of your Strike must be within the cone or the effect fails.”, “that creature becomes the point of origin of a 15-foot cone, aimed directly away from you.”) become `strike-placement` reminders.
  - The ordinary save compilers judge everything else, so an unknown rule blocks the spell.
- **Save from the text:** when the item has no defense, the text's one stated save (“must succeed at a Will save”) is the spell's save.
- **Targeting:** when the Target field names the Strike's target (“1 creature within reach”), the save's recipients are the area's creatures.
- **`compile-ability.js`:** a save-route plan gets `resolution.strikePrelude` (reach, weapon, source text, optional `extraOnHit`) and a `strike-prelude` reminder. `basic-save-core.js` accepts `strike-prelude` / `strike-placement` reminders only on such plans.

## Runtime

- **The card** shows “**Strike:** <sentence> Make it with PF2e's own Strike; PF2e rolls and applies its damage.” plus any placement reminder, then resolves the save like any other.
- **`extraOnHit`:** when the card starts, `scripts/strike-prelude-runtime.js` creates a caster Effect.
  - It holds `DamageDice` on `melee-strike-damage` (or `ranged-strike-damage`), lasting until the end of the turn.
  - Because the dice are part of the Strike's own damage roll, they combine with it before resistances and double on a critical hit.
  - A `createChatMessage` hook removes the Effect after the caster's next Strike damage roll whose domains include its selector (`flags.pf2e.strike` and the `strike-damage` domain).

## Coverage

**New:**
- **Booming Blast:** each enemy in the 20-foot emanation makes a Will save: Frightened 1, or Frightened 2 on a critical failure.
- **Thunderous Strike:** each creature in the 15-foot cone makes a basic Fortitude save against 2 sonic, and a critical failure knocks it Prone; the placement reminder is shown.
- **Pulverizing Wake:** the cone takes 6d8 sonic (basic Fortitude), and the Strike gets +3d8 sonic on a hit.

**Census:** **325 enabled** (Attack and dependent result: 31 of 96). The corpus diff changed exactly these 3 plans. The speed, escape and rule-family regressions all show 0.

**Still unresolved Strike-based spells:**
- **Change the Strike:** Force Fling (range and MAP), Shooting Star and Tracking Mayflies (concealment, cover, range), Sky Laughs at Waves (a Fly first), Shielding Strike (a Raise a Shield / Shield choice).
- **Two Strikes:** Spinning Staff.
- **Depend on the Strike's result:** Tentacular Innervation, Warding Aggression, Touch of Death.
- **Strike-modifying Effects on the caster:** Fulminating Impact, Inner Upheaval.
- **Other creatures' Strikes:** Thrall Charge, Companion's Shadow, Establish Ward.

## Evidence

**Automated:** 354/354 tests pass.
- `test/strike-prelude.test.js`:
  - Booming Blast's Will table, enemy rule and reminder;
  - Thunderous Strike's Prone rider and placement reminder;
  - Pulverizing Wake's on-hit dice and area recipients;
  - Strike-changing spells and a result-dependent spell refused;
  - a forged reminder kind and an extra rule refused;
  - the rider Effect's source and the reminder HTML.
- `test/homebrew-guide.test.js`: the guide's homebrew spell.

[Live evidence](phase-4-strike-prelude-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Booming Blast:** the card showed the Strike reminder. The two enemies became Frightened 1 (failure) and Frightened 2 (critical failure). An allied creature was unaffected (“an ally of the caster, not an enemy”).
- **Thunderous Strike:** a failure lost 2, and a critical failure lost 4 and was knocked Prone.
- **Pulverizing Wake, rank 5:**
  - The cone target lost the rolled 21 on a failure.
  - The caster got “Pulverizing Wake: additional damage on this Strike” (DamageDice 3d8 sonic on `melee-strike-damage`).
  - The caster's next Strike damage roll was `1d6 slashing + 3d8 sonic`. PF2e's damage dialog listed “additional damage on this Strike 3d8”; the pftest GM has “Always Show Dialog” on, so the dialog was confirmed by clicking Roll.
  - Afterwards the Effect was gone.
- **Regressions:**
  - `enemies`, `splash`, `spellAttack` and `sustainedConditions` were rerun, and all passed.
  - `compact` failed once when it ran straight after `enemies`: that case's tokens were inside compact's line region. It passed when rerun after a cleanup.
  - Cleanup left no fixtures.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `strikePrelude`, then `cleanup`. The Strike damage dialog needs a click when PF2e's “Always Show Dialog” is on.
