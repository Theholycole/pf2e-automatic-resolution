# Spellshape feats and spell-changing wands

Started 2026-10-05. The goal is for every spellshape feat (131 in PF2e 8.5) and every wand that changes how its spell works to resolve through the module.

The data is exported from the Foundry compendiums to `.cache/pf2e-spellshape-fixtures/` (and `/tmp/pf2e-release-fixtures/spellshape-content/`): `feats/`, `wands/` and `effects/` (the feat and equipment Effects they link).

## How PF2e handles them

- **Spellshape feats.** Each feat adds a "Spellshape" selector to the character's spellcasting (a toggleable `RollOption`, option `spellshape`, one suboption per feat).
  - When it's on, `spellshape:<feat>` is a roll option. The feat's `ItemAlteration`s change the spell's derived data (Widen Spell: a 20-foot burst becomes 25) and add the feat's text to the description. A few have a `DamageAlteration` (Chaotic Spell's type).
  - The cast's chat message records the selection in `flags.pf2e.context.options` (`spellshape:widen-spell`) and the altered spell in `flags.pf2e.origin.rollOptions` (`origin:item:area:size:25`).
  - PF2e does **not** switch the selector off after the cast, though a spellshape applies only to the next spell.
  - Everything else in the feats (their riders) is text only.
- **Wands.** A wand casts its embedded spell (`flags.pf2e.casting.embeddedSpell`); the module already rebuilds that spell from the card. The wand's extra rule is text only (Wand of Widening and Wand of Dazzling Rays also have rules).

## The module's core

1. **Read the cast's spellshapes and wand.** From the spell card's roll options (`spellshape:<feat>`) and its origin (the wand item, when the spell came from one).
2. **Switch the selector off** once the spell is cast.
3. **Compile from the shaped spell.** Its area and range as altered; Reach Spell's +30 feet (PF2e doesn't alter the range); a wand's own changes.
4. **Riders.** Each feat or wand becomes a rider spec. The save, attack or damage resolution applies it to the creatures it names ("each creature that fails its save", "a creature damaged by the spell", "the target", "you").

## Families

