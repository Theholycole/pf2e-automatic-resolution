# Splash damage — verification

2026-09-26. This adds splash damage to spell attacks, plus heightened condition durations (needed by Percussive Impact). There's no spell-name dispatch.

## PF2e behaviour this works around

PF2e rolls a spell's splash entry inside its damage roll:
- A same-type splash entry becomes a `[splash]` term of the main instance: `(1d6 + 1[splash])[acid]`.
- A different-type splash entry becomes its own instance: `(1d4[splash])[sonic]`.

`DamageRoll.alter(2)` doubles the whole roll, splash included, which was checked live (Acid Splash `(1d6 + 1) acid` altered to `2 * (1d6 + 1) acid`). Splash damage isn't doubled on a critical hit, so the card builds its own rolls from the rolled numbers.

## Compiler

- **Damage lists** accept splash items: “1 splash acid damage” and “1d4 sonic splash damage”. They must match a damage entry with category `splash` (and the same type and formula).
- **New one-sentence form:** “(If you hit | On a hit), you deal <damage>. On a critical (success|hit), the target also takes @Damage[…persistent…] damage / is also <condition>.” The critical rider joins the doubled row. An inline formula may read only `@item.rank` / `@item.level`.
- **`compile-ability.js`:**
  - A spell attack with splash entries gets `resolution.splash: {radius: 5, componentIds}` and `compilerEvidence.splashDamage`, and no per-entry selection proof.
  - Several targets, miss rows or persistent links alongside splash leave `splash:composition` pending.
- **`basic-save-core.js` (`executableSplash`):**
  - exactly one target (`1 creature`);
  - the splash IDs equal the evidence and the entries;
  - only direct and splash entries;
  - rows are ×2 / ×1 / none / none over every entry;
  - `spell-attack` with no shared attack penalty;
  - only then is the `splash` category allowed in the shared damage.
- **Heightened condition durations:**
  - “the duration of the <condition> condition … increases by N rounds” in the Heightened text puts `duration.heightening: {increase, interval, rank}` on every fixed-round outcome condition of that slug.
  - It needs the item's fixed-interval heightening; otherwise `condition-duration-heightening` stays pending.
  - The card snapshot applies it for the cast rank.

## Runtime

- **When the card starts:** every other token on the target's scene within 5 feet of the target (document-based distance) becomes a `mode: "splash"` row. That includes allies and the caster. The GM can exclude any row. Splash rows take no attack roll and aren't part of the attack.
- **At Finalize:**
  - `splashParts` splits each evaluated instance's total into its splash terms and the rest. Splash terms under a non-additive expression are refused.
  - The target gets a PF2e roll `(non-splash × multiplier + splash[splash])[type]` per instance, so the splash is added before IWR.
  - On a hit or critical hit, each splash row gets `(splash[splash])[type]`.
  - On a miss, splash rows are marked unaffected with “The attack didn't hit: no splash damage.”

## Coverage

**New:**
- **Acid Splash:** 1d6 acid plus 1 splash acid, and persistent acid on a crit.
- **Percussive Impact:** 4d8 bludgeoning plus 1d4 sonic splash, and Deafened on a crit, heightened by 2 rounds per +2 ranks.

**Census:** **318 enabled** (Attack and dependent result: 24 of 96).

**Corpus diff:**
- Acid Splash and Percussive Impact became executable.
- Rainbow's End gained an honest `condition-duration-heightening` pending reason and stays blocked.
- The speed, escape and rule-family regressions all show 0.

**Still blocked:** Exploding Earth, which has a critical-hit Fortitude save to avoid falling Prone.

## Evidence

**Automated:** 337/337 tests pass.
- `test/splash-damage.test.js`:
  - both spells' plans, including Percussive Impact's Deafened heightening, with Exploding Earth blocked;
  - forged plans refused: a wrong radius, a half-damage row, several targets, and a splash amount not matching the entry;
  - the split and the formulas: splash never doubled, splash only for nearby creatures, no half multiplier, a non-additive splash refused;
  - splash rows don't take part in the attack.
- `test/homebrew-guide.test.js`: the guide's homebrew splash spell.

[Live evidence](phase-4-splash-damage-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Acid Splash, rank 1, critical hit.** The rolled total was 3 (2 + 1 splash). The card rows were the target and the adjacent creature only (no roll button on the splash row).
  - The target lost 5 (2 × 2 + 1), and got persistent `1 acid`.
  - The adjacent creature lost 1.
  - A creature 10 feet away lost 0.
- **Acid Splash, miss:** the target lost 0, and the adjacent creature lost 0 with “The attack didn't hit: no splash damage.”
- **Percussive Impact heightened to rank 5, critical hit.** The roll was `8d8 bludgeoning + 2d4 sonic` (37 bludgeoning, 4 sonic).
  - The target lost 78 (2 × 37 + 4), and got “Percussive Impact: Deafened” lasting 3 rounds.
  - The adjacent creature lost 4.
- **Regressions:** `attackComponents`, `persistentLinked`, `spellAttack`, `multiAttack`, `actionVariants`, `sustainedConditions`, `healOrHarm` and `compact` were rerun, and all passed.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `splash`, then `cleanup`. Its tokens are placed inside the scene's bounds.
