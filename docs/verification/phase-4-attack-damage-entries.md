# Spell attacks with several damage entries — verification

2026-09-26. This batch continues Phase 4's largest group, **Attack and dependent result** (80 blocked at the start).

Two thirds of that group aren't spell attacks with results the save card can apply. They include Strike-based spells, reactions, repeatable attack actions, summoned attackers, and multi-phase spells.

Among the ordinary spell attacks, the most common shared structure is **two damage entries in one attack** (16 of the 80). This batch adds that structure and the small row rules that complete three spells. There's no spell-name dispatch.

## Compiler (`src/compiler/spell-attack-table.js`)

- **Damage lists:**
  - A list of two or more damage clauses joined by “and” / “plus” (“1d4 slashing damage and 1d4 electricity damage”, “2d6 slashing damage, plus 2 persistent bleed damage”) is read as the spell's damage.
  - The list must name every structured entry exactly once, with the entry's formula, type and persistence.
  - `@Damage[XdY[type]] damage` in a table's preamble reads the same way.
- **A choice of type:** “your choice of 2d6 slashing damage or 2d6 piercing damage” reads as the variant's chosen type. The PF2e variant's damage entry must be one of the choices; the untyped base item is refused.
- **Tables with all four rows:**
  - The Failure row must be “The target takes the <type> damage, but not the <type> damage.”, and the Critical Failure row “The target is unaffected.”
  - The Failure row keeps only the named entry.
- **New one-sentence forms:**
  - “If you hit, you deal <damage>. On a critical success, you deal double damage and double <persistent type> damage.” The named type must be a persistent entry.
  - “On a success, the <thing> deals <damage>, and if the target is <trait>, the <thing> deals an additional XdY <type> damage. On a critical success, the target takes double damage (and takes a –N-foot status/circumstance penalty to its Speeds for N rounds) (as <narration>).” The trait's extra damage becomes the conditional-damage rule (“If the target has the <trait> trait, you deal an extra …”), with its Heightened increase. The critical rider becomes the row.
- **Damage sentences before a table** may now say “, depending on your ranged/melee spell attack roll …”.

**`compile-ability.js`: the `attack-component-rows` proof.**
- It's attached to every spell attack with two or more entries: the component IDs, each row's text, each row's selected entries, and the written miss row's text.
- Rows select all entries unless the miss row keeps only some.
- `validate-plan.js` and `basic-save-core.js` accept the proof only for `spell-attack` checks whose entries are all damage (direct or persistent). The proof must match the outcomes exactly. A mixed row (shared plus an inline roll) is compared on its shared part.

## Runtime

The save card's per-entry selection (`selectComponentDamageRoll`) was already general: PF2e's damage is rolled once, and each target gets only its row's entries, scaled by the row. Persistent entries become PF2e persistent-damage conditions and double on a critical hit.

## Coverage

**New:**
- **Live Wire:** two entries; a miss deals the electricity only; a critical hit adds the persistent electricity roll.
- **Purifying Icicle:** two entries; extra vitality damage to undead; a critical speed penalty.
- **Gouging Claw:** both type variants; the persistent bleed doubles on a critical hit.

**Census:** **313 enabled** (Attack and dependent result: 19 of 96).

**Corpus diff:**
- 3 base plans changed: Live Wire and Purifying Icicle became executable, and Warshard Shot now parses but stays blocked (see below).
- 2 variant plans changed: Gouging Claw's.
- The speed, escape and rule-family regressions all show 0.

**Still blocked among the two-entry attacks, with reasons:**
- **Linked to the persistent damage:** Sticky Fire, Widow's Bite, Charged Javelin and Warshard Shot. Each has a condition or Effect that lasts as long as the target takes this persistent damage.
- **Splash damage:** Acid Splash, Percussive Impact and Exploding Earth.
- **Other rules:**
  - Magnetic Acceleration: an attack bonus against metal.
  - Draw Blood: healing whenever the target bleeds.
  - Spiked Carapace: an Effect on the caster.
  - Blinding Foam: removal by Interact, and the spell ending.
  - Withering Grasp: objects and Shield Block.
  - Blazing Blade: a repeatable attack action.

## Evidence

**Automated:** 328/328 tests pass.
- `test/spell-attack-components.test.js`:
  - Live Wire's rows, including a mixed critical row, and its proof;
  - a forged miss selection, a wrong miss type, and a partial damage list, all refused;
  - Purifying Icicle's rows, conditional damage and speed modifier;
  - Gouging Claw's two variants, with the base and an off-choice type refused;
  - Warshard Shot staying blocked.
- `test/homebrew-guide.test.js`: the guide's two-entry homebrew attack.

[Live evidence](phase-4-attack-damage-entries-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Live Wire, rank 1 (roll `1d4 slashing + 1d4 electricity`: 2 slashing, 1 electricity):**
  - critical hit: lost 6, and gained persistent `1d4 electricity`;
  - hit: lost 3;
  - miss: lost 1 (electricity only);
  - critical miss: lost 0.
- **Purifying Icicle (roll `2d6 piercing + 1d6 cold` = 6; undead extra 2):**
  - critical hit on an undead: lost 16 (2 × (6 + 2)), and got “Purifying Icicle: 10-foot Speed penalty” (−10 circumstance, all Speeds, 1 round);
  - hit on a living creature: lost 6.
- **Gouging Claw (Piercing) (roll `2d6 piercing + 2 bleed`, 11 piercing):**
  - critical hit: lost 22, and gained persistent `2 * 2 bleed`;
  - hit: lost 11, and gained persistent `2 bleed`.
- **Regressions:** `spellAttack`, `multiAttack`, `persistentOnce`, `silverDamage`, `actionVariants`, `forcedMovement` and `selfConditional` were rerun, and all passed. Cleanup left no fixtures.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `attackComponents`, then `cleanup`.
