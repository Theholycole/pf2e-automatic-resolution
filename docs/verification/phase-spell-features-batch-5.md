# Spell features batch 5: items that cast a spell with numbers of their own

2026-10-05, from the spell features audit (`docs/planning/spell-features-audit.md`).

PF2e gives these no way to cast. Its spellhearts carry no rules, only Effects for the player to apply by hand. The items covered:

- 119 spellhearts;
- 6 weapons and charms that cast one spell: Dragon's Eye Charm, Sky Hammer, Searing Blade (and Greater), Trident of the Azarketis (and Greater);
- the Spell Reservoir rune.

## Reading

`src/compiler/item-casts.js` reads PF2e's text into three parts. All 119 spellhearts and the 6 weapons and charms are read.

- **The casts.** "Activate Cast a Spell Effect You cast Frostbite."; "You cast a 6th-rank Hydraulic Torrent." Each cast has:
  - its rank: as stated, else the spell's own (a cantrip at half the item's level, rounded up);
  - its frequency;
  - its tradition, when stated.
- **The numbers.** "The spell DC of any spell cast by activating this item is 34."; "… spell attack modifier … is +20, and the spell DC is 30." If only one is stated, it gives the other (DC = 10 + attack). Searing Blade uses the wielder's Strike modifier with the blade.
- **The benefit after such a cast**, by where the spellheart is affixed (armor, weapon, melee or ranged weapon) and which spells qualify:
  - which spells: any spell, a non-cantrip, or a trait;
  - a legacy school ("an enchantment spell") counts as the spellheart's own spells;
  - the benefit itself: PF2e's linked Effect when there is one; else one built from the text (extra dice on the affixed weapon's Strikes, Concealed until the next turn); else a note.

## At the table

`scripts/item-cast-runtime.js`:

- **The item's card offers its casts.** Target first, then press the button.
- **The cast goes through PF2e,** from an innate entry of the item's own, so the module's cards, spellshapes and riders all follow it.
  - An NPC's entry states the item's numbers (PF2e's `spelldc`).
  - A character's entry is proficient with a PF2e SpecialStatistic made for the item. Its modifier is calibrated on each cast so the entry's attack is the item's.
- **Then the benefit where the spellheart is affixed,** if the spell qualifies:
  - PF2e's Effect, with its grade picked (the choice keyed to the spellheart's slug) and the affixed weapon picked;
  - else the text's own Effect;
  - else a note Effect for the duration.
- **Sky Hammer:** the GM is told the hammer centres the Fireball and its wielder is immune.
- **Spell Reservoir:**
  - When a fitting spell is cast (3rd rank or lower, 2 actions or fewer, targets other than the caster) by a creature whose weapon has an empty reservoir, a card offers to store it. Storing it means the cast has no effect now.
  - A hit with the weapon offers the Channeled Release: the stored spell is cast at the Strike's target from the rune's entry at DC 30.
  - For a spell attack, the GM is told the Strike's result is the spell's.

## The table's

- frequencies;
- whether the deity allows holy or unholy (Judgment Thurible);
- the breath activities and "your next Strike …" benefits, which are note Effects;
- the summon's creature by where the spellheart is affixed, which is told on the cast.

## Tests

`test/spell-features-batch-5.test.js` (4) covers:

- every spellheart read;
- the numbers' wordings;
- the built benefits and notes;
- the weapons and charms.

## Evidence

[Live evidence](phase-spell-features-batch-5-live-results.json), case `spellFeaturesBatch5`, in the `pftest` world. A level 13 character, with the spellhearts affixed and the rune etched by PF2e's `attach`.

| Step | Result |
| --- | --- |
| Rime Crystal (Major) on a longsword: its card | 3 casts |
| Frostbite | Rank 7 (half the item's level 13); the entry's DC 30, attack +20; the cold weapon benefit |
| Ice Storm | Rank 4, DC 30; PF2e's "Effect: Rime Crystal - Weapon" with the longsword picked |
| Thirsty Chalice on leather armor: Draw Moisture | Concealed for 1 round (built from the text) |
| Dragon's Eye Charm | Ignition at rank 5, attack +13 |
| Searing Blade | Ignition at rank 7, attack equal to the blade's Strike modifier |
| An NPC's Trident of the Azarketis | Hydraulic Torrent at rank 5, DC 29 |
| Spell Reservoir: Fear cast | The store card; stored; the cast lost ("cast into … Spell Reservoir") |
| The longsword hits | The release card; Fear cast at DC 30; the reservoir empty |
