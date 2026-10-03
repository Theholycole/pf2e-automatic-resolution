# Persistent-linked lifetimes — verification

2026-09-26. This adds a shared lifetime: a condition or Effect that lasts exactly as long as the target takes a spell's persistent damage of one type. There's no spell-name dispatch.

## Compiler

**`spell-attack-table.js`: condition sentences.** These are read in one-sentence attacks:
- “(Additionally,) the target is <condition> until they/it recover(s) from / remove(s) their/its/the persistent <type> damage.”
- The condition joins the Critical Success and Success rows.
- The type must name exactly one persistent entry of the spell.
- Only the plain hit/critical forms carry it. Every other one-sentence form refuses a spell that has the sentence, so it's never silently dropped.

**New forms:**
- “…, dealing <damage> on a hit.” (a spell attack's critical hit deals double damage);
- “(or double damage on a critical hit)”;
- “double damage, both initial and persistent” in a row (a restatement).

**Effect sentences.** These are read in a written table's preamble:
- “As long as the target is taking (this) persistent (<type>) damage (from this spell), <what it does>.”, followed by a Spell Effects link.
- The Effect goes on the Critical Success and Success rows with the proof `outcomeRule: {kind: "persistent-linked-effect", degree, damageType, claimText}`.

**`compile-ability.js` (`attachPersistentLinks`).**
- Each linked row must deal the persistent entry of that type.
- A condition must be the row's only condition, with no duration. It gets `endsWhen: {event: "persistent-damage-ended", damageType}` and `expirationMode: "event"`.
- An Effect must resolve in the catalog.
- Anything else leaves a `persistent-link:*` pending capability, which blocks the plan.

**Checks:**
- `basic-save-core.js` accepts the lifetime with `isPersistentLinkedLifetime`.
- `native-outcome-effects.js` accepts the Effect proof only on hit rows, only when the live Effect's mechanics equal the compiled ones, and only when `inspectLinkedEffectClaim` passes:
  - the Effect's duration is unlimited;
  - every FlatModifier is stated (“a –1 status penalty to saves”);
  - every EphemeralEffect on the origin is stated (“creatures gain a +1 status bonus to attack rolls … against the target”);
  - any other rule refuses the Effect.
- `validate-plan.js` allows this proof on critical success.

## Runtime

- **The card snapshot** keeps the lifetime. Before this fix, an unknown lifetime was dropped and the condition would have lasted forever; the live test caught it.
- **Condition Effects** from the card have an unlimited duration, the name suffix “(while taking persistent <type> damage)”, a description line, and `outcomeEffect.persistentLink`. Native Effects carry `runtime.persistentLink`.
- **After damage:** a linked item is created only if the creature now has persistent damage of that type. Otherwise the result card notes “… not applied: the creature isn't taking persistent <type> damage.”
- **`scripts/persistent-link-runtime.js`:**
  - When a persistent-damage condition is deleted and none of that type remains, it removes that creature's linked items.
  - It does the same check once when the world loads.
  - Only the lead active GM acts.
  - The ongoing cast record ends with reason `persistent-damage-ended`.

## Coverage

**New:**
- **Sticky Fire:** Enfeebled 1 until the persistent fire ends.
- **Widow's Bite:** Enfeebled 1 until the persistent poison is removed.
- **Charged Javelin:** its Effect lasts while the persistent electricity does.

**Census:** **316 enabled** (Attack and dependent result: 22 of 96). The corpus diff changed exactly these 3 plans. The speed, escape and rule-family regressions all show 0.

**Still blocked:** Warshard Shot. Its persistent-linked “–1 status penalty to its AC” has no PF2e Effect, and it comes from a critical row's inline persistent roll.

## Evidence

**Automated:** 333/333 tests pass.
- `test/persistent-linked.test.js`:
  - both conditions and their lifetimes;
  - a mismatched type refused, and the linked sentence not dropped by other forms;
  - Charged Javelin's Effect proof, which holds on hit rows only;
  - claim checks against the Effect: a wrong value and a timed Effect are both refused;
  - the Effect missing from the catalog, refused;
  - the runtime helpers.
- `test/spell-attack.test.js`: no longer lists Sticky Fire as blocked.
- `test/homebrew-guide.test.js`: the guide's homebrew spell.

[Live evidence](phase-4-persistent-linked-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Sticky Fire, hit:**
  - Before recovery: persistent `1d8` fire, Enfeebled 1, and the Effect “Sticky Fire: Enfeebled 1 (while taking persistent fire damage)”.
  - After the persistent condition was removed, Enfeebled was 0 and no linked Effect remained.
  - A fire-immune target got no persistent damage and no Enfeebled, and its note read “Enfeebled 1 not applied: the creature isn't taking persistent fire damage.”
- **Widow's Bite, critical hit:** persistent `2 * 3d4` poison and Enfeebled 1. After removal, Enfeebled was 0.
- **Charged Javelin, hit:** persistent electricity and “Spell Effect: Charged Javelin”. After removal, the Effect was gone.
- **Ongoing records:** all three casts ended with status `ended` and entry reason `persistent-damage-ended`, with none flagged for review.
- **Regressions:** `attackComponents`, `selfConditional`, `sustainedConditions`, `compact`, `conditionalDamage` and `spellAttack` were rerun, and all passed. Cleanup left no fixtures.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `persistentLinked`, then `cleanup`.
