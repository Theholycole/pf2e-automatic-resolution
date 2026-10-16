# Spell features audit: class features, feats, items and rules that build on spells

2026-10-05. The user asked: "audit and implement all of them".

## Method

- I searched PF2e's feats (6284), class features (874), equipment (5869) and familiar abilities (111) for anything that refers to casting spells, in its text or its rule elements: 2287 matches.
- I set aside items that only cast a spell (405 scrolls, wands and staves), because the module already resolves their spells.
- I read the rest by group.
- I checked live whether PF2e's own rules reach the module's casts (`spellFeatureProbe`).

## Already working (PF2e's rules reach the module's casts)

The module rolls a spell's damage and healing through PF2e (`spell.getDamage`), and its attacks and saves through PF2e's statistics. So rule elements on the caster apply. Verified live:

- a +5 spell-damage bonus on Fireball's card: "{(6d6 + 5)[fire]}";
- Healing Hands' d10s on Heal: "1d10 + 5";
- a +2 spell attack bonus.

Features that work this way:

- **Healing Hands, Harming Hands:** DamageDice.
- **The bloodrager's Rising, Surging and Exultant Blood Magic:** AdjustModifier.
- **Unleash Psyche:** its action's Effect.
- **Items whose spell bonuses are rule elements.**
- **The Sorcerer bloodline's own skill and spell-list rules.**

## Nothing to resolve (bookkeeping PF2e or the player keeps)

- **Slots and preparations:** Spell Blending, Spell Substitution, Divine Font's extra slots, Clarity of Focus, Spell Battery.
- **Spellshape feats granted by a class feature:** Experimental Spellshaping and Bloodline Conduit. These are spellshape feats, done in the spellshape batches.
- **Spell Delivery:** the familiar touches for the caster. The module doesn't measure range, so this changes nothing.

## Implemented (all batches done, 2026-10-05 and 2026-10-06)

| Batch | What | Write-up |
| --- | --- | --- |
| F1 | Text-built damage gets PF2e's spell-damage rules: 20 save spells and the Effect runtime's text-damage path roll through PF2e (`scripts/text-spell-damage.js`) | `docs/verification/phase-spell-features-batch-1.md` |
| F2 | Sorcerer blood magic: 18 bloodlines read from PF2e's text; the card when a blood magic spell is cast; Tenacious Blood Magic, Blood Sovereignty, Blood Rising and Blood Ascendancy; Hag's spite | `phase-spell-features-batch-2.md` |
| F3 | Casting rules: Stupefied's flat check, Steady Spellcasting, Communal Healing, Counterspell (with Master's and Mythic); a lost spell's cards refuse | `phase-spell-features-batch-3.md` |
| F4 | 27 items whose activation is a spellshape (18 kinds: grimoires, rings, tattoos, runes, a scythe, a potion) | `phase-spell-features-batch-4.md` |
| F5 | Items that cast a spell with their own numbers: 119 spellhearts (and their benefits after a cast), 6 weapons and charms, Spell Reservoir | `phase-spell-features-batch-5.md` |
| F6 | Items that act on a cast: Rune of Sin, Book of Warding Prayers, Reflecting Shield, Spell Duelist's Siphon | `phase-spell-features-batch-6.md` |
| G1 | Conditions on casting: Restrained, Grabbed, Deafened, Fascinated, Confused; concealed and hidden targets' flat checks | `phase-spell-features-batch-7.md` |
| G2 | Actions: Spellstrike and the shots, Intercession Spell, Dueling Counter, Absorb into the Aegis, Only You and I, Ring Bell, Draw From the Pages | `phase-spell-features-batch-8.md` |
| G3 | Creature abilities (111 read from the glossaries): aura and reaction counteracts, Intercept Summons, Blasphemous Aura, Eldritch Attraction, Warped Fulu, Channel Magic, Metamagic Alteration | `phase-spell-features-batch-9.md` |
| G4 | The rest of PF2e (ancestries, heritages, backgrounds, deities, boons and curses, Society boons, adventure actions, Kingmaker, campaign Effects): Nethys's and Sarenrae's curses, River's Reflection | `phase-spell-features-batch-10.md` |

The second round (G1–G4, 2026-10-06) followed the user's "audit and implement all of them" for the conditions, actions, creature abilities and the compendiums the first round hadn't searched.

The other spell-stat and counteract items are classified in `phase-spell-features-batch-6.md`. They are PF2e's own rules, GM notes, or items that only name spell attacks in a trigger. Of the familiar abilities, Spell Delivery is the one that touches casting; it's under "Nothing to resolve".

Each batch has:

- a reader or runtime;
- unit tests (`test/spell-features-batch-N.test.js`);
- a live case (`spellFeaturesBatchN`, batch 4 as 4a and 4b);
- its write-up;
- its interpretations in `docs/planning/pending-user-decisions.md`.

## PF2e 8.6 (2026-10-16): Lost Omens Cheliax, Infernal Inheritance

The new book's 244 non-spell items were searched in pftest's PF2e 8.6.1 packs: 67 mention spells. By group:

- **Built:**
  - Painful Spell: a spellshape, 1d4 nonlethal mental per rank, and the caster takes the rolled amount past its resistances.
  - Invoke Infernal Potency: an innate Fear or Spiritual Armament heightened to half the level less 1, and doomed raised by 1.
  - And Yet it Still Hurts: a disbelief attempt against the caster's illusion deals nonlethal mental damage equal to twice the rank (`scripts/disbelief-pain.js`, on all four disbelief rolls).
  - Ferocious Gust: Gust of Wind cast from a temporary entry at the higher of the class DC and spell DC (its lingering area placed as usual).
  - The tests are in `test/cheliax-batch-3.test.js`; the live cases are `cheliaxBatch11` and `cheliaxBatch12`.
- **PF2e's own rules:**
  - Frightful Figment: its +2 to Intimidation, with Figment's 8.6 Effect.
  - Mocking Invisibility: its Effect.
  - The Devil Inside, Swamp Gas Form, Shadowy Disguise, Ancestor's Transformation and the like: their Resistance, Weakness, BaseSpeed and ItemAlteration rules.
- **Innate or focus spells granted:** 24 feats, plus the two school class features. The module resolves the spells themselves.
- **The item module's:** the items' activations that cast a spell, and the consumables:
  - Soulpiercer's Phantom Pain (DC 28).
  - Crown of the New Moon's Moonlight Ray (+22).
  - Exploitative Wealth's paranoia (DC 19, the −2 when outnumbered).
  - Pit's Protection's Diabolical Mantle.
  - Illicit Knowledge's Hypercognition.
  - Limitless Power.
  - Devil's Trap, Night Sky Elixir and Megaphone Mutagen.
- **Not spell features:** actions that only use the class or spell DC: Inflict Punishment, Call Hellfire, Death of Hope, Impose Order, Condemn Soul, Know I Approach, Submit to Shadow, Stranglehold, Annul Compulsion.
- **Not built:**
  - Swamp Gas Form's fire returned to a 10-foot emanation when it takes fire damage.
  - The thaumaturge's Adept Benefit (Censer): the smoke's save when an enemy Casts a Spell within it.
