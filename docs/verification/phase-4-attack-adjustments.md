# Target-dependent attack adjustments — verification

2026-09-26. This batch continues Phase 4's largest group, **Attack and dependent result**.

It adds spell attacks whose bonus depends on the target. The GM answers a question for each target on the card, and the answer is added to that target's spell attack roll as a PF2e modifier. It can also enable a persistent rider on a hit. A cover and concealment rule becomes a card reminder. There's no spell-name dispatch.

## Compiler (`src/compiler/spell-attack-table.js`, `attackAdjustments`)

- **After the attack sentence (“…; if the target …”):**
  - “if the target is wearing metal armor or is made of metal, you gain a +N circumstance bonus to your attack roll with …” asks “Is the target wearing metal armor or made of metal?” with the choices Yes (+N circumstance) / No.
  - “if the target has any circumstance bonuses to AC (such as from a shield or cover), reduce that bonus by N for this attack” offers None / +1 / … / +N or more, as an untyped modifier. The attack's gain is the reduction, which is at most N and at most the target's bonus.
  - Any other “; if the target …” clause is refused.
- **Standalone sentence:** “If the target is wearing metal armor or is made of metal, you gain a +N circumstance bonus to your attack roll with …, and the target also takes @Damage[…persistent…] damage on a hit.”
  - It sets `onApplies` (the formula may read only the cast rank).
  - It must be followed by “On a critical hit, double the initial damage, but not the persistent damage.”
  - It's read only in the one-sentence forms.
- **Cover sentence:** “This attack ignores the target's Concealed condition and ignores all cover except greater cover.” becomes an `attack-cover` reminder. The link shows as plain text, and a Heightened entry that changes the rule (“ignores cover completely”) is named with its rank.
- **New wording:**
  - “On a hit, the target takes <damage>, or double damage on a critical hit.”
  - “On a hit, the target takes <damage>.” and “If you hit, the <x> deals <damage>.” (a spell attack's critical hit deals double);
  - the Target “1 creature or object” (the card resolves creature targets).
- **Checks:** `compile-ability.js` puts the adjustment in `resolution.attackAdjustment`. `basic-save-core.js` requires:
  - a spell attack;
  - a question;
  - `circumstance` or `untyped`;
  - whole-number choices from 0 to 4;
  - for `onApplies`, a `[persistent,type]` formula reading only `@item.rank` / `@item.level`.

## Runtime

- **Start:** each target starts with a pending question. The card shows the question with one button per choice (`correctTarget` action `attack-adjustment`) and then “GM answered: …”. An answer is refused once that target's attack is rolled.
- **Rolling:** `rollSave` refuses to roll a target's attack until its question is answered. A non-zero answer is passed to `spell.rollAttack` as `new game.pf2e.Modifier({slug: "spell-attack-adjustment", modifier, type})`.
- **`onApplies`:** becomes a `conditionalDamage` entry with `gate: "attack-adjustment"` and `doubles: false`. It's rolled once if any answered target is hit, and applied only to those targets, unscaled by a critical hit.
- **Reminders:** `attack-cover` reminders say “Leave the target's cover and concealment out of this attack yourself”.

## Coverage

**New:**
- **Magnetic Acceleration:** +1 against metal, and two damage entries.
- **Shocking Grasp:** +1 against metal, plus persistent electricity on a hit, not doubled.
- **Phase Bolt:** it reduces the target's circumstance bonus to AC by up to 2.
- **Boomerang Shot:** the cover and concealment reminder.

**Census:** **333 enabled** (Attack and dependent result: 38 of 96). The corpus diff changed exactly these 4 plans; the first draft briefly broke Acid Arrow's sentence, which was fixed and is covered by tests. The speed, escape and rule-family regressions all show 0.

## Evidence

**Automated:** 366/366 tests pass.
- `test/attack-adjustments.test.js`:
  - the four plans, their choices, modifier types, gated formula and reminder text, and the reminder HTML;
  - a gated persistent without its “not the persistent damage” line refused, and an out-of-range choice refused;
  - the GM answer, including a refusal after the roll and an unknown value.
- `test/homebrew-guide.test.js`: the guide's homebrew metal-bonus spell.

[Live evidence](phase-4-attack-adjustments-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Every card** refused to roll the first target's attack before the GM answered (“answer the GM question for … before rolling the attack”).
- **Magnetic Acceleration:** the metal target's attack modifier was 15 against 14 for the other target. Both hit and lost 23.
- **Shocking Grasp, both critically hit:**
  - The attack modifiers were 15 and 14.
  - Both lost 38, which is 2 × 19 for the initial damage.
  - Only the metal target got persistent `(1d4 + 0) electricity`, not doubled.
- **Phase Bolt:** with +2 answered for the shielded target, its modifier was 16 against 14.
- **Boomerang Shot:** the card read “GM: This attack ignores the target's Concealed condition and ignores all cover except greater cover. Heightened (9th): it ignores cover completely. Leave the target's cover and concealment out of this attack yourself …”. The hit dealt 47.
- **Regressions:** `spellAttack`, `attackComponents`, `persistentOnce` and `conditionalDamage` were rerun, and all passed. Cleanup left no fixtures.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `attackAdjustments`, then `cleanup`.
