# Spell-attack rows with narration and endings — verification

2026-09-26. This batch continues Phase 4's largest group, **Attack and dependent result** (55 blocked at the start).

The target cluster was attack results whose conditions come with narration or a way to end them: Inkshot, Briny Bolt, Barbed Spear, Ray of Frost and Tangle Vine. Two resolve with the rules added here; the other three each need a mechanism of their own (see Coverage; Inkshot was resolved in the [condition-riders batch](phase-4-attack-condition-riders.md)). These are compiler rules only. There's no spell-name dispatch.

## Compiler

**`spell-attack-table.js`, written tables:**
- **Row dice:** a Critical Success or Success row stating the entry's dice (“The creature takes 2d6 bludgeoning damage”) becomes full damage, and twice them (4d6) double damage, so the item's heightening scales it. Other dice stay as written.
- **Narration:** “for N rounds/minutes as <narration>.” drops the narration after the duration.
- **Convenience links:** a Spell Effects link paragraph right after a hit row that states a Speed penalty is set aside, because the row's text compiles as a generated Speed penalty. It's recorded in `compilerEvidence.rowEffectLinks`.
- **Attack wording:** the attack may be “against a target within range”.

**`action-end-lifetime.js`:** also reads “… can spend an Interact action to <narration> and end the X condition, but not the Y condition.” Y must be another condition of the same outcome.

## Coverage

**New:**
- **Briny Bolt:**
  - Critical hit: double damage, Blinded for 1 round (ending early on an Interact action), and Dazzled for 1 minute.
  - Hit: full damage and Blinded for 1 round (ending on Interact).
- **Ray of Frost:** on a critical hit, double damage and a −10-foot status penalty to all Speeds for 1 round, from the text. PF2e's convenience Effect targets only the land Speed, and the text says “its Speeds”.

**Census:** **338 enabled** (Attack and dependent result: 43 of 96). The corpus diff changed exactly these 2 plans. The speed, escape and rule-family regressions all show 0.

**Still blocked in the cluster:**
- **Inkshot:** no Target field, and a cosmetic ink stain lasting 1 hour.
- **Barbed Spear:** “increasing its clumsy condition by 1”, and removal by an Athletics check against the spell DC.
- **Tangle Vine:** a degree-chosen Effect, Escape ending a Speed penalty, and heightened durations by fixed rank.

## Evidence

**Automated:** 373/373 tests pass.
- `test/attack-row-rules.test.js`:
  - Briny Bolt's multipliers and endings, and that off-size row dice aren't rewritten;
  - Ray of Frost's generated penalty and recorded link;
  - the “but not the Y condition” ending, which needs Y in the outcome.

[Live evidence](phase-4-attack-row-rules-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Briny Bolt, critical hit:** the roll was 2 and the target lost 4. It got “Briny Bolt: Blinded (ends on Interact)” (1 round, `actionEnd` interact, first to happen) and “Briny Bolt: Dazzled” (1 minute, no Interact ending).
- **Briny Bolt, hit:** the roll was 7 and the target lost 7. It got Blinded, which ends on Interact, and no Dazzled.
- **Ray of Frost, critical hit:** the roll was 4 and the target lost 8. It got “Ray of Frost: 10-foot Speed penalty” (FlatModifier all-speeds −10), and no copy of PF2e's “Spell Effect: Ray of Frost”.
- **Regressions:** `spellAttack`, `casterEffects`, `attackAdjustments` and `attackComponents` were rerun, and all passed. Cleanup left no fixtures.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `attackRowRules`, then `cleanup`.