| Family | Feats | Wands |
| --- | --- | --- |
| A. Area, range and origin | Widen Spell, Growth Spell, Spiritual Expansion Spell, Reach Spell, Grasping Spirits Spell, Touch Focus, Knowledge of Shapes, Familiar Conduit, Natural Conduit, Reach of the Dead, Seneschal Spell, In Tune | Widening, Reaching, Crackling Lightning (double line) |
| B. Riders on failed saves, hits or damaged creatures | Intimidating, Dizzying, Scintillating, Thunderclap, Reverberating, Portentous, Daunting, Knockback, Cast Down, Overburdening, Chaotic, Branding, Shadow, Dousing, Tender Ministrations, Kaleidoscopic Entreaty | Smoldering Fireballs, Clinging Rime, Noisome Acid, Dumbfounding Doom, Splintered Sorrows, Dazzling Rays, Tormented Slumber, Wearying Dance, Contagious Frailty, Paralytic Shock, Pernicious Poison, Toxic Blades, Hopeless Night, the Spider, Caustic Effluence, Mental Purification, Arboreal Wand, Crackling Lightning (Off-Guard), Fey Flames, Choking Mist, Legerdemain |
| C. Extra damage and blasts | Burning, Consecrate, Infuse Void, Sinbladed, Harrow Casting, Detonating, Energy Fusion, Heraldic Proclamation, Marked for Rebuke, Forcible Energy, Explosive Arrival, Ostentatious Arrival, Explosive Metamorphosis, Secondary Detonation Array, Thundering Surge, Vexing Tempest, Vengeful Spirit Deck, Coven Spell | Slaughter, Shattering Images, Shocking Haze, Hawthorn, Chromatic Burst, Refracting Rays, Shardstorm, Thundering Echoes, Teeming Ghosts |
| D. Damage type and resistances | Chaotic (type), Spiritual Secret, Golden Dragon's Bounty, Overwhelming Energy, Surging Might, Overwhelming Breath, Nonlethal, Steam Spell, Bizarre Transformation | Mercy |
| E. Caster and ally benefits | Vampiric, Energy Ablation, Elemental Defense, Current Spell, Dualistic Synergy, Safeguard, Spell Shroud, Gusting, Skeletal Extension, Familiar's Resolve, Shared Sight, Defensive Coordination, Courageous Advance, Courageous Assault, Courageous Onslaught, Vigorous Anthem, Call and Response, Harmonize, Shield Spell Reinforcement, Apparition's Reflection, Mystical Flare | Shrouded Step, Spiritual Warfare |
| F. Healing and harm | Defensive Recovery, Divine Infusion, Heroic Recovery, Martyr, Cleansing, Purifying, Ebb and Flow, Echoing Channel, Healing Transformation, Blessed Spell, Command Undead, Remediate, Interweave Dispel | Overflowing Life, Purification |
| G. More targets | Contagious Spell, Split Shot, Split Hex, Tempest-Sun Redirection | Refracting Rays |
| H. Terrain | Charred Remains, Garland, Rockslide, Snowdrift, Worldsphere Gravity | Rolling Flames, the Snowfields, Crushing Leaps |
| I. Time | Into the Future, Sow Spell, Form Control, Echoing Spell | Continuation, Hybrid Form |
| J. Casting itself | Conceal, Cryptic, Melodious, Humble (subtle: PF2e's trait); Quickened Casting, Apparition's Quickening, Galvanize, Quickened Attunement (actions); Bloodline Conduit, Ley Line Conduit, Mystery Conduit, Unlimited Potential, Sepulchral Sublimation, Bond Conservation, Recover Spell, Look Again, Synergistic Spell, Unstable Patronage, Cascade Bearer's Flexibility (slots and uses); Battlefield Arcana, Elaborate Flourish, Incriminating Spell, Through Spell, Wind-Tossed Spell, Unusual Composition, What Could Have Been (perception, cover, reactions); Mythic Casting, Mythic Heightening, Heightened Captivation, Simple Mastery (rank or proficiency) | Magic Wand, Pistol Wand, Wand Cane, Cyrusian Wand, the Pampered Pet, Traitorous Thoughts |

Family J changes how the spell is cast, not what it does: actions, slots, subtlety, cover, who notices. PF2e and the table track those.
- The module does the mechanical parts: a rank or DC change (Mythic Heightening's rank, Mythic Casting's proficiency), and a spent slot given back (the Conduits) where PF2e's data allows it.
- The rest are listed as resolved with a GM note.

## Order of work

The core first, with family A (it proves the shaped spell and the selector switching off). Then B, C, D, E, F, G, H and I, each built, unit-tested and live-tested on its feats and wands, as with the spell groups.

## Status (2026-10-05)

- **Every spellshape feat is read: 131 of 131.** Each is either applied by the module, or read as the table's or a GM note where the rule is the players' or the GM's (subtle, actions, cover, a harrow deck).
- **Every wand kind is read: 49 of 49.**
  - Each wand's mechanics are applied where its text states them.
  - Batches 16–18 (the user: "automate as much as you can"): the wands whose rules had been GM notes are now applied by watching Effects, template riders, turn-start effects and card buttons. These are Hawthorn, Shocking Haze, the Spider, Traitorous Thoughts, Shardstorm, Thundering Echoes, Continuation, the Ash Puppet, Contagious Frailty, Choking Mist, Fey Flames, Caustic Effluence, Toxic Blades, Refracting Rays, Chromatic Burst, Legerdemain, Teeming Ghosts, Shattering Images and Rolling Flames.
  - What is still told to the GM as the spell is cast: Hybrid Form, Purification, Shrouded Step and Spiritual Warfare's rules; the Cyrusian Wand's reroll; Caustic Effluence's object uses; and the 6th-rank Pernicious Poison.
  - Wands that only cast their spell (Magic Wand) need nothing.
- Batches 1 to 18 are live-tested (`docs/verification/phase-spellshape-batch-*.md`). The interpretations are in `docs/planning/pending-user-decisions.md`.
- Not automated, by design:
  - ranges and origins (the module doesn't measure them);
  - spell attack rolls at mythic proficiency;
  - pushes and pulls with an "up to" distance, any direction, or an action or per-hit limit stay the GM's. Others are moved by the module (`forced-movement.js`), which never ends one in another creature's space; it ends adjacent instead;
  - creatures moving into or out of terrain (the GM reports a move, except a turn ending inside).
- Sinbladed Spell: any spell cast with it counts (the user's answer; the Runelord's sin spells aren't marked). Halcyon spells aren't marked, so Dualistic Synergy's halcyon "both benefits" is the GM's.
