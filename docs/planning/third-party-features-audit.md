# Third-party features that build on spells

2026-10-07. The user asked whether the "+" modules' feats, items and effects that affect spells were applied, then: "start and keep going until you need me".

The census tool is `tools/third-party-features-census.mjs`, and it writes `reports/third-party-features-census.json`. It sorts every non-spell "+" entry that mentions spells into a rule family from its text, and records whether the module's readers already read it. At the start, none were read.

| Family | Entries | What it covers |
| --- | --- | --- |
| spellshape | 51 | "If your next action is to Cast a Spell …" feats and actions |
| item-cast | 122 | Items whose activation casts, or uses a spell DC or attack |
| spellstrike-cascade | 73 | Magus+ Spellstrike, Arcane Cascade stances, conflux |
| cast-rider | 66 | "When you Cast a Spell …", "spells you cast …" |
| focus-pool | 34 | Focus Points, pools |
| spell-trigger | 6 | Reactions triggered by spells |
| staff / wand | 4 | Staves and wands |
| grants-spell | 135 | Feats granting a spell or hex. PF2e adds it; to check |
| spell-modifier | 201 | Spell DC, attack, damage, heightening mentions. Many are PF2e rules; to triage |
| mentions-spells | 437 | Any other mention. To triage; many are not spell modifiers |

## Method

The same method as the official spellshape and spell-features work:
- Each entry is read from its text, into the riders and requirements the spellshape runtime applies, or into a family runtime.
- The module's own rules for the entry are checked against its text. Where a module rule would double the module's rider, the rider is the one applied.
- Every interpretation is logged in `pending-user-decisions.md`.
- Batches are recorded with `finish_rank.py`, prefix `third-party-features`.

## Batches

1. Spellshape feats that fit the existing riders: Persistent Spell, Trepidation Spell, Heightened Spell, Dueling Wand, Draining Cast, Befuddling Spell, Bleeding Spell.
2. Heroic Recovery+, Mighty Summons, Storm Spell, Tenacious Magic, and the table's Travel Channel, Ride the Spell, Slot Rehearsed Reload.
3. Safe Spell, Compressed Spell, Reshaped Spell, Huddle Channel, The Lurking Storm, Sacrificial Spell, Transmute Spell.
4. The mystic duo (Eldritch Resilience, Spell and Steel, Linked Target Spell, Twinned Target Spell) and Ally Form.
5. Drain Destiny, Reporting Spell, Enlightening Spell, Beguiling Feint.
6. Seeking Spell; the table's Tandem Casting, Spell Tag, Distilled Magic, Mixed-Potency Tincture, Recharging Spellgun, Elemental Study Notes.
7. The "+" items' spellshape activations: Power Rings (Veracious Spell), the scepters (Sicken, Energy Ablation, Heighten, Reach, Dangerous Odds, Purifying).
8. The Power Ring runes: Precision (Hone Spell), Calling (Veracious Summon).
9. Fury of a Thousand (Murmuration both types in full, per the user; −3; Song of Strength +2); held spells keep their cast's spellshapes.
10. Text rules and passive cast riders: Rudimentary Perfectionism, Power of Blood, Wayward Gifts.
11. Steady Spellcasting+, Comfort of Struggle and Scholar's Lore Effects, Cloaked Casting, Extended Cloaking, Monstrous Familiar, Slot-Charged Spell.
12. The wickets (Magic+), first four: Luminor, Propulsor, Erosior, Verdor.
13. The other wickets (Mortisor, Savior, Atmosphor, Desolator, Fabricator, Magnetor, Ardor) and Wicket Infusion.
14. The table's cast riders (eleven features, the Warping runes), Embodiment and its Effect; the form lists checked at load.
15. Focus Points regained as features are used (eleven features).
16. Reactions to a casting: Archmage's Counter, Seal the Wicket, Haughty Correction, Residual Energy Capture.
17. Spells cast by features: Become Elemental and Create Elemental (residual energy), Constructed Spark (Summon Construct in place of Animated Spark); the table's Form of the Imperial and Controlled Wrath.
18. The Wildblood instinct: rage damage on spells (the module's rules, verified), Effect: Wildblood Infusion after each cast, and Explosive Blood.
19. Magic+'s aspect summons (13 spells: the aspect creature at the cast rank with its statistics Effect, which the earlier route had missed) and Aspect Sage.
20. Colossal Summon (Gargantuan 6 by 6, +20 feet, Trample, Earth-Shatterer, the Megalophobia aura) and Colossal Aspect Form.
21. Celestial Shift and Aberration Shift (third-party spells): their Effect, linked without a name, now read; they had been note-only.
22. Magus+ Spellstrike variants: Imposing, Pummeling, Flaying, Banishing, Living Grimoire, Inverted Energy.
23. Spellstrikes delivered by other Strikes: Dual-Weapon, Residual and Reverse Spellstrike (Magus+), Scissored Assault (Magic+), Big Shot (Wizards+). All 51 spellshapes now read.
24. Magus+ Spellstrike features: Whirling Wand Strike, Eat This!, Dealer of Death, Slide Slice; the permissions (Second-Hand Wand, Horizon Spellshell, Starlit Span+, Flinging Figments).
25. The cascades entered after a cast: the stance's damage type from the last spell (every cascade Effect, PF2e's Arcane Cascade too), Havok Cascade's damage on havok spells, Reservoir of Power, Puppet String.
26. Don Visage, Slidecasting, Invigorate.
27. Magic+'s essence casting, the encounter (E1): 0 at the start (Initial Draw), cycles and their terminus, no redraw without Essence Rebirth, essence spells ending with the encounter.
28. Essence casting E2: Channel Essence Leak, Essence Conduit with Weave Conduit, Life Essence Reservoir.
29. Essence casting E3a: incantations (normal, long, Incantation Mastery) and their Refocus; Magic Bell, Magic Amulet, Magic Chalice.
30. Essence casting E3b: Unstable Draw and Unstable Aura, Terminus of Life's temporary Hit Points, Essence Summoner, the essence spells' 1-day temporary immunity.

