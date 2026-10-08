# Rank 8 batch 11 — incarnates by parts (feature group 1)

2026-10-05. The user's instruction: "all other group features i want you to build the feature and then test it on their spells until they are resolved". Group 1 was the nineteen rank 6–10 incarnates and named summons that the narrower readers (`incarnate.js`, `incarnate-squadrons.js`) don't take.

The new reader is `src/compiler/incarnate-phases.js`, with `compileIncarnateParts` in `compile-ability.js`. It reads each manifestation's Arrive and Depart, sentence by sentence, into parts. Any sentence it can't read refuses the whole spell; the spell is never partly automated. `inspectIncarnatePlan` in `basic-save-core.js` then checks every part the way the runtime will carry it out.

| Part | What the card does | Spells |
| --- | --- | --- |
| Save | The phase's own save card, built from the lead and its riders (or explicit rows), at the cast rank. | All of them |
| Save that repeats | Pressed again on each reported trigger. | Kaiju (Vorgozen), Warden of Forests and Meadows |
| Immunity after a critical success | For a critical success, the card refuses the creature for that many rounds. | Warden of Forests and Meadows |
| Alternatives | Using one uses up the other. | Warden of Oceans and Rivers (in or out of water) |
| Tradition and damage type | One manifestation per tradition; each blast's type is picked from that tradition's two. | Incarnate Draconic Legion |
| Spell attacks | One attack roll for each target, up to the stated count. | Ancient Fleshforged (Thorn Caller) |
| Lingering cloud | A lingering area the GM places, with concealment and the stated saves. | Unholy Army (Demons), Kaiju (Yarthoon) |
| Concealing cloud by trait | The cloud's members get conditions or senses based on their traits. | Holy Host (Angels) |
| Damage, no save | One roll, applied to the creatures the GM targets, up to the stated count. | Archmage, Wild Rose, Elemental Herald (Wood) |
| Healing | One roll, applied to the allies the GM targets. | Holy Host (Azatas), Beseech Arcanotheign |
| Generated Effect | A d20 floor or ceiling, a fortune, or granted conditions, for the spell's time. | Summon Irii, Deific Herald (Quickened), Fleshforged (Thorn Caller's light) |
| PF2e's linked Effect | Applied to the allies the GM targets. | Holy Host (Azata, Garuda), Conquering Soldiers |
| Conditions reduced | The listed conditions lowered by the stated amount. | Conquering Soldiers |
| Spell the manifestation casts | That spell's own route, at the stated rank or action version, cast through the caster's entry. "Reduced to 3 rounds" shortens the Effects it makes. | Deific Herald (Divine Wrath, Heal, Wave of Despair), Summon Warden of the Wild |

New runtime:

- **`scripts/d20-clamp.js`** wraps PF2e's check roll. A module Effect's d20 floor or ceiling sets the die before PF2e grades the check.
- **`scripts/incarnate-parts-runtime.js`** carries out the damage, healing, Effect and condition parts. It also deals a note's damage as its creature's turn starts.
- **Note Effects** carry `d20Clamp` and `turnStartDamage`.
- **The save card** has a fixed-modifier Counteract (Midnight Wrath: +25, rank 8).
- **`rowDealsPersistent`** also reads rows that are only formulas.

Interpretations (logged in `docs/planning/pending-user-decisions.md`):

- Holy Host's angel smoke has no stated duration. It lasts 1 minute, like Unholy Army's smoke, and the GM can end it sooner.
- Archmage's held spell durations, the Shield block, Oliphaunt's powdered bodies and destroyed objects, and Arcanotheign's memory price are GM reminders.
- Wild Rose's vines hold "for the duration or until Escape". They're held until the creature Escapes, and the card notes the spell's end.
- A spell a warden casts with no stated rank uses that spell's own rank.
- Fleshforged's "skeleton or other undead made of bones" is the GM's yes/no for each target.

## Tests

`test/rank-8-batch-11.test.js` is new. A whole-corpus compile (b767 → b769) changed only these nineteen spells.

## Evidence

[Live evidence](phase-rank-8-batch-11-live-results.json), cases `rank8Batch11`, `rank8Batch12` and `rank8Batch13`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Garden: Depart, failure, then the creature's turn starts | Grabbed; 4d6 bludgeoning as its turn starts |
| Archmage: Arrive on two creatures; Depart, failure | The same 3d4+3 force to both, no save; Stupefied 2 |
| Irii: the fate's ally rolls, then a failing enemy's | Every ally d20 at least 10; every enemy d20 at most 10; the fortune's saves roll 2d20kh |
| Holy Host: the angels' smoke; the azatas' healing | The unholy creature inside is Concealed and Enfeebled 2; the ally regains 4d10+16 |
| Deific Herald: Heal; Midnight Wrath's counteract; Quickening Ripple | The 3-action Heal at 5th rank heals the ally; the counteract at +25 succeeds; the ally is Quickened |
| Warden: Fly; Idyllic Panorama critically succeeded, then again | Fly lasts 3 rounds; the same creature is refused for 1 round, another takes the damage |
| Draconic Legion (arcane): the line with force chosen | 10d8 force |
| Unholy Army: the velstracs' chains; the demons' smoke | Persistent bleed with its –10-foot Speed penalty; a 1-minute lingering area that conceals |
| Fluxwraith: Arrive, failure | Shunted into the future for 1–4 rolled rounds, with an end-of-turn Will save |
| Wild Rose at 6th: Arrive, then Depart's damage | 3d12 piercing and Grabbed; 2d6 persistent poison |
| Kaiju: Vorgozen twice; Yarthoon's mist | Sickened 2 again; a 1-minute concealing area, turn-end damage |
| Fleshforged (Thorn Caller): Arrive; Depart attack | Dazzled and off-guard; the spell attack's damage |
| Ancient Specter: critical failure | Prone, Dazzled, and a "Can't Stand" note |
| Conquering Soldiers: Depart on an ally | Frightened 3 → 1, Clumsy 2 → 0, PF2e's Effect |
| Beseech Arcanotheign: healing on two creatures, then one | Refused (at most 1); 5d12 healing |

**Cleanup:** fixtures removed.
