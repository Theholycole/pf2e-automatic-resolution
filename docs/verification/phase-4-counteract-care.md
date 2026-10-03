# Counteract family (part 1) — verification

2026-09-26. The user chose the **counteract** family over the Attack group's remaining one-off spells. A counteract check blocks 90 spells across all phases, 31 of them in Phase 4. This first part builds the counteract check itself and the spells that use it on a creature's effects or afflictions.

## Rule

- **The roll:** the caster rolls PF2e's counteract statistic (the spell's spellcasting entry's `counteraction`, falling back to its spell statistic) against the counteract DC of the thing being counteracted. The counteract rank is the cast rank.
- **The result (`counteracts`):** a critical success counteracts up to rank +3, a success up to +1, and a failure only lower ranks; a critical failure never does.
- **DC and rank:** the GM confirms them in the dialog, which suggests:
  - for a Pseudo Afflictions affliction: its save DC, and half its level rounded up;
  - for a spell's Effect: its level, and the originating actor's spell DC when known.
- **Outcome:** a counteracted Effect is deleted (its granted conditions go with it), and a counteracted affliction is cured.

## Compiler (`affliction-care-compiler.js`)

The route takes `1 creature`, `1 willing creature`, no Target (the caster: “affecting you”), and `1 spell effect or unattended magic item` (a counteract against “the target”). A sentence about “you” or “the target” must match the recipient.

| Sentence | Operation |
|---|---|
| “Attempt a counteract check against one emotion effect affecting you.” | counteract, `effect`, traits [emotion] |
| “Attempt a counteract check against the target.” (+ the magic item and artifact sentences) | counteract, `spell-effect`, `otherTargets`; `magicItem`, `artifactFails` |
| “Deal poison damage equal to the spell's rank to the target, then attempt a counteract check against one disease or poison afflicting the target.” | `damage` (`@item.rank` poison entry), then counteract `affliction` |
| “If the target is immune to poison, this spell has no effect.” | `negatedByImmunity` |
| “You heal yourself in one of the following ways …” + list items | modes `heal` (the healing entry) / counteract `affliction` |
| “Choose an affliction on the target … reduce the stage by one … only once to a given case …” | reduce-affliction-stage (once per exposure) |
| Heightened “Attempt to counteract the affliction if it is a disease or poison.” | counteract `chosen-affliction` at that rank |
| Heightened “You can attempt counteract checks against any number of …” | counteract `pick: any` |
| Heightened (+N) “If you choose to regain Hit Points, the Hit Points regained increase by 8.” | checked against the healing entry's interval heightening |

## Runtime (`affliction-care-runtime.js`)

- **Recipients:** the caster (no target needed); exactly one targeted creature; or, for `counteract-target`, none (an area or item named by the GM).
- **Dialog:** one row per candidate, with a pick box and the DC and rank to confirm. For an area or item, there's a name, a kind, the DC and rank, and an artifact box.
- **Area or item results:** “end it”, or the item becomes mundane for 10 minutes. These are GM steps. An artifact fails without a roll.
- **`damage`:** a PF2e `DamageRoll` of `<rank>[type]`. **`heal`:** the spell's own PF2e healing roll, with the Dying rule.
- **Without Pseudo Afflictions:** a counteract against an affliction becomes an exact GM instruction.
- **Existing spells:** Ectoplasmic Expulsion's counteract uses the same code. Its choice shape changed from `{counteract: {effectId, dc, rank}}` to `{counteracts: {effect: [...]}}`.

## Coverage

**New:**
- **Empty Inside:** counteracts one of your emotion effects; any number at 5th rank.
- **Dispel Magic:** a spell's Effect on a creature, or a named area or item, with the artifact and magic-item rules.
- **Purging Toxins:** poison damage equal to the rank, a counteract against one disease or poison (any number at 5th rank), 24-hour immunity, and no effect on a poison-immune target.
- **Harmonize Self:** regain 8 HP, or counteract your own poison or disease.
- **Cleanse Affliction:** reduces the stage once per case, and from 3rd/4th rank counteracts that affliction.

**Census:** **353 enabled**, up from 348 (Counteract: 4 of 22; Healing: 18 of 60).
- The corpus diff against b47 changed exactly these 5 plans.
- The four existing care spells gained only `recipient: "target"`.
- The speed, escape and six rule-family checks report 0 regressions.

**Next in the family:**
- Delay Affliction (suspend instead of end), Sound Body (suppress at 2 ranks lower) and Luminous Stardust Healing (possession, 1-week immunity);
- Soothing Ballad (up to 10 targets);
- counteracting a triggering spell (Spell Riposte, Nullify, Elemental Counter, Spell Turning, Shadow Siphon);
- standing wards (Spell Immunity, Veil of Privacy, Rigid Form);
- counteracts written into other routes' outcomes (Moonlight Ray and others in Phases 2–3).

## Evidence

**Automated:** 391/391 tests pass. `test/counteract-care.test.js` covers:
- the degree reach and the affliction counteract rank;
- each spell's plan, and each spell at the ranks where it changes;
- **refusals:**
  - “affecting you” with a Target;
  - Dispel Magic without the full item-rule set;
  - a damage entry of the wrong type;
  - a Heightened (+1) sentence that doesn't match the item's heightening.

[Live evidence](phase-4-counteract-care-live-results.json) on Foundry 14.367 / PF2e 8.5.0 / Pseudo Afflictions, `pftest`, case `counteractCare`. DC 1 always counteracts and DC 80 never does, so the results are deterministic.
- **Empty Inside:**
  - An emotion effect was counteracted (critical success, rank 1 vs 1).
  - Against DC 80 the effect stayed (critical failure).
  - A non-emotion effect was refused as a choice.
  - At rank 5, two emotion effects were counteracted in one cast.
- **Dispel Magic:**
  - A non-spell Effect was refused.
  - A rank-3 spell Effect was counteracted by a rank-2 cast (critical success reaches rank 5).
  - With no creature targeted: an area gave “end it”, an artifact “automatically fails” with no roll, and a wand became mundane for 10 minutes.
- **Purging Toxins:** 3 poison damage, a Spider Sting affliction cured, and 24-hour immunity. A poison-immune creature was unaffected (no damage).
- **Harmonize Self:** healed 10 → 18 HP, then cured its own Spider Sting.
- **Cleanse Affliction:**
  - Rank 2 reduced the stage 2 → 1.
  - A second cast was refused (“already lessened”).
  - At rank 3 the same affliction was cured by the counteract.
- **The dialog, by hand:** Empty Inside's dialog listed the caster's remaining emotion effect, with the rank suggested. Picking it with DC 1 counteracted it.
- **Regression:** the existing `care` case (Restorative Moment, Restoration, Take its Course, Ectoplasmic Expulsion) passes. Cleanup ran.

**Not tested live:** the no-Pseudo-Afflictions fallback for an affliction counteract (the `noHandler` case needs that module disabled).
