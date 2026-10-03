# Direct healing — verification

2026-09-26. This adds a shared healing application to the Effect route. There's no spell-name dispatch; the existing Heal adapter (an immediate-runtime profile) is unchanged.

## Compiler (`src/compiler/healing-compiler.js`)

**Accepted spells:** no save, no area, exactly one damage entry whose kinds are only `healing`, and one of these sentences:
- “The target regains XdY(+N) Hit Points (when you Cast the Spell)(, and <rest>).”;
- “You restore XdY Hit Points to your animal companion / the target.”;
- “You heal a(n) <creature>'s wounds, restoring XdY Hit Points to the target.”

The dice must be the healing entry.

**Other text:**
- **With a linked Effect:** the “and <rest>” clause and any other sentences go to the Effect's completeness check (the Effect link is taken out of the prose first).
- **Without one:** everything else must be narration.

**Action counts:** “The number of actions you spend / spent Casting this Spell determines …”, “1 … a range of touch.”, and “2 … a range of N feet and restores an additional M Hit Points to the target.” are accepted only on a PF2e variant whose Time is exactly `1` or `2`. The 2-action variant's healing must be the dice + M. A base item still offering “1 or 2” actions is refused; a variant must be cast.

**Results:**
- **No Effect:** `resolution.kind: "healing"` with `healing: {formula, damageType, recipient}` (recipient: target, or the caster when there's no Target).
- **With an Effect:** the direct-effect plan gains `resolution.healing`.

**Target compiler:** `1 willing living animal` gives the animal-trait and living-creature rules.

## Runtime (Effect route)

- **Healing:** `healing` is a supported resolution kind. The spell's own PF2e damage roll (`getDamage`, so the variant and the rank are included) is rolled once and posted, then applied to each recipient as negative damage through `applyDamageWithReceipt`. PF2e's receipt records the HP actually restored.
- **Recipients:**
  - The plan's target rules apply (e.g. animal, living).
  - Vitality healing refuses undead, void-healing creatures and constructs. Void healing refuses creatures without void healing.
  - Healing a creature requires permission to update it.
- **With an Effect:** the Effect is applied first, then the healing, to the same recipients.
- **Chat card:** a healing plan's button reads **Resolve Healing**.
- **Variants:** a base card of a spell with variants lists the automated variants (healing variants included) instead of resolving the base item. The census counts a spell whose variants resolve on the Effect route.

## Coverage

**New:**
- Heal Companion and Heal Animal (1-action: 1d10 / 1d8; 2-action: +8);
- Soothe (1d10+4 plus its Effect).

**Still blocked, with reasons:**
- Necromancer's Generosity: an unscoped Effect, and the target “an undead minion you control”.
- Unblinking Flame Aura: inline healing, and an aura Effect.
- Heal-or-harm spells (Harm, Heartbolt, Soothing Mist, Lay on Hands, Touch of the Void): two modes chosen by the target.
- Rebuke Death, Let Not the Fallen Rest, Lively Flight, Luminous Stardust Healing, Delay Affliction, Harmonize Self: dying rules, free movement, counteracting, choices.
- Triggered or reaction healing: Breath of Life, Hero's Defiance, Life Siphon.
- Healing from consumables: Cornucopia, Nature's Bounty, Bounty of the Sky, Soothing Spring.

**Census:** **307 enabled** (Healing / recipient mode: 10 of 60). Only Heal Animal, Heal Companion and Soothe changed, and all family regressions show 0.

## Evidence

**Automated:** 315/315 tests pass. `test/direct-healing.test.js` covers:
- both variants of Heal Companion and Heal Animal, with a wrong 2-action healing refused and the base item refused;
- Heal Animal's target rules;
- Soothe's healing and leftover clause;
- mismatched dice and an extra rule without an Effect, both refused.

[Live evidence](phase-4-direct-healing-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Heal Companion, 2-action variant:** the roll was `1d10 + 8` = 16, and the animal gained 16 HP.
- **Soothe:** the target was healed by the roll (5) and received “Spell Effect: Soothe”.
- **Heal Animal:** refused a non-animal (“requires the animal trait”) and an undead hound (“requires a living creature”); neither's HP changed.
- **Real chat cards:** the 2-action Heal Companion card showed **Resolve Healing**. The base card showed PF2e's variant buttons and “Choose a variant above; … (automated: 2 actions, 1 action)”.
- **Regressions:** the duration-bound and reaction Effect cases were rerun.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `directHealing`, then `cleanup`.
