# Counteract family (part 4): near-miss wordings, poisons and allies — verification

2026-09-26. This continues the counteract family ([1](phase-4-counteract-care.md), [2](phase-4-counteract-spells.md), [3](phase-4-counteract-set-aside.md)). Two spells from Phase 2 share Sound Body's near-miss rule. Cleansing Flames counteracts a poison or non-curse effect, and Soothing Ballad affects the caster and up to 9 allies.

## Compiler (`affliction-care-compiler.js`)

- **Near miss:** also reads “If you failed to counteract the effect but you would have …”.
- **Exclusion:** also reads “… conditions that are part of curses, diseases, or a natural state of the target.”
- **Heightened:** “Add A, B, and C to the list of conditions.”, and “As 4th rank, plus add X” without a final full stop.
- **Cleansing Flames:** “You can attempt to counteract a single poison or non-curse effect imparting the … condition.” becomes a counteract `effect` by granted condition, with `afflictionTraits: [poison]` and `excludeTraits: [curse]`.
- **Empower:** “The target can choose to empower the flames with their life force, becoming Drained 1 … to grant you a +1 circumstance bonus to your counteract check.” becomes `empower`.
- **Several targets:** Target `you and up to 9 allies` becomes recipient `targets` (up to 10, including the caster), with “Choose one of the following three effects:” and list items:
  - counteract fear effects on the targets (`pick: any`);
  - counteract effects imposing paralysis;
  - restore 7d8 Hit Points to the targets.
  - Heightened (+1) “When used to heal, … restores 1d8 more Hit Points.” is checked against the healing entry's interval heightening.
- **Target reading:** `target-predicate-compiler.js` reads `you and up to N allies` like `1 ally`: the caster picks.

## Runtime (`affliction-care-runtime.js`)

- **Candidates:** Pseudo Afflictions afflictions with an `afflictionTraits` trait that grant one of the listed conditions (`grantedBy`) are offered, with their DC and counteract rank suggested. Excluded traits are never offered.
- **Empower:** when ticked, the target gains Drained 1 (or +1), and the counteract roll gets a PF2e `Modifier` (+1 circumstance).
- **Several targets:** `#startMany` checks the target count, runs the chosen option on each target and shares one healing roll. The dialog has one fieldset per target, and picks carry `actorUuid`. One card lists every target's results.

## Coverage

**New:** Clear Mind and Sure Footing (Phase 2), Cleansing Flames (Phase 2), Soothing Ballad (Phase 4, Healing group).

**Census:** **365 enabled**, up from 361.
- The corpus diff against b50 changed exactly these 4 plans. All 21 care-route plans are executable.
- The speed, escape and six rule-family checks report 0 regressions.

**Left in the family:**
- Elemental Counter, Spell Turning;
- standing wards (Spell Immunity, Veil of Privacy, Rigid Form, Planar Seal, Truesight, Planar Tether);
- counteracts inside other routes: light and darkness along a ray or burst (Moonlight Ray, Radiant Beam, Moonburst, Sunburst, Eclipse Burst, Inner Radiance Torrent); Detonate Magic (counteract plus explosion); Quench; Swallow Light; Thief of Fortune; Symphony of the Unfettered Heart (Performance check);
- area auras (Astral Labyrinth, Dispelling Globe, Carrion Mire …).

## Evidence

**Automated:** 398/398 tests pass. `test/counteract-care.test.js` adds:
- Clear Mind's and Sure Footing's plans and their conditions by rank;
- Cleansing Flames' plan, and the refusal of a changed empower type;
- Soothing Ballad's three options and target count;
- the refusal of a wrong healing heightening.

[Live evidence](phase-4-counteract-many-live-results.json) on Foundry 14.367 / PF2e 8.5.0 / Pseudo Afflictions, `pftest`, case `counteractMany`:
- **Clear Mind:** a Frightened-granting effect was counteracted, and Frightened was gone.
- **Sure Footing:** a Grabbed-granting effect was counteracted.
- **Cleansing Flames:**
  - A curse-trait effect wasn't eligible.
  - With the empower box ticked, the target became Drained 1. The roll carried `care-empower +1 circumstance` next to the base +14, and the plain Enfeebled effect was counteracted.
  - A Spider Sting poison, whose stage grants Enfeebled, was offered and cured.
- **Soothing Ballad:**
  - The caster and two allies each regained 32 HP from one 7d8 roll.
  - Fear effects on both allies were counteracted, each against its own DC and rank.
- **Regressions:** `counteractSetAside`, `counteractCare` and `counteractSpells` were rerun, and all passed. `care` failed twice, for two reasons outside this batch's code:
  1. **A test assumption, fixed in the harness.** “DC 80 never counteracts” is false when the roll is a natural 20. That raises the critical failure to a failure, and a failure still counteracts ranks below the cast rank. Ectoplasmic Expulsion (rank 5) did counteract a rank-3 effect, correctly. The DC 80 checks now use a target rank at least the cast rank: Ectoplasmic Expulsion 5, Spell Riposte 7, Disjunction 9. `counteractSpells` passed with the new ranks.
  2. **A real race in older code, fixed.** Take its Course's persistent-poison step restores the condition's normal flat-check DC after the check. When the check succeeds, PF2e deletes the condition, and the restore could hit the server after the deletion (“… does not exist in the EmbeddedCollection”). A missing condition is now accepted.
  - After both fixes, `care` passed three times in a row.
  - Five direct Take its Course casts with the DC 5 flat check followed: three ended the condition with no error, and two continued with DC 15 restored.
  - Cleanup ran after each.
