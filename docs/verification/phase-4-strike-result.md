# Strike results — verification

2026-09-26. This adds the mechanism for spell rules that depend on the caster's own Strike. The save card's check can now be `strike`: its result is read from PF2e's Strike attack message against the target, and the result's rows apply the spell's rider. There's no spell-name dispatch.

## Compiler (`src/compiler/strike-prelude.js`, `strikeResult`)

- **Accepted text:**
  - optional narration;
  - movement sentences before the Strike (“You Stride up to N feet.”, “This movement doesn't trigger reactions.”), which become card reminders;
  - “You can make a Strike at any point during your Stride.”;
  - one rider: “If (your|the) Strike hits( and deals damage), …, (dealing|the target takes) XdY type damage( and pushing it N feet (in a direction of your choice|away from you)).”
- **Item requirements:** one damage entry equal to the rider's dice and type, no defense, no area.
- **Result:** the defense becomes `{kind: "save", statistic: "strike"}`.
  - The table is: Critical Success and Success deal the rider's damage ×1 (it isn't the Strike's damage, so a critical hit doesn't double it), with the push as forced movement; Failure and Critical Failure do nothing.
  - “and deals damage” becomes a `gm-confirmed` target question.
- **`basic-save-core.js`:** a `strike` check needs `strikePrelude.result === true`.

## Runtime

- **Start:** a `strike` card needs exactly one target.
- **Read Strike Result (`rollSave`):** `findStrikeMessage` picks the caster's latest PF2e message with an `attack-roll` context and the `strike-attack-roll` domain, targeting the card's target, created after the card.
  - Its `context.outcome` is recorded like a spell attack's degree.
  - With no such message, the card says to make the Strike first.
  - A PF2e reroll is a later message, so it replaces the result.
- **`main.js`:** a save plan without PF2e's native save button now gets the module's own chat button, labelled **Resolve Strike Spell**, **Resolve Spell Attack** or **Prepare Saves**. This also gives Booming Blast, whose PF2e data has no save, its button.

## Coverage

**New:** Flowing Strike (Phase 7 Movement action).

**Census:** **326 enabled** (Movement action: 7 of 29). The corpus diff changed exactly this 1 plan. The speed, escape and rule-family regressions all show 0.

**Still unresolved, with reasons:**
- **Fulminating Impact:** Effects on the caster before and after the attack.
- **Tentacular Innervation:** Grabbed with a custom reach, severing, and Escape ending the spell.
- **Warding Aggression:** a token-marked Effect with per-turn upkeep.
- **Fractious Echo:** a spiritual echo creature.
- **Blink Charge:** self-damage on a critical miss, and teleports.
- **Shooting Star, Tracking Mayflies, Force Fling:** they change the Strike.

## Evidence

**Automated:** 358/358 tests pass.
- `test/strike-result.test.js`:
  - Flowing Strike's rows, push, GM question and reminders;
  - a wrong damage entry, an extra rule and a forged `strike` check refused;
  - `findStrikeMessage` picks the latest matching Strike, ignoring spell attacks, other targets, other casters and older messages.
- `test/homebrew-guide.test.js`: the guide's homebrew spell.

[Live evidence](phase-4-strike-result-live-results.json) on Foundry 14.367 / PF2e 8.5.0. The runs used a real PF2e Strike (the caster's melee item, targeted with `canvas.tokens.setTargets`, dialog skipped with shift).
- **Before the Strike:** Read Strike Result refused with “make … Strike against … with PF2e first”.
- **Against AC 1:** the Strike was a critical hit, and the GM question was pending until answered. The target lost 10, the wave's roll, not doubled. The card noted “pushed 10 feet.”
- **Against AC 60:** the Strike was a critical miss, and the target lost 0.
- **Regressions:** `strikePrelude`, `spellAttack` and `forcedMovement` were rerun, and all passed. One run needed a click on PF2e's damage dialog (“Always Show Dialog” is on in pftest); the harness now shift-clicks. Cleanup left no fixtures.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `strikeResult`, then `cleanup`.
