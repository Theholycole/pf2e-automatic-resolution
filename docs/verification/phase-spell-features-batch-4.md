# Spell features batch 4: items whose activation is a spellshape

2026-10-05, from the spell features audit (`docs/planning/spell-features-audit.md`).

27 PF2e items (18 kinds) have an activation with the spellshape trait: "If your next action is to Cast a Spell …". They include grimoires, rings, tattoos, runes, a scythe and a potion.

## Reading and arming

- **The reader:** `src/compiler/item-spellshape.js` reads each activation from PF2e's text into three parts:
  - **the spell it takes:** prepared, a trait, healing, a rank cap, or an attack roll;
  - **its riders;**
  - **what the activation does at once.**

  All 27 are read. A sentence it doesn't know leaves the item unread.
- **Arming:** posting the item's card arms it for the caster's next spell this turn, as a spellshape feat's card does. The Codex has two activations; the GM picks one (or the card's flag presets it). Djezet Dose asks Reach or Widen.

## What each item does

| Item | At the table |
| --- | --- |
| Shadow Signet | The spell attack is made against the chosen Fortitude or Reflex DC: the roll gets AC − that DC, the same degree as rolling against the DC |
| Codex of Destruction and Renewal | Damage: resistance 10 ignored, and every damage die rerolls a 1 (Foundry's `r1`); the 0 HP death effect is a GM note. Healing: regeneration 20 for 4 rounds on the healed creature |
| Bloodstained Treatise | 1d6 persistent bleed on every target (if the spell already bleeds, its bleed formula is raised by 1d6). The blood around one chosen target's space: creatures beginning their turn within 5 feet make the Reflex save or fall prone, for 1 round |
| Radiant Tome | Bright light 15 feet around the caster (a TokenLight rule) for 1 minute. Enemies beginning their turn in it make the Fortitude save: blinded until the caster's next turn, plus dazzled for 1 minute on a critical failure; immune for 1 minute on a critical success |
| Sparking Grimoire (and Greater) | +2d6 electricity on the caster's Strikes (and every ally's, Greater) until the end of the caster's next turn. A creature targeting the caster with a melee Strike or a touch spell gets the basic Reflex card |
| Hundred-Moth Caress | Activating it deals 1d10 to the wielder (no resistances or immunities); the spell deals that much more void to each creature it damages |
| Juubun's One Thousand Poems | A targeted ally gets PF2e's Effect (10 temporary Hit Points, 1 minute); an enemy that fails its save is Sickened 1 |
| Liar's Lexicon | The spell gains the linguistic trait; the caster's Deception (Lie) is rolled against the Perception DC of every creature not allied, and the GM is told who was fooled |
| Book of Endless Walls | A card for the GM: the targeted creature makes the Will save (concealed or hidden Effects by degree), then is immune for 24 hours |
| Amazing Pop-up Book | A card for the GM: mental damage equal to the rank to the creature that succeeded (not critically) at disbelieving |
| Summoning Handscroll | A card: 10 temporary Hit Points for 1 minute to one summoned creature, once |
| Architect's Pattern Book | The room is a GM note; a card gives PF2e's well-rested Effect to the targeted characters |
| Dragon's Breath runes, Reflexive Tattoo, Djezet Dose | The spell gains the feat's effects: Widen Spell, Conceal Spell, Reach Spell (read with the feat's own reader and requirements) |
| Nine Void Sleeves | The spell gains the shadow trait; losing manipulate is the table's |
| Star Chart Tattoo | The constellation Effect on the targeted creature within 30 feet. Each spell with a range at that creature alone winks out a star; the third ends it |
| Communion Mat | The familiar's Sustain is a note to the GM |

## The table's

- whether the spell is from this grimoire;
- the depicted dragon's damage type;
- the wall spell, and the blood-manipulating spell;
- the frequencies.

## Tests

`test/spell-features-batch-4.test.js` (6) covers:

- every item read;
- the requirements;
- the Codex, the areas, Sparking Grimoire, Shadow Signet, Hundred-Moth Caress;
- the cards, the Lie, the poems, the constellation and the potion.

## Evidence

[Live evidence](phase-spell-features-batch-4-live-results.json), cases `spellFeaturesBatch4a` and `spellFeaturesBatch4b`, in the `pftest` world. The caster is a level 13 character with prepared entries.

| Step | Result |
| --- | --- |
| Shadow Signet, Ignition at a foe with AC 40 and Fortitude DC 5 | Fortitude chosen; a critical success |
| Codex (damage), Fireball at a foe with fire resistance 10 | "6d6r1 fire", 21 rolled, 21 lost |
| Codex (healing), Heal on the ally | "regeneration 20": FastHealing (regeneration) 20, 4 rounds |
| Bloodstained Treatise, Fireball | 1d6 persistent bleed; the 5-foot area |
| Radiant Tome, Light | The 15-foot area and its bright light |
| The foe's turn begins | Prone (the blood), blinded and dazzled (the light) |
| Sparking Grimoire (Greater), Electric Arc | Strike dice on the caster and the ally; the foe's claw at the caster opens the basic Reflex card |
| Hundred-Moth Caress, Void Warp | 2 to the wielder; Void Warp's 25 plus 2 more |
| Juubun's, Command on the ally | PF2e's Effect; 10 temporary Hit Points |
| Liar's Lexicon, Fear | Linguistic gained; the Lie fooled the foe |
| Book of Endless Walls card | Critical failure: hidden 1 round, concealed 10 rounds; the second time, immune |
| Pop-up Book card, Illusory Object | 1 mental damage |
| Summoning Handscroll card | 10 temporary Hit Points; a second use refused |
| Architect's Pattern Book card, Cozy Cabin | PF2e's Effect on the ally |
| Djezet Dose (Widen), Fireball | The burst 20 → 25 feet |
| Star Chart Tattoo; Electric Arc at the foe alone | 3 stars, then 2 |
| Nine Void Sleeves, Void Warp | The shadow trait |