## Scope (the user, 2026-10-07)

- Magic+'s essence casting: automate the whole system, then its feats and items.
- Magus+: automate everything, including the stances, Strike riders and martial passives.
- grants-spell, spell-modifier and mentions-spells: triage; automate the spell-affecting entries; record the rest as out of scope with a reason.

## Magus+ (the user, 2026-10-07: "Split by spell link")

Spell-linked, built here:
- Spellstrike variants (batch 22): Imposing, Pummeling, Flaying, Banishing, Living Grimoire, Inverted Energy.
- Delivered by other Strikes (batch 23): Dual-Weapon Spellstrike, Residual Spellstrike, Reverse Spellstrike, Scissored Assault, Big Shot.
- Spellstrike features (batch 24): Second-Hand Wand, Whirling Wand Strike, Dealer of Death, Eat This!, Slide Slice; the ranged permissions. Recharging Reload and Warded Stitch only "recharge your Spellstrike", which PF2e doesn't track: martial.
- Cascades after a cast (batch 25): the stance's damage type, Havok Cascade's damage, Reservoir of Power, Puppet String.
- Don Visage, Slidecasting, Invigorate (batch 26).
- The cascade stances themselves (Arcane Cascade+'s action, feat and Effect, Havok Cascade's feat): their damage type is set from the last spell by `cascadeTypeAhead` (batch 25), which the census can't see because it reads texts, not runtime hooks.
- The Magus+ Effects the batches use: Don Visage, Reservoir of Power, Invigorate, Puppet String, Slidecast, Tethered. Imposing, Flaying and Living Grimoire are built from their texts instead of the module's Effects.
- Left for the grants-spell triage: Mystic Bomb, Force Manipulate and Cascading Weapon Blast (feats granting a conflux spell and a Focus Point; the spells themselves are resolved).
- The spell-linked part of Magus+ is done (batches 22–26). The Magus+ Effects the batches use or replace (Don Visage, Invigorate, Puppet String, Slidecast, Flaying, Imposing) are counted with them.
- The conflux and focus spells (Mystic Bomb, Force Manipulate, Cascading Weapon Blast and the rest) are among the 227 resolved third-party spells.

