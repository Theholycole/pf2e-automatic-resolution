# Caster Effects on spell attacks — verification

2026-09-26. This batch continues Phase 4's largest group, **Attack and dependent result**.

A spell attack can now put its linked PF2e Effect on the caster, either always or when the attack hits. It does so only when the Effect's own rules and duration are exactly what the text says the caster gains. There's no spell-name dispatch.

## Compiler

**`spell-attack-table.js` (one-sentence forms) reads the benefit clause:**
- **Always:** “Regardless of whether you hit, you gain …” or “You gain a/an … for the duration(, as …).”
- **On a hit:** “(On a hit | If you hit), the <x> deals XdY type damage, and you gain ….”
- **The link:** the clause needs exactly one Spell Effects link, which it then owns. An Effect link that no clause claims stays where it is. That was the fix for Charged Javelin, whose link belongs to its persistent-linked clause.
- **New wording:** “…, dealing <damage> (double damage on a critical hit).” and “On a success, the target takes <damage> ((or) double damage on a critical hit).”

**`compile-ability.js`** resolves the link in the catalog and proves the clause with `inspectCasterBenefitClaim` (`scripts/effect-modifier-proof.js`):
- **FlatModifier:** “a ±N <type> bonus/penalty to your AC / saves / attack rolls / damage rolls”.
- **BaseSpeed:** “a <mode> Speed of N feet”.
- **TempHP `@item.badge.value`:** only with a `(@item.level)dN` badge and “XdN temporary Hit Points”, where X is the spell's rank.
- **Other rules:** any other rule refuses the Effect.
- **Duration:**
  - “until the beginning of your next turn” means 1 round with turn-start expiry;
  - “until the end of your next turn” means 1 round with turn-end expiry;
  - “for the duration” needs a spell whose duration is 1 round.

A proved clause becomes `resolution.casterEffect`: the uuid, `when`, the clause, the rank, the spell duration and the Effect snapshot. Otherwise a `caster-effect:*` pending blocks the plan.

**Supporting changes:**
- Catalog profiles (compiler tool, live catalog, compiled documents) now carry an Effect's `badge`, outside `mechanics`, so existing mechanics comparisons are unchanged.
- `basic-save-core.js` re-proves `casterEffect` in `inspectDegreeSavePlan`. It accepts a spell duration that is exactly the always-on clause's duration (“until the end of your next turn”), because the Effect carries that lifetime.

## Runtime

At Finalize, when `always`, or when any participating target's degree is success or critical success:
- The card loads the live Effect, re-checks its mechanics against the snapshot, and re-proves the clause (including the live badge).
- It creates the Effect on the caster (`prepareNativeEffectSource`, level = cast rank, so the badge rolls at that rank).
- The result card shows “Caster: <Effect> applied.” or “Caster: no benefit (the attack didn't hit).”

## Coverage

**New:**
- **Glutton's Jaws:** 1d4 temporary HP on a hit, heightened by the badge.
- **Propelling Air Stream:** fly Speed 15 until the end of the caster's next turn, even on a miss.
- **Spiked Carapace:** +1 circumstance to AC for the 1-round duration.

**Census:** **336 enabled** (Attack and dependent result: 41 of 96). The corpus diff changed exactly these 3 plans; an interim break of Charged Javelin was caught by the tests and fixed.

**Tool fix:** `tools/report-rule-family.mjs` compiled its detached-copy identity check without an Effect catalog, so a save plan that depends on a catalog Effect could never match. It now uses the same Spell Effects catalog. All rule-family regressions show 0, and the speed and escape regressions show 0.

**Still blocked:**
- Blood Feast: a rule that applies if the caster is a gug.
- Draw Blood: healing each time the target takes bleed damage, for the spell's duration.

## Evidence

**Automated:** 370/370 tests pass.
- `test/caster-effects.test.js`:
  - all three plans and their `when`;
  - claim proofs, with refusals for a wrong Speed, a wrong expiry, wrong dice, and a missing badge;
  - a missing catalog Effect, a changed clause and a forged Effect snapshot all blocked.
- `test/homebrew-guide.test.js`: the guide's homebrew spell.

[Live evidence](phase-4-caster-effects-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Glutton's Jaws:** a hit gave the caster “Spell Effect: Glutton's Jaws” with a badge of 4 and 4 temporary HP, and the result card read “Caster: Spell Effect: Glutton's Jaws applied.” A miss applied nothing, and the card read “Caster: no benefit (the attack didn't hit).”
- **Propelling Air Stream, miss:** the Effect was applied with fly Speed 15, lasting 1 round with turn-end expiry.
- **Spiked Carapace, hit:** the caster's AC rose by 1.
- **Regressions:** `persistentLinked` (Charged Javelin), `attackAdjustments`, `selfConditional` and `attackComponents` were rerun, and all passed. Cleanup left no fixtures.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `casterEffects`, then `cleanup`.
