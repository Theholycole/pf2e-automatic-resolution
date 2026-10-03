# Strike spells with caster Effects — verification

2026-09-26. This adds Strike spells whose rules are carried by their linked PF2e Effects on the caster.

**How it works:** the caster makes the Strike with PF2e, and the Effects change it the way PF2e models the spell. With two Effects, the module puts each on the caster at the right moment. There's no spell-name dispatch.

## Compiler (`src/compiler/strike-effects.js`)

**Accepted spells:**
- **Item:** no defense, no area, no Target.
- **Text:** narration (no rule words) is allowed before the Strike sentence (“Make a (melee|ranged|unarmed) Strike …”). The rest must describe only the caster's Strike.
- **Links:** the only links allowed are PF2e actions or class features within the Strike sentence (Flurry of Blows), plus one or two resolved Spell Effects links.

**Refused text:**
- anything about other creatures: saves, areas (emanation, cone, burst), push/pull/teleport, healing, “the target is/becomes/takes”;
- results by degree (Critical Success / Success / Failure / Critical Failure);
- an ending the caster must keep up (“ends if/when”, “at the end of any turn”).

**Phases:**
- **One Effect:** `before`, meaning it's created at cast and PF2e's own duration applies.
- **Two Effects:** each is phased by the damage additions its rules make at the spell's base rank (DamageDice “1d6 electricity”, FlatModifier with a damage type “1 electricity”; heightened `gte` branches aside).
  - The Effect named in an “After the attack, regardless of the result, …” sentence is `after`.
  - The other must be named in the remaining text; it's `before` and one-Strike.
  - Anything else is refused.

**Result:** `resolution.kind: "strike-effects"` with `applications` (uuid, label, phase, `removeAfterStrike`), plus `nativeEffects.onUse` with the caster as recipient. The level is `prompted` when an Effect has a ChoiceSet, otherwise `automatic`.

**Checks:** `scripts/strike-effects-core.js` checks the plan (1–2 applications, a lone Effect is `before` and not one-Strike, two means exactly one `after` and one one-Strike `before`). `tools/report-enabled-spells.mjs` counts it as the `strike` route.

## Runtime (`scripts/strike-effects-runtime.js`)

- **The chat card's “Resolve Strike Spell”** (the caster's owner or a GM):
  - creates the `before` Effects on the caster, with origin data from the spell at its cast rank (`getOriginData`), so `parent:origin:item:level` rules work;
  - records the `after` Effects in the caster's `pendingStrikeEffects` flag;
  - posts a card with the Strike reminder and what was applied.
- **Choices:** a ChoiceSet prompts through PF2e, or takes `selections` passed by a macro.
- **When the Strike is resolved** (the lead GM's `createChatMessage` hook sees a Strike damage roll, or a Strike attack roll that misses): the one-Strike Effects are removed and the pending `after` Effects are created. So the after-attack bonus never adds to the first Strike's own damage.

## Coverage

**New:**
- **Force Fling:** Effect: Force Fling makes the physical damage force; the multiple-attack-penalty toggle is PF2e's.
- **Inner Upheaval:** +1 status to attacks and extra d6 damage of the chosen type.
- **Fulminating Impact:** 1d6 electricity + 1d6 sonic on the first Strike, then +1 electricity + 1 sonic.

**Census:** **329 enabled** (Attack and dependent result: 34 of 96). The corpus diff changed exactly these 3 plans; an early draft also caught Warding Aggression, which is now refused. The speed, escape and rule-family regressions all show 0.

**Still unresolved:** Warding Aggression (degree choices and upkeep), Tentacular Innervation, Shooting Star, Tracking Mayflies, Sky Laughs at Waves, Shielding Strike, Spinning Staff, and other creatures' Strikes.

## Evidence

**Automated:** 362/362 tests pass.
- `test/strike-effects.test.js`:
  - Force Fling and Inner Upheaval (prompted);
  - Fulminating Impact's phases, with changed amounts refused;
  - Warding Aggression, a missing catalog Effect, an area rule and a forged after-only plan refused.
- `test/homebrew-guide.test.js`: the guide's homebrew spell.

[Live evidence](phase-4-strike-effects-live-results.json) on Foundry 14.367 / PF2e 8.5.0. The runs used real PF2e Strikes with the caster's melee item (1d6 slashing), with dialogs skipped by shift.
- **Force Fling:** the caster got “Effect: Force Fling”, and the Strike damage was `1d6 force`.
- **Inner Upheaval (choice: force):** the caster got “Spell Effect: Inner Upheaval (Force)”. The attack had “Inner Upheaval +1 status”, and the damage was `1d6 slashing + 1d6 force`.
- **Fulminating Impact, rank 4:**
  - Before the Strike, only “(Initial Strike)” was on the caster, and the first damage was `1d6 slashing + 1d6 electricity + 1d6 sonic`.
  - Once that Strike was resolved, “(Initial Strike)” was gone and “Spell Effect: Fulminating Impact” was on the caster.
  - The next damage was `1d6 slashing + 1 electricity + 1 sonic`.
- **The chat card** for Force Fling showed **Resolve Strike Spell**.
- **Regressions:** `strikePrelude`, `strikeResult`, `selfConditional` and `directHealing` were rerun, and all passed. Cleanup left no fixtures.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `strikeEffects`, then `cleanup`. The lasting Effect is created by the Strike watcher, so the harness waits for it.