Martial, for the pf2e-automatic-ability-resolution module: Bladebound (a black blade familiar), Battlemage's Apotheosis: Ultimate Radiance (light, fly and regeneration in the stance) and its Effect, Starlit Span Light (light on ranged Strikes), Soul Essence and Mind Essence Bolster (and Mind Essence's Bolstered Havok weakness Effect), Sparkling Targe+, Wrought Warplating, Scourging Lash, Thousand-Touch Arcana, Diametric Fusion's twin trait, Spell Stitcher, Merged Martial Stance, Essence Tactics, Bargained Essence, Soul Essence and Mind Essence (Bolster), Scent of Arcana, Discern Physicality, Perfect Arcane Form, Devouring Metal, Storm of the Winding Lash, Unbreakable Figure, Diametric Pairing, Sky Fall, Hundred Year Growth, Ablative Barrier Block, Battlemage's Apotheosis, Arcane Conservation and Second Conservation, Marionette Mastery and Jaunty Visage (their stance rules), Recharging Reload, Warded Stitch, Starlit Span's light and the hybrid studies' stance bonuses (Effects included), Infinite Power Cascade (Summoners+, an eidolon's Strike).

## Magic+'s essence casting (the user, 2026-10-07: "Automate the system")

Magic+'s own script keeps the essence pool through each cast: draws, +1, cycles, leaks, bounded steps, and ranks above the essence locked. This module adds what the rules tie to those moments (`scripts/essence-runtime.js`):
- E1 (batch 27): the encounter's start (0, or Initial Draw's draw) and end (essence spells and the encounter's termini end, the pool back to 0); a completed cycle gives the caster's terminus at that cycle (asked among several; Renewal ends incantations; Ultima at 9 after another cycle); no drawing after a cycle or a leak without Essence Rebirth.
- E2 (batch 28): Channel Essence Leak, Essence Conduit and Weave Conduit, Life Essence Reservoir (its size from the healing spells, spent by essence healing, Refocus).
- E3a (batch 29): incantations and their Refocus; the bell, amulet and chalice (the tome adds spells: the table's).
- E3b (batch 30): Unstable Draw and Unstable Aura, Terminus of Life's temporary Hit Points, Essence Summoner, the 1-day temporary immunity.
- The table's: Terminus of Soul's reroll, Terminus of Summoning's free Sustain, Terminus of Insight's Recall Knowledge, Terminus of Power's damage for non-damaging spells (its Effect's bonus is the module's), the termini of NPCs (Magic+ doesn't track an NPC's essence: its NPC Essence Spellcasting Effect is a counter the GM keeps), Essence Weaver's slots, Magic Tome, Archmemory, Accelerated Incantations' times.
- The essence system is done (batches 27–30).

## Item casts (triage 2026-10-07)

- Built here: Magic+'s power ring runes (batch 31) and the Tian Xia items that cast a named spell (Compass of Luong Phung, Chatterteeth Pearls, Geojibom's Greatpick: `readItemCasts`'s NAMED form). Gray Dust Ammunition and Blue Salt Crystal (batch 32).
- Power ring runes (batch 31), read from the worn rune with its ChoiceSet selection:
  - Immobilizing, Ramming and Scourging: a critical spell attack hit adds a save card at the rune's DC (Slowed 1 until the end of the caster's next turn; pushed away from the caster) or 1d10 persistent damage of the rune's type.
  - Perishing: on a natural 20, Die! is asked as a reaction, then a DC 37 Fortitude card with incapacitation at the rune's level.
  - Overwhelming: a natural 19 that succeeds becomes a critical success, only with Veracious Spell. The module's broader rule, which covers every spell attack, is dropped.
  - Energy: after a Veracious cast that deals energy damage, a Gather Power button holds a 1-minute charge. Release Power is a spell attack ray (5d4 of that type, the ring's item bonus).
  - The table's: Ramming's razing trait, and Scourging's +2 DC to end persistent damage the spell already deals.
- Already done: the essence items (the census reads them through `readEssenceActivation`).
- For the ability module: the Dragonbreath weapons and the spellguns.
- Out of scope: ancestries, Magitek Innovation, Rumbustious Robes.
- Batch 32: Blue Salt Crystal, a catalyst armed by its card for the next Drown. An affected target takes persistent acid equal to the rank, held by an Effect lasting the spell's duration. Gray Dust Ammunition: its card arms the next Strike; a hit marks the creature for a minute; its next cast opens the basic save card (with Stupefied 2 on a critical failure).
- The item-cast family is triaged (64 of 122 read). The other 58:
  - For the ability module: the Dragonbreath weapons (45: their activations are the weapon's area saves, not spells) and the spellguns (Howl of Winter, Verdant Bola: Strike-like attacks).
  - Out of scope: Yzobu, Shotalashu and Dragon Eidolon+ (ancestries), Magitek Innovation, Rumbustious Robes.

## Cast riders (triage 2026-10-07)

- Batch 33: Arcane Generator and Transmogrification Boost (the caster's Overdrive or Offensive Boost damage on the first failed save of a single-target damaging save spell with no duration, twice on a critical failure); Essence Strike (the next spell attack this turn rolled twice, then 10 minutes' immunity to Sure Strike); Essence Mystic Dedication (a conflux spell given the havok trait at the caster's choice: Havok Cascade's damage doubled and the module's +1 Effect until the next turn); Geojibom's Guidance (Revealing Light, then the caster's light for a minute).
- Batch 34: Spell Ignition (the ambient magic as a region over the last spell's area or its targets' spaces; creatures other than the caster ending their turn there save, basic, against the rank in the stance's type) and Cone of Figments (a hit's cone behind the target, basic Reflex).
- Batch 35: Triplicate Casting (armed by its card; the next three one-action casts of different non-cantrip spells this turn leave only the highest rank's slot spent).
- Read by runtime hooks the census can't see: Terminus of Life and its Effects, Unstable Draw, Essence Conduit, Accelerated Incantations' casting time (the table's), Eldritch Wicketeer Dedication and Spell Effect: Wicket Dominion (the wicket runtime and the module's own bonus).
- The table's:
  - Guarded Spellstrike ("does not provoke reactions"), Time Splitting Spellstrike (a delayed effect the GM times), Steady Spellcasting+ (disruption).
  - Wildblood Spellcasting (the archetype's spellcasting setup), Enhanced Aid (skill bonuses to battle forms and summons, the module's own rules).
  - The termini of Soul, Insight and Summoning (see the essence section).
  - Staff of the Eidolon Binder: PF2e's staff casting, whose spells resolve as any other. Its free Share Senses is the table's.
- QUESTION: Essence Eating Shell picks its effect by the shell spell's school, and remastered spells have no school. It is left for the user (see pending-user-decisions).

## Focus pool (triage 2026-10-07)

- Batch 36 (`scripts/plus-focus-runtime.js`): Golden Core (Refocus restores 2, or the whole pool from 18th level), I Am Omnipotent! (its requirement read from the last spell card; Stupefied 1; wizard focus spells spend no Focus Point while it lasts; 10 minutes' immunity after), Bargain Soul (its Effect put on: a Focus Point and a spent slot at least a rank below the highest, asked), Revitalizing Bun (revitalized for an hour; its button restores a Focus Point once, then a day's immunity).
- Already read: Draw Cantrips (essence), Flirting With Danger and Qi-Siphoning Blow (the focus-regain reader refuses a restricted point).
- PF2e's data, not spell resolution: the focus pool's size (Eidolon's Wrath, Zealot Instinct, Harness Bloodline, Qi Shaper Dedication), and Golden Core's and Wildblood's proficiency.
- For the ability module: Unstable Magic Mastery (inventor unstable actions), Battle Mediation and its stance, Flirting With Danger, Qi-Siphoning Blow (qi-shape Energize).
- The table's: Aspect Caller and Aspect Morpher Dedications' Refocus, Fuse Aspects and Fused Aspect Form ("subject to GM discretion"), I Am Omnipotent!'s stupefied flat check.
- Out of scope (narrative or eidolon rules): Splintered Manifestation, Destined Path, Lesson of Impermanence, Motorarcana (a focus spell choice), Simulacric Spellcraft.

## Spell-modifier, grants-spell and mentions-spells (triage 2026-10-07)

The 772 entries were sorted by their text (`$S/triage.json` script): 208 that change how a spell is cast or resolved were read; the rest only grant spells (PF2e's own casting, whose spells resolve as any other), use the spell DC or spell attack for a non-spell ability (eidolons, companions, doctrines: the ability module), change proficiency, slots or preparation (PF2e's data), or only mention spells.

- Batch 37 (`scripts/plus-counteract-runtime.js`): the counteract features — Dismiss Paltry Magic, Oracle's Eyes (illusion Effects or the listed conditions), Snuff Out (light Effects; or its void damage to a creature, then immune), Spell Pyrophore (all grades: its modifier and rank, then the burn's basic save). The pyrophore's lingering dust is the table's.
- Batch 38: Stigmata (its bleed and Religion bonus; its Harm rider — persistent bleed, the 3-action cast only on a critical failure; its Heal part — the healed creature's persistent damage ended, or a DC 11 flat check each after the 3-action Heal), Archmemory (the last cast's slot back), Spell Eating (a slot consumed for 1d12 per rank), Black Book Hex (spirit damage equal to the hex's rank), Outsider Caller (the burst card around the summoned creature).
- Batch 39 (`scripts/plus-hex-familiar-runtime.js`): the witch's 17 hex familiar abilities, on a hex cast or PF2e's Sustain card.
  - Automated: the auras' module Effects (Churning Saltwater, Faraway Worlds); the targeted creature's Effects (Murky Worlds, Illogical Forms) and the familiar's (Keen Senses, Illogical Forms); Sunlit Dawn's dazzled; Reprising Melody's choice; Stumbling Steps' push.
  - GM reminders: Ticking Parts, Armageddon's Favor, Disorienting Proximity, Entrancing Temptation, Flowing Script, Soul Consumption, Conflicting Authority, Desires Granted, Ongoing Misery.
- Batch 40: Consume Item Magic (a held magical consumable consumed for a spent slot up to half its level sharing a trait), Vital Pululation (the 3-action Heal at the second highest rank, no slot, the oracle excluded), Ancient Surge and Bizarre Surge (their Spell Effects beside Evolution Surge's).
- For the ability module (Strikes or slot-cost actions, not spells):
  - Force Jaws, Splinter Shadow Assault and Elaborate Patterned Strike (Strike-delivered magus spells' extra versions).
  - Light Killer, Spellbreaking Charge, Phrenic Blood, Mana-Scrambling Feedback, Fortify Others (counteracts riding a Strike or a class action).
- The table's: Enhanced Fortification (armor runes, material and adjustments), Steal Spell (a Thievery check stealing a spell), Morph Summon, Messenger Accomplice, Companion Aspect, Sticky Wicket, Font Connected, Sacred Safeguard, Mana Well, Studied Backup, Reserved Slot Cantrip, the preparation and slot-trading feats.
- The 35 eidolon and companion abilities and 68 features that only use the spell DC or spell attack are for the ability module (none is a spell); proficiency and slot-table features are PF2e's data.
- Batch 41 (the user, 2026-10-08: "build exploits and Channel Smite … here too"; `scripts/plus-exploit-runtime.js`): Wizards+'s seven exploits (Fickle Fate, Adaptable Energy, Impromptu Incarnation, Force Disruption, Immortality Clause, Dimensional Jump, Babbling Profusion) — their card's Rebuttal and Unravel, each paid with a slot meeting the Cost — and Channel Smite+ (the Harm or Heal expended, the next melee Strike's spirit damage, or the 3-action area card).

## PF2e's catalysts (the user, 2026-10-08: build them here)

- Batch 42 (`src/compiler/catalysts.js`, read through `readItemSpellshape`): all 107 catalysts arm the next cast of their named spell (rank limits read). Automated, 45:
  - riders: Firestarter Pellets (persistent), Backdraft Bead (push from the burst's centre), Bottled Screams, Discordant Strings, Leaden Weight, Dragon Eye (frightened), Necrotic Cap (conditions on a hit), Wemmuth Trinket (damage = rank), Frigid Rebuke and Hundred Stings (damage type), Soothing Scents (frightened reduced on the healed), Healer's Gel (PF2e's Effect on the first healed creature), Shimmering Dust and Amphisbaena Spittle (PF2e's Effects on the creatures), Dischoran Rubble (a reminder Effect on those failing);
  - PF2e's Effects that change the spell put on the caster at the cast (Dragon Eye, Necrotic Cap, the dragon scales, Seventh Prism (Pentagonal), Dazzling Rosary);
  - Thunderbird Tuft (the nimbus: a melee hit or touch on the caster takes the damage, more with a weapon), Wood-Rotted Root (spores when the caster takes physical damage), Deadlock Mint (the push save on the targeted creatures), Defiled Costa (the first critical failure's basic save), Bougainvillea Blossom, Nightpitch and Wolliped Fleece (terrain over the spell's area).
- The other 62 posted their text to the GM with the cast (batch 42; automated in batch 43).
- Batch 43 (the user, 2026-10-08: "automate the 62 catalyst notes too"; `scripts/catalyst-runtime.js`): every catalyst is automated, none a GM note.
  - At the cast: Alicorn Hair (Stabilize on one more creature), Dimensional Knot (the willing ally Stunned 1), Preserved Alecost (the food's temporary Hit Points), watches on the caster (Black Ash, Fearcracker, Ghostcracker), Deathless Light (any light spell; its counteract rank), and reminder Effects (Courier's Cryptex, Echoing Theater, Steadfast Sentinel, Warden's Eye, Stolen Countenance, Ghostly Legerdemain, Hippogriff Feather, Grave Token, Steel Cloud Road, Void Salts, Waterproofing Wax, Vulture's Wing, Mistwalker's Instinct, Nevercold's immunity, Deadlock Mint's objects).
  - On the save card: Broken Ram's Thorn (caltrops Regions), Kirin Echo Chime (the flying creature's push), Leaden Weight (prone after the pull), Necrotic Cap (sickened held; void persistent damage), Dazzling Rosary (a critical hit's dazzled), Seventh Prism (doubled dazzled; dazzled after blindness), Undertaker's Spade (incorporeal creatures), Ogre Spider Filament (the venom's clumsy), Swirling Sand and Kushtaka Relic (Effects), Euphoric Loop (the save as the charm ends).
  - On the spell's Effects: Consecrated Shield, Nevercold, Witchwarg Fur, Dragon Scute, Chaos Falcon Feather (the Sustain card), Demon Bone Tiles (the Shield Block's shards), Feral Linguist (casting in the form).
  - On what the spell made: Force Tiles, Noxious Incense, Gravemist Taper, Irritating Seedpod, Odious Token, Skyfisher Vapors.
  - Elsewhere: Unsullied Blood (healing in place of temporary Hit Points), Literate Lemur (Mad Monkeys' added mode), Shadow Ash (the summoned undead's shroud and rising), the dragon scales (PF2e's Effect alone).

