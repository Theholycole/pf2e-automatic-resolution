# Spell attacks — verification

2026-09-25. With no large Phase 2/3 group left, this batch starts the spell-attack family (about 90 unresolved attack spells, mostly Phase 4). It reuses the shared save card rather than building a new route. There's no spell-name dispatch.

## Compiler (`src/compiler/spell-attack-table.js`)

PF2e stores no defense for attack spells; the `attack` trait and the text define them. `expandSpellAttackTable` runs after the spell is adapted, for spells with the attack trait, no save, Target `1 creature`, and no area. It rewrites the description as a standard table keyed by the attack's degree:
- **Critical Success** = critical hit;
- **Success** = hit;
- **Failure / Critical Failure** = miss (unaffected, or a written Failure row, with Critical Failure “As failure.”).

It sets the defense to `spell-attack`. The ordinary degree, residual and preamble compilers then judge every row, so any sentence they can't account for still blocks the spell.

**Accepted forms:**
- “… On a hit, the target takes XdY TYPE damage (double damage on a critical hit).”
- “…, dealing XdY TYPE damage on a success and double damage on a critical success.”
- “… On a hit, the target takes XdY TYPE damage and is <condition> (double damage and <condition> on a critical hit).”
- A written table with the hit rows (optionally a Failure row). Before it: narration, one attack sentence, and at most one damage sentence (“The ray deals …”, “… that deals …”, “The target takes … depending on the result of your spell attack roll”).

The dice and type must be the spell's single damage entry. Narration may not contain numbers.

## Runtime (shared save card)

- **Rolling:** the check statistic `spell-attack` makes **Roll Spell Attack** roll the caster's PF2e spell attack, `spell.rollAttack(null, attackNumber, {target})`, against the target's AC. The owner of the *caster* rolls it (a GM can too). A dialog asks the attack number for the multiple attack penalty, and the target must have exactly one token on the scene.
- **Recording and applying:** the result is recorded like a save degree. Damage multipliers, conditions, generated Speed penalties, GM degree corrections and Finalize are all the existing save-card paths.
- **Card wording:** “Resolved … by the caster's spell attack against each target's AC”. Hero Point rerolls are refused; use PF2e's own reroll.
- **Chat card:** a **Resolve Spell Attack** button is added beside PF2e's Attack / MAP / Roll Damage buttons, which are left untouched.

## Coverage

**New (Phase 4):** Divine Lance, Admonishing Ray, Polar Ray (Drained 2 on a hit), Murder of Crows (Dazzled / Blinded 1 round) and Snowball (−5 / −10-foot Speed penalty).

**Blocked by their own rules:**
- Hurtling Stone (push), Acid Arrow (persistent damage not doubled on a crit), Fire Ray (burning ground), Ray of Frost (linked Effect);
- Chilling Darkness, Holy Light and Moonlight Ray (extra damage by target trait), Imaginary Weapon (push), Horizon Thunder Sphere (action variants);
- multi-target and area attacks, and the rest.

**Census:** **293 enabled.** Only the 5 new spells, Ray of Frost and Hurtling Stone changed, and all family regressions show 0.

## Evidence

**Automated:** 297/297 tests pass. `test/spell-attack.test.js` covers the five spells' result tables, refuses the three blocked spells and altered text, and checks that the rewrite requires the attack trait. There's also a guide example.

