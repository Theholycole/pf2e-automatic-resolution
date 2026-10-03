# Spell-attack variants that carry a choice — verification

2026-09-26. This batch continues Phase 4's largest group, **Attack and dependent result** (72 blocked at the start).

The group is now mostly Strike-based spells, reactions and multi-phase spells. Among the ordinary spell attacks left, the most common shared structure is **a PF2e variant that supplies what the text leaves to the caster**, which covers 7 spells. This batch adds that rule; four of those spells resolve with it. There's no spell-name dispatch. The save card is unchanged; these are compiler rules.

## Compiler (`src/compiler/spell-attack-table.js`)

**Choices the variant supplies:**
- **Type lists:** “XdY a, b, or c damage—as appropriate for …” reads as the variant's type. The variant's one damage entry must have a listed type and the stated dice.
- **Material paragraphs:** these add no rule, because the variant's damage entry carries the material, which PF2e's roll applies:
  - “The <x> impart any special properties of the metal that forms them; …”
  - “All the <x> are made of the same metal, and the metal returns to you after the attack.”

**Clarifications with no rule:** “No specific traits or magic properties of the <x> affect the attack or the damage.”

**Action-count paragraphs (`variantParagraphs`):**
- Paragraphs beginning with an action glyph must read “This spell has a range of N feet( and deals half damage on a failure (but not a critical failure)( as …)).”.
- The cast variant's paragraph must exist and give its range. A half-damage paragraph gives a half-damage Failure row, with Critical Failure unaffected.
- Other action counts' paragraphs, and “One/Two/Three Rounds” paragraphs, describe other variants and are set aside.
- An item with action paragraphs but none for its own Time (the base item) is refused, and so is any paragraph that doesn't read this way.
- The intro sentence “The number of actions you spend when Casting this Spell determines its range (as well as other parameters).” is claimed only when such paragraphs exist.

**The melee option:** “If the target is within your melee reach, you can choose to make a melee spell attack … which increases all the spell's damage dice to d6s.” is accepted only on the ranged variant. That means range not touch, and dice not already the melee size. The melee variant is refused, because its critical persistent die isn't stated in the rows.

**Other accepted wording:**
- “Make a spell attack roll against the target's AC, dealing XdY type damage on a hit.” and “If you hit / On a hit / On a success, you deal XdY type damage.” before a written table;
- “The needles deal …” (plural) and “… and might cause bleeding” in the damage sentence;
- rows “You deal double/full damage.”;
- “N Bulk or less” in the narration;
- critical rider “the target takes double damage and is <condition>”.

## Coverage

**New:**
- **Telekinetic Projectile:** the bludgeoning, piercing and slashing variants.
- **Needle Darts:** the plain, adamantine, silver and cold iron variants; the critical bleed reads `@item.level`.
- **Horizon Thunder Sphere:** the 2-action variant (critical Dazzled) and the 3-action variant (half damage on a miss).
- **Ignition:** the ranged variant; the critical 1d4 persistent fire heightens by 1d4 per rank.

**Still blocked, with reasons:**
- Ignition (Melee): its persistent die changes with the dice.
- Horizon Thunder Sphere (2 rounds): it adds an area save and an aura.
- Soul Cutter: PF2e's variants deal bludgeoning, but the text says spirit.
- Threefold Limb: forms with different riders (a Reposition, and concealment ending on Interact).
- Sun Blade: sunlight dice steps, trait-based spirit and vitality damage, and malformed variant defense data.

**Census:** **322 enabled** (Attack and dependent result: 28 of 96).

**Corpus diff:**
- Ignition and Needle Darts became executable, both as base items and as variants.
- 8 variant plans of Telekinetic Projectile and Horizon Thunder Sphere became executable.
- Nothing else changed. The speed, escape and rule-family regressions all show 0.

## Evidence

**Automated:** 349/349 tests pass.
- `test/attack-variant-choices.test.js`:
  - all Telekinetic Projectile variants, with the untyped base and an off-list type refused;
  - all Needle Darts variants, with an extra rule refused;
  - Horizon's 2- and 3-action rows, with the 2-round variant and a mismatched range refused;
  - Ignition's ranged variant heightening, with the melee variant refused.
- `test/homebrew-guide.test.js`: the guide's type-choice spell.

[Live evidence](phase-4-attack-variant-choices-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Telekinetic Projectile (Piercing), critical hit:** `2d6 piercing` = 3, and the target lost 6.
- **Needle Darts (Silver), critical hit on a creature with weakness 5 to silver:** `3d4 piercing` = 4, and the target lost 13 (2 × 4 + 5, so PF2e applied the variant's silver). It also gained persistent `1 bleed`.
- **Horizon Thunder Sphere:**
  - 2 actions, critical hit: 12, and the target lost 24 and got “Horizon Thunder Sphere: Dazzled”;
  - 3 actions, miss: 10, and the target lost 5.
- **Ignition (ranged), critical hit:** `2d4 fire` = 5, and the target lost 10 and gained persistent `1d4 fire`.
- **Regressions:** `spellAttack`, `actionVariants`, `silverDamage`, `attackComponents`, `splash`, `persistentLinked` and `forcedMovement` were rerun, and all passed. Cleanup left no fixtures.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `attackVariantChoices`, then `cleanup`.
