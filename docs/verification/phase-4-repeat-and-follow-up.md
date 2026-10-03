# Repeated blasts and attack follow-up saves — verification

2026-09-26. This batch continues Phase 4's largest group, **Attack and dependent result** (53 blocked at the start).

It adds two shared rules:
- **Repeated blasts:** several spell attacks from one cast during the caster's turn.
- **Attack follow-up saves:** a follow-up save on an attack's critical hit.

It also fixes a follow-up-save compiler bug. There's no spell-name dispatch.

## Compiler

**`spell-attack-table.js`:**
- **Repeat window:** “For the remainder of your turn, you can blast targets within N feet with this <x> by spending a single action which has the attack and concentrate traits.” plus “When you do so, attempt a ranged spell attack roll.”
  - The pair reads as the attack, and the plan gets `resolution.repeatable: {window: "turn", range}`.
  - The empty Target means one creature per blast.
  - The window sentence without its attack sentence is refused.
- **Critical-hit forms:** “If you hit, you inflict …” and “On a critical hit, the target takes @Damage[…persistent…] damage.” / “… the blast knocks the target <condition>.” join the existing critical-rider form.
- **Critical follow-up save:** “If you hit, you deal <damage incl. splash>. On a critical hit, double the initial damage, but not the splash damage, and the target you hit must succeed at a <save> saving throw or <outcome>.”
  - The critical row becomes “The target takes double damage. The target must succeed at …”, and the degree compilers turn that into the ordinary follow-up save.
  - The item's non-basic save is accepted only when it's this follow-up.
  - The attack may start with “Attempt a spell attack …”.

**`secondary-save-compiler.js`:**
- Failure branches also read “or fall …”.
- **Bug fix:** `@UUID` links are masked while branches are extracted. Before, a branch like “or fall @UUID[Compendium.pf2e…]{Prone}” was cut at the link's first dot and lost its condition. The corpus diff shows no other plan changed by this fix.

**`residual-prose.js`:** Prone granted by a claimed follow-up branch counts as explained.

**`basic-save-core.js`:** “until the end of your turn” is accepted as the repeat window of a `repeatable` plan.

## Runtime (`scripts/main.js`)

- For a repeatable plan, the spell's chat button stays enabled as **Blast Again**. Each click opens one save card for the current target, and the attack number is chosen per card as usual.
- The first blast records `repeatWindow` on the spell's message: the combat, round and turn, or no combat.
- A later click is refused once the combat's round or turn differs (“the blasts ended with your turn”). Outside combat, the window stays open.

## Coverage

**New:**
- **Scorching Blast:** fire blasts; a critical hit adds persistent fire.
- **Aqueous Blast:** water blasts; a critical hit knocks the target Prone.
- **Exploding Earth:** splash damage, with a critical-hit Fortitude save or fall Prone.

**Census:** **341 enabled** (Attack and dependent result: 46 of 96). The corpus diff changed exactly these 3 plans. The speed, escape and rule-family regressions all show 0.

**Still blocked, with reasons:**
- **Blazing Blade:** its critical rider exists only from 4th rank.
- **Bottle the Storm:** a reaction with stored damage.
- **Ray of Corruption:** a critical hit worsens the save's degree, and there's an object rule.
- **Deity's Strike:** a line-area save after the attack.
- **Vital Seed:** an area drain and healing.

## Evidence

**Automated:** 376/376 tests pass.
- `test/repeat-and-follow-up.test.js`:
  - both blast plans, and that the window is required for the lifetime;
  - a missing attack sentence refused;
  - Exploding Earth's follow-up save and splash;
  - the whole-link branch extraction.
- `test/splash-damage.test.js`: now expects Exploding Earth to resolve.

[Live evidence](phase-4-repeat-and-follow-up-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Scorching Blast through the real chat card:** the first click opened a save card, and the button then read “Blast Again”.
  - A critical hit on the first target dealt 30 (2 × 15) and added persistent `(1d6 + (0 * 2)) fire`.
  - A second click on a second target opened another card, and the hit dealt 8.
- **In combat:** a blast recorded `repeatWindow` {round 1, turn 0}, and after `nextTurn` the window was closed.
- **Aqueous Blast, critical hit:** the target lost 20 (2 × 10) and was knocked Prone.
- **Exploding Earth, critical hit, follow-up Fortitude save failed:**
  - The card rows were the attack target and the adjacent creature (splash).
  - The target lost 33 (2 × 15 initial + 3 splash) and was knocked Prone.
  - The adjacent creature lost 3.
- **Regressions:** `splash`, `spellAttack`, `strikePrelude`, `strikeResult` and `enemies` were rerun, and all passed. Cleanup left no fixtures or combats.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `repeatAndFollowUp`, then `cleanup`.