[Live evidence](phase-4-spell-attacks-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Divine Lance:** PF2e rolled a real spell attack (natural 11, total 25: a hit against AC 20). A GM correction to a critical hit dealt 2d4 = 8, doubled to 16.
- **Murder of Crows:** a hit dealt full damage and applied Dazzled (not Blinded).
- **Divine Lance (miss):** no damage.
- **Snowball (critical hit):** doubled damage and applied “Snowball: 10-foot Speed penalty” (`FlatModifier` all-speeds −10).
- **Real chat card:** casting Divine Lance showed PF2e's Attack, MAP −5, MAP −10 and Roll Damage buttons, plus **Resolve Spell Attack**.
- **Save-card regressions:** the rider harness (Gritty Wheeze, Torturous Trauma) was rerun.

## Several targets (follow-up batch)

**Compiler:**
- Targets `1 or 2 creatures`, `up to 2/3 creatures` and `2/3 creatures` are accepted, together with “against each target('s AC)” and “This/It deals XdY TYPE damage.”
- **Shared penalty:** with several targets, the sentence “(If you're attacking two creatures,) this/each attack counts (as two attacks) for/toward your multiple attack penalty, but the/your penalty doesn't increase until (after) (you've made) both/all your attacks.” sets `check.sharedMultipleAttackPenalty`. With one target the same sentence is unaccounted for, so it blocks.
- **Critical persistent damage:** “On a critical success/hit, a target also takes @Damage[(@item.level|rank)dN[bleed / persistent,TYPE]] damage.” substitutes that inline roll for the Critical Success row's “XdY persistent TYPE damage”, so the row heightens. If the row names no such damage, the spell is refused.

**Runtime:** each target's attack records its attack number. With a shared penalty, the card keeps the first number chosen (`state.attackNumber`) and every later attack on the card uses it without asking again.

**Coverage:** **Slashing Gust (new).** The other multi-target attack spells have rules of their own:
- Blazing Bolt and Splinter Volley: rays or targets depend on actions spent;
- Flurry of Claws: damage type by tradition;
- Pierce the Sky: hazardous terrain;
- Lashing Rope: weapon Strikes.

**Census:** **294 enabled.** Only Slashing Gust changed, and all family regressions show 0.

**Evidence:**
- **Tests:** 299/299. They cover Slashing Gust's shared penalty and its critical row (double damage plus `(@item.level)d4` bleed). Without the penalty sentence, attack numbers stay separate. A mismatched critical row is refused, and so is the penalty sentence on a single target. There's also a guide example.
- **Live** ([results](phase-4-multi-target-attacks-live-results.json)): Slashing Gust cast at rank 3 on two targets.
  - The first attack was rolled as the second attack of the turn; the second target's attack reused that number without asking.
  - The critical hit took 4d4 = 11, doubled to 22, plus a 3d4 persistent bleed condition. The hit took 11 and no bleed.
  - The single-target cases (`spellAttack`) were rerun.

## Pushes and pulls (follow-up batch)

**Compiler:** recognised forced-movement clauses are removed from a result and recorded as `outcomes.<degree>.forcedMovement = {kind: push|pull, distance, upTo, optional, direction: any|away|toward}`:
- **Table rows:** “The target takes double/full damage and <movement>.”
- **One-sentence attacks:** “If you hit / On a hit, you deal XdY TYPE damage(, and <movement>). On a critical success/hit, you deal double (the) damage(,) and <movement>.”

**Movement forms:**
- “you can push it up to N feet” (optional);
- “can choose to … to push the target N feet away from you” (optional);
- “the target is pulled up to N feet toward you”;
- “is knocked back N feet”;
- “is pushed N feet away from you”.

`@Damage[XdY[type]] damage` in the sentence reads as the spell's damage entry. “against your target's AC” is accepted. Other movement wording is still judged by the degree compilers, which block it.

**Core:** a malformed movement record refuses the plan.

**Runtime:** the card shows a **GM:** note for each target's result, for example “… is pulled up to 20 feet toward the caster. Move the token; the module doesn't.”, or “can be pushed up to 5 feet (the caster's choice)”. Tokens aren't moved.

**Coverage:** **Hurtling Stone, Imaginary Weapon and Shadow Strike (new).** Still blocked:
- Glacial Skewer: Immobilized when pushed into an obstacle;
- Hydraulic Push: can target an object;
- Banishing Touch: variants by actions spent.

**Census:** **300 enabled.** Only the three spells changed, and all family regressions show 0.

**Evidence:**
- **Tests:** 306/306. They cover the three spells' movement records, and refuse other wording and malformed records. There's also a guide example.
- **Live** ([results](phase-4-forced-movement-live-results.json)):
  - **Shadow Strike at rank 4, critical hit:** 29 × 2 = 58 damage, with “is pulled up to 20 feet toward the caster”; the token wasn't moved.
  - **Hurtling Stone, hit** (auto-heightened cantrip): 18 damage, with “can be pushed up to 5 feet (the caster's choice)”.
  - **Hurtling Stone, miss:** no note, no damage.
  - The spell-attack and ray cases were rerun.

## Persistent damage not doubled on a critical hit (follow-up batch)

**Compiler:**
- **Accepted wording:** “On a hit / If you hit / If it hits, you deal XdY TYPE damage plus @Damage[F[persistent,type]] damage. On a critical hit, double the initial damage, but not the persistent damage.” The initial damage must be the damage entry, and F may read only the cast rank.
- **Resulting rows:** Critical Success is “double damage and <persistent roll>”, and Success is “full damage and <persistent roll>”. These are mixed outcomes: shared ×2 or ×1, plus the persistent roll ×1.
- **Heightening fix:** `attachOutcomeFormulaHeightening` no longer adds the Heightened text's increase to an inline formula that already reads `@item.rank` / `@item.level`. That would have heightened it twice; the core rightly refused it. No other plan in the corpus changed.

**Coverage:** **Acid Arrow (new).**
- **Sticky Fire stays blocked.** Its Enfeebled 1 lasts “until they recover from their persistent fire damage”, which needs a condition tied to the persistent-damage condition, and its persistent damage is a structured entry.

**Census:** **301 enabled.** All family regressions show 0.

**Evidence:**
- **Tests:** 308/308. They cover Acid Arrow's rows, and refuse an actor-reading formula and wording without “but not the persistent damage”. There's also a guide example.
- **Live** ([results](phase-4-persistent-once-live-results.json)): Acid Arrow at rank 4.
  - **Critical hit:** 5d8 acid = 27, doubled to 54, plus a 2d6 persistent acid condition (not doubled).
  - **Hit:** 19 plus 2d6 persistent acid.
  - **Miss:** nothing.
  - Slashing Gust (inline bleed) and the single-target cases were rerun.

## Silver damage (follow-up batch)

**Compiler:**
- **Material sentences:** “This is silver damage for the purposes of weaknesses, resistances, and the like.” (also “<Spell>'s <type> damage is …”, and cold iron or adamantine) is accepted only when a damage entry of that type already lists the material in PF2e's data. PF2e's own damage roll then applies it. The sentence is recorded in `compilerEvidence.damageMaterials`; without the material in the data, it isn't accepted and blocks.
- **Row wording:** result rows reading “The <noun> deals double/full/normal damage …” are read as the target's damage.
- **Damage sentence:** “The <noun> of <noun> deals …” is accepted.

**Coverage:** **Moonbeam (new)**: silver fire damage, Dazzled for 1 minute on a critical hit and 1 round on a hit. **Moonlight Ray stays blocked:** its semicolon-joined extra damage, a critical row keyed to fiends and undead (the text says unholy), and counteracting darkness.

**Census:** **302 enabled.** All family regressions show 0.

**Evidence:**
- **Tests:** 310/310. They cover Moonbeam's rows, material evidence and durations. The same text without silver in the data is refused, and Moonlight Ray stays blocked. There's also a guide example.
- **Live** ([results](phase-4-silver-damage-live-results.json)): Moonbeam on a hit.
  - An ordinary creature took full fire damage (12) and was Dazzled.
  - A creature with weakness 5 to silver took 6 + 5 = 11, because PF2e applied the silver weakness.
  - The spell-attack and Acid Arrow cases were rerun.

## Action-count variants (follow-up batch)

**Compiler:**
- **Action-count sentences** are recognised and set aside before the positional checks:
  - extra targets for extra actions: “For each additional action … an additional ray at a different target …”, “You can spend a third action … at two different targets instead of one”;
  - damage by actions: “If you spend N or more actions Casting the Spell, the damage increases to XdY TYPE damage on a hit, and it still deals double damage on a critical hit.” The spell's damage entry must equal that damage when the item's fewest actions (its Time) is at least N, and the ordinary hit dice otherwise.
- **Other wording now accepted:**
  - “against a single creature” and “1 or more / 2 or more creatures” (also in the target compiler);
  - “On a hit, the target takes …, and on a critical hit, the target takes double damage.”;
  - “On a hit, the <noun> deal(s) … . The <noun> deal(s) double damage on a critical hit and @Damage[F] damage.”;
  - the shared-penalty wording “These attacks each increase your multiple attack penalty, but you don't increase … until after you make both/all the spell attack rolls for <spell>.”
- A single-target variant ignores the shared-penalty sentence that describes the other action counts.

**Runtime:**
- The save card records the PF2e variant's overlay ids (`state.overlayIds`), and every reload of the spell (attack, damage, extra rolls) uses `loadVariant({castRank, overlayIds})`.
- A base card of a spell with variants shows which variants are automated, instead of “not yet automated”.

**Census:** the corpus compiler also compiles each override overlay as its own variant plan (`plan.variantPlans`). The census counts a spell whose variants are executable.

**Coverage:**
- **Blazing Bolt (new):** its 1-action variant is 2d6 against one creature; its 2–3-action variant is 4d6 against several creatures, with a shared penalty.
- **Splinter Volley (new):** 4d6 against 1 or 2 creatures, shared penalty, and on a critical hit `(floor(@item.level/2))` bleed.
- **Still blocked:** Banishing Touch (launch into the air and falling damage by actions) and Horizon Thunder Sphere (range by actions, and a two-round mode with an area burst and a sparking aura).

The “or more creatures” target change removed only the `target-eligibility` gap from Kinetic Ram, Lament, Ibex's Harvest and The Four Hunters. Each is still blocked by its other rules.

**Census:** **304 enabled.** All family regressions show 0.

**Evidence:**
- **Tests:** 311/311. They cover both Blazing Bolt variants (built from PF2e's overlays) and refuse the base spell and a variant with the wrong damage. They also cover Splinter Volley, and check that Banishing Touch and Horizon Thunder Sphere stay blocked.
- **Live** ([results](phase-4-action-variants-live-results.json)):
  - **Blazing Bolt 2–3-action variant** on two targets: 4d6 = 16. The critical hit took 32 and the hit 16. Both used attack number 2, and the card recorded overlay `hqiwae0wgehycnex`.
  - **Blazing Bolt 1-action variant:** 2d6 = 9.
  - **Splinter Volley critical hit:** 1 persistent bleed.
  - **Real chat cards:** the 2-action variant card's item was the variant (4d6) and showed **Resolve Spell Attack**. The base card showed PF2e's variant buttons and “Choose a variant above; … (automated: 2 or 3 actions, 1 action).”

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` cases `spellAttack`, `multiAttack`, `forcedMovement`, `persistentOnce`, `silverDamage` and `actionVariants`, then `cleanup`.
