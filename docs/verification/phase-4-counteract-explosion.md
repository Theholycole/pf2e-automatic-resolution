# Counteract family (part 8): lost-slot rank and explosions — verification

2026-09-26. This continues the counteract family with two spells whose counteract carries a further rule:
- **Elemental Counter:** the counteract rank is the rank of a spell slot the caster gives up, and the element of that slot must counter the triggering spell's element.
- **Detonate Magic:** a successful counteract sets off an explosion that's a basic Reflex save.

## Compiler

**Elemental Counter:**
- “You lose your spell slot as if you had cast the triggering spell.” becomes `costSlot`.
- “You then attempt to counteract the triggering spell, using the rank of the spell you lost for the counteract rank.” becomes a `triggering-spell` counteract with `rankFromLostSlot`.
- “You can lose a plant or wood spell to counter earth, …” becomes `elementCycle` (earth ← plant/wood, water ← earth, fire ← water, metal ← fire, plant/wood ← metal).
- The three come together or not at all. The Trigger and Requirements lines are shown to the caster.

**Detonate Magic** (Target `1 magic item or spell effect`):
- “You attempt to counteract the target.” becomes a `spell-effect` counteract with other targets.
- “If the attempt succeeds, an explosion of magical force deals 8d6 force damage with a basic Reflex save.” becomes `explosion`.
- The item sentence becomes `counteractOutcome` (success: deactivated for 1 week; critical success: destroyed; the explosion is a 5-foot emanation from the item). The spell sentence becomes `explosionNote`.
- `compile-ability.js` compiles the explosion sentence alone (with the item's damage entry, basic Reflex save, and a 5-foot emanation) as `explosionPlan`. It must be an automatic basic save matching the item's damage and save.
- A spell with such an explosion goes to the care route before the basic-save branch.

## Runtime (`affliction-care-runtime.js`)

- **Elemental Counter:** the dialog asks for the triggering spell's element and the element and rank of the spell lost. A pair outside the cycle is refused. The card says to expend that slot, and the check uses the lost rank.
- **Detonate Magic:**
  - **Against a spell effect on a creature:** the Effect is deleted and the spell note shown.
  - **Against an item or area** (no creature): the item outcome for the degree is shown.
  - **Either way:** the explosion's save card opens (`basicSaves.start` with `explosionPlan`) for `explosionTargets` or the GM's targets. With no targets, the card says to target the creatures and cast the save.

## Coverage

**New:** Elemental Counter, Detonate Magic.

**Census:** 379 enabled (Counteract: 17 of 22).
- The corpus diff against b54 changed exactly these 2 plans.
- The speed, escape and six rule-family checks report 0 regressions.

**Left in the family:**
- Planar Tether (a save decides the ward's duration);
- Quench (fire creatures in a sustained area plus one magical fire);
- Swallow Light (a counteract that grants a breath weapon);
- Thief of Fortune (copying a spell effect, duration halved);
- Umbral Graft, Seize Soul;
- counteracts inside area spells on other routes.

## Evidence

**Automated:** 405/405 tests pass. `test/counteract-care.test.js` covers:
- the plans, the elemental cycle, and the explosion's compiled basic Reflex plan;
- **refusals:** a damage type that doesn't match the explosion, and a missing cycle sentence.

[Live evidence](phase-4-counteract-explosion-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `counteractExplosion`:
- **Elemental Counter:**
  - Losing a rank-4 water slot against a rank-3 fire spell gave the note “… loses a rank 4 water spell slot (as if casting it)”, the check “rank 4 vs 3”, and “Test fireball is counteracted”.
  - Losing a fire slot against fire was refused.
- **Detonate Magic against a spell buff on a creature:**
  - The buff was counteracted and deleted.
  - The explosion card had 2 targets.
  - Both failed their saves and lost 37 (the roll), matching the card's total.
- **Detonate Magic against an item:** a critical success read “Test wand is counteracted: it's destroyed; the explosion is a 5-foot emanation from it.”, and the explosion card opened for 1 creature.
- The spell-effect note was reworded afterwards (“The spell's effect ends; …”, without “If it's a spell, …”). The compiled plan otherwise didn't change.
- **Regressions:** `counteractSpells`, `counteractCare` and `care` were rerun, then cleanup.
