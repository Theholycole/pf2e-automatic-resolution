# Extra damage by creature trait — verification

2026-09-25. This adds extra damage that applies only to creatures with a trait, shared by basic saves, degree tables and spell attacks. There's no spell-name dispatch.

## Compiler (`src/compiler/conditional-damage.js`)

**The sentence:** “(The <noun> | It | This spell) deals an additional @Damage[FORMULA[type]] damage to (creatures | each creature | targets | each target) with the <trait> trait (in the area).” It gives `resolution.conditionalDamage: [{formula, damageType, trait, sourceText}]`.

**Restrictions:**
- only an inline roll, reading only `@item.level` / `@item.rank`, so it heightens by itself;
- not persistent;
- exactly one such sentence per spell.

Static dice whose heightening lives only in the Heightened text (“you deal an extra 5d6 spirit damage”) aren't accepted.

**How each kind of spell uses it:**
- **Basic saves:** the sentence is removed before the simple basic-save check, so the rest of the text is judged as before.
- **Degree tables and spell attacks:** the sentence is claimed from the save preamble. The spell-attack rewrite keeps it in the preamble.

**Validation:** `isExecutableBasicSavePlan` and `inspectDegreeSavePlan` refuse malformed entries, and entries on a plan with no shared damage to scale with.

## Runtime (shared save card)

**At Finalize, before anyone loses HP:** each entry is rolled once with PF2e's `DamageRoll` at the cast rank, and only if a participating target that takes damage has the trait. A chat message shows the roll.

**For each such target:** the extra roll is scaled by the same multiplier as the shared damage (half, full or double) and applied as its own damage instance. It shows as `kind: "conditional"` in the target's damage results. PF2e's IWR applies.

## Coverage

**New (Phase 2):** Holy Cascade (a basic Reflex save in a burst; extra `((@item.level*2)-2)d6` spirit damage to unholy creatures).

**Blocked by their own rules:**
- Chilling Darkness, Holy Light and Moonlight Ray: counteract light/darkness along the ray, silver damage, and static extra dice;
- Sun Blade: weapon requirement, sunlight die size;
- Purifying Icicle: two damage entries, static extra dice, a critical Speed penalty;
- Fiendish Rift: other Sustain rules.

**Census:** **295 enabled.** Only Holy Cascade changed, and all family regressions show 0.

## Evidence

**Automated:** 304/304 tests pass. `test/conditional-damage.test.js` covers:
- Holy Cascade;
- a homebrew spell attack with extra vitality damage against undead;
- the refusals: an actor reference, persistent damage, static dice, and two sentences;
- the four official attack spells staying blocked.

There's also a guide example.

[Live evidence](phase-2-4-conditional-damage-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Holy Cascade at rank 4** (extra damage `6d6 spirit`):
  - an unholy creature that failed took 7 bludgeoning + 18 spirit = 25;
  - an ordinary creature that failed took 7;
  - an unholy creature that succeeded took 3 + 9 = 12.
- **Homebrew Grave Ray** (a spell attack) on a critical hit against an undead creature: shared damage 9 ×2 = 18 plus extra vitality 3 ×2 = 6, 24 in total.
- **Regressions:** the single-target and multi-target spell-attack cases were rerun.

## Counteract along the ray and fixed extra dice (follow-up batch)

**Fixed dice:** “If the target has the <trait> trait, you deal an extra NdF TYPE damage.” is accepted, with its heightening read from the Heightened entry: “the TYPE damage (against …) increases by MdF”. The increase uses the item's own interval, giving `(N+M*(@item.rank - rank))dF[type]`, or `floor((@item.rank - rank)/interval)` for longer intervals. A Heightened entry that mentions that damage type in any other form refuses the spell, and a spell without heightening keeps the dice fixed.

**Counteract along the ray:**
- **Accepted wording:** after an attack table, exactly one form: “If the ray/light/beam passes through an area of magical light/darkness or targets a creature affected by magical light/darkness, <spell> attempts to counteract the light/darkness. If you need to determine whether the … passes through an area of …, draw a line between yourself and the spell's target.”
- **How it's handled:** it becomes `resolution.reminders: [{kind: "counteract-along-path", target, text}]`, and the save card shows it as a **GM:** note: “Resolve this counteract check yourself; the module doesn't track magical light/darkness.” Only this kind of reminder is accepted, and any other paragraph after the table is still judged, and blocks.

**Coverage:** **Chilling Darkness** and **Holy Light (new)**. Moonlight Ray (silver damage; extra damage by fiend/undead in its critical row) and Sun Blade (weapon requirement, sunlight dice) stay blocked.

**Census:** **297 enabled.** Only the two spells changed, and all family regressions show 0.

**Evidence:**
- **Tests:** 304/304. They cover both spells' formula `(5+2*(@item.rank - 3))d6[spirit]` and their reminder. Moonlight Ray and Sun Blade stay blocked, and so do a reworded reminder, a differently worded Heightened entry, and an unknown reminder kind.
- **Live** ([results](phase-2-4-ray-counteract-live-results.json)): Chilling Darkness at rank 5.
  - The card showed the GM counteract reminder.
  - The rolls were 9d6 cold (36) and 9d6 spirit (40).
  - A holy creature's critical hit took (36 + 40) × 2 = 152. An ordinary creature's hit took 36.
  - Holy Cascade, the homebrew Grave Ray and the spell-attack cases were rerun.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` cases `conditionalDamage` and `rayCounteract`, then `cleanup`.
