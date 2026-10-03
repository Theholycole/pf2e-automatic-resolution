# Self / not-self Effects — verification

2026-09-26. This adds a shared rule for Effects that apply only to a named recipient: yourself, someone other than yourself, or the target on a failed save. The Effect is applied only when its own PF2e rules give exactly the modifier the text states to that recipient. There's no spell-name dispatch.

## Compiler

**`src/compiler/mode-list.js`: the creature-kind mode list.**
- **Structure:**
  - one narration paragraph (no rule words);
  - one `<ul>` with exactly two entries headed “(Willing) Living Creature” / “(Willing) Undead Creature”;
  - exactly one PF2e Spell Effects link;
  - optionally the Heightened (+1) entry.
- **Energy:** the spell's `vitality` or `void` trait (exactly one) decides which entry heals. The healing entry must be headed Willing.
- **Healing variant** (no save, one damage entry of kind healing only):
  - The entry is “The target regains N Hit Points.”, where N is the entry's formula (dice or a flat amount).
  - It may be followed by one clause: “If the target is yourself / someone other than yourself, you/it also gain(s) a ±N status|circumstance bonus|penalty to AC|damage rolls|attack rolls|saving throws for 1 round.”
  - It becomes direct healing plus the Effect (`resolution.kind: "effect"`, with the application's `recipientCondition` of `self` / `not-self`).
- **Damage variant** (one damage entry of kind damage only, of the energy's type, with a basic save):
  - The entry is “The target takes XdY <energy> damage with a basic <save> save”, optionally followed by “; on a failure, the target also takes a ±N … for 1 round”.
  - It becomes a basic save whose failure and critical failure apply the Effect. As with one-sentence tables, a failure outcome also applies on a critical failure. It resolves on the degree route as a basic-save rider (`compilerEvidence.basicEffectRider`).
- **Target rules:** the healed or harmed kind (`living-creature` / `undead-or-void-healing`).
- **Base item:** it has no damage and is left to its variants.

**`scripts/effect-modifier-proof.js`: the proof.**
- **What it reads:** only FlatModifier and AdjustModifier rules, with the predicates `self:mode:undead` and `self:signature:{item|origin.signature}` (and their negations).
- **AdjustModifier:** it may adjust only the Effect's own modifier (the slug PF2e derives from the Effect's name).
- **Refusals:** any other rule or predicate makes the Effect unprovable.
- **Duration:** the Effect must last 1 round.
- **Result:** the proof records the context (`{self, undead}`) and the resulting modifiers. They must equal the text's claim exactly.

`healing-compiler.js` now also accepts a flat healing amount (“regains 6 Hit Points”).

## Runtime

- **Effect route:**
  - With healing, every recipient is checked for healability first. This check now also covers Effect + healing plans.
  - The live Effect's rules, duration and start must equal the compiled ones, and the proof is re-checked.
  - The Effect is created only for recipients matching the proof's context. Everyone is healed.
- **Save card:**
  - `inspectNativeOutcomeEffect` accepts the `text-modifier` proof on failure / critical failure. The Effect is applied as-is, with no choice selection.
  - A target not matching the context isn't given the Effect, and the result card notes “not applied: the spell's text covers a different recipient”.
- **Base card:** when two automated variants share an action count, the note lists them by name.

## Coverage

**New:**
- **Lay on Hands:**
  - Healing: 6 HP, plus +2 AC to someone other than yourself.
  - Vs. Undead: 1d6 vitality with a basic Fortitude save, and −2 AC on a failure.
- **Touch of the Void:**
  - Healing: 6 HP, plus +2 damage to yourself.
  - Vs. Living: 1d6 void, and −2 AC on a failure.

**Census:** **310 enabled** (Healing / recipient mode: 13 of 60). The corpus variant diff changed only these 4 variants; base plans are unchanged. The speed, escape and rule-family regressions all show 0.

**Still blocked in this group:** Heartbolt (a secondary emanation) and Soothing Mist (a choice to remove persistent damage).

## Evidence

**Automated:** 323/323 tests pass.
- `test/self-conditional-effect.test.js`:
  - modifiers per recipient for both Effects, and unknown predicates and rules refused;
  - recipient matching;
  - all four variants compile to their routes, with the base refused;
  - the damage outcome's Effect passes the compiled inspection on failure and critical failure only;
  - refusals: a +3 claim against a +2 Effect, a 2-round Effect, a changed live Effect, and an extra rule.
- `test/homebrew-guide.test.js`: the guide's homebrew spell (8 HP, 2d6, reusing the Lay on Hands Effect) resolves in both variants.

[Live evidence](phase-4-self-conditional-effects-live-results.json) on Foundry 14.367 / PF2e 8.5.0:

| Cast | Result |
| --- | --- |
| Lay on Hands (Healing), another creature | Healed 6 (roll 6); 1 Effect; AC +2 |
| Lay on Hands (Healing), yourself | Healed 6; no Effect; AC unchanged |
| Lay on Hands (Vs. Undead), failure | Lost 2 (roll 2); Effect; AC −2 (the Effect's undead adjustment) |
| Lay on Hands (Vs. Undead), success | Lost 3 (half of 6); no Effect; AC unchanged |
| Touch of the Void (Healing), undead caster on itself | Healed 6; Effect; AC unchanged. The +2 status damage modifier (`touch-of-the-void`) is active, and the −2 AC rule's predicate doesn't hold |
| Touch of the Void (Healing), another undead | Healed 6; no Effect |
| Touch of the Void (Vs. Living), critical failure | Lost 14 (double 7); Effect; AC −2 |

**Regressions:** `healOrHarm`, `directHealing` and `compact` were rerun and all passed. Cleanup left no fixtures.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `selfConditional`, then `cleanup`.
