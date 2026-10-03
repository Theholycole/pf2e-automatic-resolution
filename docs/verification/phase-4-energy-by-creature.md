# Void or vitality by the creature — verification

2026-09-26. This batch works on Phase 4's **Healing / recipient mode** group (38 blocked at the start). By size, the next groups were Attack and dependent result (46) and Information / adjudication (33). Attack's remaining spells are mostly one-off mechanisms, and Information needs a new GM-adjudication surface. So this batch continues Healing with one general rule: the energy depends on what the creature is. There's no spell-name dispatch.

## Compiler (`src/compiler/energy-by-creature.js`)

**The pair (Execute):** “The target takes N void damage with a basic <save> save. If the target is undead or otherwise has void healing, the spell loses the death and void traits and gains the vitality trait, and the target takes N vitality damage with a basic <save> save.”
- PF2e splits Execute into two variants, Void and Vitality. Each variant is compiled on its own.
- The variant's single damage entry must be that energy and amount, and the save must be the basic save the text names.
- A narration sentence before the pair must hold no rule.
- The description becomes the canonical basic-save sentence. The target gets a predicate:
  - `not-undead-or-void-healing` for void (new in `basic-save-core.js` and `validate-plan.js`);
  - `undead-or-void-healing` for vitality (existing).

**The swap (Divine Armageddon):** “A creature harmed by vitality damage, such as one with void healing, takes vitality damage instead of void damage from this spell.”
- PF2e's “Leveled” `@Damage` convenience paragraphs restate the damage for the GM, and are set aside.
- What's left must be one narration sentence and a damage sentence (“Creatures in the area take …” / “Each creature in the area takes …”) naming every damage entry.
- It becomes `resolution.damageSwap: {from: "void", to: "vitality", when: "undead-or-void-healing"}`.
- `executableDamageSwap` accepts it only on a basic save with shared damage, a void component and no dual mode, and with matching compiler evidence. Otherwise the plan waits on a `damage-swap-route` capability.

## Runtime (`basic-save-runtime.js`)

At Finalize, for each target that is undead or has void healing:
- the evaluated roll's void type is renamed to vitality (`swapDamageType`), keeping the same dice results;
- that roll is applied, and the row records `damageSwapped: "void → vitality"`;
- the card's “Damage applied” line shows “(void → vitality for this creature)”.

Other targets take the roll unchanged.

## Coverage

**New:**
- **Execute:** both variants.
- **Divine Armageddon.**

**Census:** **381 enabled**, up from 379 (Healing / recipient mode: 24 of 60, 36 left).
- The b56 corpus diff against b55 changed exactly these 2 plans, both newly executable. Execute's variants went from guided to automatic.
- The speed, escape and six rule-family checks report 0 regressions.

**Still blocked nearby:** Soothing Mist, which needs dual-mode riders.

## Evidence

**Automated:** 408/408 tests pass.
- `test/energy-by-creature.test.js`:
  - Execute's variants: routes and predicates, eligibility for a humanoid and an undead, and a refusal when the text's amount differs from the damage entry.
  - Divine Armageddon: the swap, the 2 convenience rolls, `damageSwapApplies`, the roll JSON rename, and a refusal of a tampered swap.
- `test/homebrew-guide.test.js`: the guide's two new examples compile.

[Live evidence](phase-4-energy-by-creature-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `energyByCreature`:
- **Execute (Void):** a living creature failed its save and lost 70. An undead creature was refused (“undead and void-healing creatures take the vitality variant”) and lost nothing.
- **Execute (Vitality):** the undead creature failed and lost 70.
- **Divine Armageddon:** the roll was 74. A living creature and an undead creature both failed and each lost 74. The undead's row recorded “void → vitality”, and without the swap its void part would have healed it.
- **Regressions:** `healOrHarm`, `rayCounteract`, `persistentOnce` and `forcedMovement` were rerun, and all passed. Cleanup left no fixtures.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b56
node tools/diff-compiled-plans.mjs /tmp/phase23-b55/official-spell-compiler-report.json /tmp/phase23-b56/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b56/official-spell-compiler-report.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/phase23-b56/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `energyByCreature`, then `cleanup`.
