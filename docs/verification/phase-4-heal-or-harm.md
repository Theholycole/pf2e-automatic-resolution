# Heal or harm — verification

2026-09-26. This adds a shared heal-or-harm rule: one roll of void or vitality energy heals the creatures that energy heals (no save) and harms the others (basic save). There's no spell-name dispatch; Heal's existing immediate profile is unchanged and still takes precedence on its chat card.

## Compiler (`src/compiler/heal-or-harm.js`)

**Grammar:** the whole rules text must match, sentence by sentence:
- the narration “You channel void|vital energy to harm/heal the living or heal/damage the undead.”;
- a damage side, “If the target is (a) (willing) living|undead (creature), you deal XdY|that amount of void|vitality damage to it, and it gets a basic <save> save.”;
- a healing side, “If the target is …, you restore XdY|that amount of Hit Points.”;
- the action-count introduction, and the three action paragraphs: touch; “2 … a range of N feet. If you're healing a(n) <kind> creature, increase the Hit Points restored by M.”; and “3 … You disperse <energy> energy in a @Template[emanation|distance:D]. This targets all living and undead creatures in the area.”

The damage side must name the kind the energy harms (void: living; vitality: undead), and the healing side the other. Exactly one side gives the dice. The action-2 paragraph must heal the healed kind, and the action-3 energy must match.

**Per variant** (judged against the variant's own item data; the damage entry must be one entry of the energy's type):

| Variant | Required item data | Plan |
| --- | --- | --- |
| 1 action | range touch, no area, kinds damage+healing, the dice, the basic save | basic save, `resolution.dualMode: {energy}`, target rules left to the dual mode |
| 3 actions | emanation of D feet, kinds damage+healing, the dice, the basic save | the same, for each creature in the area |
| 2 actions, healing | no save, no area, range N feet, kinds healing only, dice + M | direct healing (`kind: "healing"`), target rule for the healed kind |
| 2 actions, damage | the basic save, no area, range N feet, kinds damage only, the dice | basic save, target rule for the harmed kind |

The base item (“1 to 3” actions) is left to its variants. The description is rewritten to the canonical sentence of its route, and `compilerEvidence.healOrHarm` records the mode, energy, action count and source text. Kind rules: living is `living-creature`; undead is `undead-or-void-healing`.

## Runtime

- **Executable check (`basic-save-core.js`):** `dualMode` is accepted only with `energy` void or vitality, one PF2e item damage entry of that type, the compiler's `healOrHarm` dual evidence, and no conditional damage or caster benefit.
- **Classification (`dualEnergyMode`):** void heals undead and void-healing creatures and harms other living creatures. Vitality does the reverse. Constructs and non-creatures are unaffected (marked unaffected with a reason). Each target's `mode` is set when it's added to the card.
- **Save card:** healed targets don't take part in the save (`targetParticipates`), have no roll button, and read “Healed — no save; restores the spell's roll … at Finalize”. The shared roll is required even when every target is healed.
- **Finalize:** harmed targets are resolved as usual. Then each healed target regains the shared roll's total through `applyDamageWithReceipt` (negative damage, no IWR), with its HP before and after recorded. An already-applied target is skipped on retry. The result card shows “Healed N HP (before → after)”.

## Coverage

**New:** Harm (1 action, 3 actions, 2 actions vs. Undead, 2 actions vs. Living). Heal's four variants also compile to the same routes, but Heal's chat card still uses its immediate profile.

**Still blocked, with reasons:**
- Lay on Hands and Touch of the Void: a healing or damage mode plus an Effect whose application depends on whether the target is yourself.
- Heartbolt: a secondary emanation.
- Soothing Mist: a choice to remove persistent damage.

**Census:** **308 enabled** (Healing / recipient mode: 11 of 60). The corpus variant diff changed only Harm's and Heal's 8 variants. Base plans are unchanged (0 changed of 1,994). The speed, escape and rule-family regressions all show 0.

## Evidence

**Automated:** 319/319 tests pass.
- `test/heal-or-harm.test.js`: every Heal and Harm variant compiles to its route and is executable; the base isn't automatic; a mismatched damage type, a 2-action healing without the extra, an extra rule, and a dual mode without evidence are refused; classification covers living, undead, construct and void-healing creatures; healed targets don't take part and still need the roll.
- `test/homebrew-guide.test.js`: the guide's homebrew heal-or-harm spell (2d6, 60 feet, +6, 15-foot emanation) resolves in all four variants.

[Live evidence](phase-4-heal-or-harm-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Harm, 1 action:** a living creature, an undead and a construct. The modes were damage / healing / unaffected. The healed row had no roll button. The roll was `1d8 void` = 7: the living creature lost 7 on a failure, the undead gained 7, and the construct was unchanged.
- **Harm, 3 actions:** the roll was 2. The living creature lost 4 on a critical failure, and the undead gained 2.
- **Harm, 2 actions vs. Undead:** `1d8 + 8 void` = 15 healed the undead by 15. A living target was refused (“requires an undead creature or one with void healing”).
- **Harm, 2 actions vs. Living:** no dual mode; an undead target was unaffected (“requires a living creature”).
- **Heal, 1 action (shared route):** `1d8 vitality` = 4. The living creature gained 4, and the undead lost 2 on a success. On the save card, the living row read “Healed 4 HP (300 → 304)” with no roll button, and the undead row had its roll button.
- **Regressions:** `directHealing`, `actionVariants`, `conditionalDamage` and `enemies` were rerun, and all passed. Cleanup removed every fixture.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `healOrHarm`, then `cleanup`.
