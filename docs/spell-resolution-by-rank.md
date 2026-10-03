# Spells that can resolve, by rank

Generated 2026-10-03 from the current compiler output (Foundry 14.367, PF2e 8.5.0), with the same counts as [the status by phase](spell-resolution-status.md). "Can resolve" means the module has an enabled automatic route for the spell; for some spells, that route automates only part of the spell. Ranks are PF2e's spell ranks; cantrips are listed apart from rank 1, and rituals are counted at their rank.

Regenerate with `python3 tools/build-spell-resolution-status.py`.

"Note only" spells (counted apart; inside "Can resolve" at every rank and for rituals too, by user decision) have no mechanical rule to apply; casting one gives a rule-less note Effect with the spell's rules for its duration, and a spell placed in the environment puts it on the caster with a line to mark the area on the map.

"Effect + note" spells (also counted apart, inside "Cannot resolve") link a PF2e Effect the module can't prove covers the text: casting one applies PF2e's Effect as PF2e defines it, plus a note Effect with the spell's text.

| Rank | Can resolve | Note only | Effect + note | Cannot resolve | Total | Resolved | Spells (can / total) | Rituals (can / total) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Cantrips | 120 | 20 | 0 | 0 | 120 | 100% | 120 / 120 | 0 / 0 |
| Rank 1 | 387 | 57 | 0 | 0 | 387 | 100% | 386 / 386 | 1 / 1 |
| Rank 2 | 245 | 63 | 0 | 0 | 245 | 100% | 241 / 241 | 4 / 4 |
| Rank 3 | 261 | 65 | 0 | 0 | 261 | 100% | 253 / 253 | 8 / 8 |
| Rank 4 | 285 | 63 | 0 | 0 | 285 | 100% | 280 / 280 | 5 / 5 |
| Rank 5 | 202 | 37 | 0 | 0 | 202 | 100% | 192 / 192 | 10 / 10 |
| Rank 6 | 81 | 17 | 1 | 36 | 117 | 69% | 78 / 114 | 3 / 3 |
| Rank 7 | 55 | 13 | 1 | 32 | 87 | 63% | 53 / 85 | 2 / 2 |
| Rank 8 | 36 | 12 | 0 | 31 | 67 | 54% | 32 / 63 | 4 / 4 |
| Rank 9 | 27 | 7 | 1 | 33 | 60 | 45% | 24 / 57 | 3 / 3 |
| Rank 10 | 21 | 13 | 1 | 18 | 39 | 54% | 18 / 36 | 3 / 3 |
| **All** | **1720** | **367** | **4** | **150** | **1870** | **92%** | | |

## By rank and phase

Can resolve / total, by each spell's primary phase.

| Rank | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Phase 7 | Phase 8 | Phase 9 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Cantrips | 41 / 41 | 48 / 48 | 21 / 21 | — | 1 / 1 | 6 / 6 | — | 3 / 3 |
| Rank 1 | 144 / 144 | 122 / 122 | 65 / 65 | 5 / 5 | 7 / 7 | 28 / 28 | 1 / 1 | 15 / 15 |
| Rank 2 | 81 / 81 | 88 / 88 | 35 / 35 | 9 / 9 | 1 / 1 | 19 / 19 | 4 / 4 | 8 / 8 |
| Rank 3 | 76 / 76 | 85 / 85 | 34 / 34 | 7 / 7 | 3 / 3 | 40 / 40 | 8 / 8 | 8 / 8 |
| Rank 4 | 105 / 105 | 97 / 97 | 27 / 27 | 11 / 11 | 3 / 3 | 34 / 34 | 5 / 5 | 3 / 3 |
| Rank 5 | 58 / 58 | 55 / 55 | 24 / 24 | 5 / 5 | 12 / 12 | 35 / 35 | 10 / 10 | 3 / 3 |
| Rank 6 | 25 / 32 | 30 / 43 | 5 / 9 | 9 / 11 | 1 / 2 | 7 / 16 | 3 / 3 | 1 / 1 |
| Rank 7 | 19 / 23 | 14 / 30 | 8 / 11 | 3 / 4 | 4 / 6 | 4 / 10 | 2 / 2 | 1 / 1 |
| Rank 8 | 11 / 15 | 8 / 16 | 4 / 7 | 2 / 4 | 1 / 8 | 5 / 11 | 4 / 4 | 1 / 2 |
| Rank 9 | 11 / 17 | 8 / 17 | 4 / 5 | 0 / 2 | 0 / 6 | 1 / 10 | 3 / 3 | — |
| Rank 10 | 0 / 3 | 4 / 10 | 2 / 2 | 3 / 5 | 2 / 7 | 1 / 3 | 3 / 3 | 6 / 6 |

## Spells that can resolve

<details><summary>Cantrips: 120</summary>

Acid Splash, Allegro, Ancient Dust, Approximate, Artistic Recollection, Astral Rain, Boost Eidolon, Bramble Bush, Bullhorn, Buzzing Bites, Caustic Blast, Clinging Ice, Contagious Idea, Courageous Anthem, Create Earthen Facsimile, Create Thrall, Dancing Blade, Daze, Deep Breath, Detect Magic, Detect Metal, Dirge of Doom, Discern Secrets, Distortion Lens, Divine Lance, Draw Moisture, Eat Fire, Electric Arc, Elemental Counter, Entropic Wheel, Evil Eye, Figment, Forbidden Thought, Forbidding Ward, Foresee the Path, Frost's Touch, Frostbite, Gale Blast, Ghost Sound, Ghostly Shift, Glamorize, Glass Shield, Glimpse Weakness, Glowing Trail, Gouging Claw, Guidance, Haunting Hymn, Healing Plaster, Hologram Cage, House of Imaginary Walls, Ignition, Illuminate, Imaginary Weapon, Infectious Enthusiasm, Information Overload, Inside Ropes, Invoke True Name, Join Pasts, Know the Way, Light, Live Wire, Manifest Will, Message, Murmuration, Musical Accompaniment, Needle Darts, Nudge Fate, Omnidirectional Scan, Pact Broker, Phase Bolt, Prestidigitation, Protect Companion, Puff of Poison, Rallying Anthem, Ray of Frost, Read Aura, Read the Air, Redistribute Potential, Reinforce Eidolon, Root Reading, Rousing Splash, Scatter Scree, Scrounger's Glee, Share Vision, Shatter Mind, Shield, Shroud of Night, Sigil, Silver's Refrain, Slashing Gust, Song of Marching, Song of Strength, Spirit Object, Spout, Stabilize, Sting of the Sea, Stoke the Heart, Summon Instrument, Take Root, Tame, Tangle Vine, Telekinetic Hand, Telekinetic Projectile, Telekinetic Rend, Tesseract Tunnel, Thermal Stasis, Thrall Charge, Timber, Time Sense, Torturous Trauma, Trade Death for Life, Tremor Signs, Triple Time, Uplifting Overture, Vector Screen, Vitality Lash, Void Warp, Warp Step, Wash Your Luck, Wilding Word

</details>

<details><summary>Rank 1: 387</summary>

500 Toads, Acidic Burst, Adapt Self, Admonishing Ray, Agile Feet, Agitate, Air Bubble, Airburst, Alarm, All-Encompassing Hunger, Ancestral Memories, Ancestral Touch, Angelic Halo, Animal Allies, Animate Rope, Ant Haul, Anticipate Peril, Appeal to Authority, Appearance of Wealth, Aqueous Blast, Armor of Thorn and Claw, Arms of Nature, Ashen Wind, Athletic Rush, Augmented Body, Bane, Barbed Spear, Befuddle, Benediction, Beseech the Sphinx, Bit of Luck, Biting Words, Bless, Blessing of Vigor, Blood Infusion, Blood Ward, Bone Shield, Bone Spear, Booming Blast, Brain Drain, Breadcrumbs, Breathe Fire, Briny Bolt, Buffeting Winds, Buoyant Bubbles, Cackle, Call of the Grave, Call to Arms, Camel Spit, Carryall, Celestial Accord, Charged Javelin, Charm, Charming Push, Charming Touch, Chastising Retort, Chilling Spray, Cinder Gaze, Cinder Scribe, Circle of Weakness, Cleanse Cuisine, Cloak of Shadow, Clouded Focus, Command, Concordant Choir, Conductive Weapon, Confound the Eye and Confuse the Mind, Connective Current, Cornucopia, Corpse Bloom, Counter Performance, Cradle Aloft, Create Water, Creative Splash, Crescent Scepter, Crown of Prophets, Crushing Ground, Cry of Destruction, Curse of Recoil, Cutting Eye, Cycle of Retribution, Darkened Forest Form, Dazzling Flash, Dead Weight, Death's Call, Deathly Scream, Debilitating Terror, Decompose, Defended by Spirits, Dehydrate, Delay Consequence, Detect Poison, Devouring Dark Form, Diabolic Edict, Dim the Light, Dimensional Assault, Discomfiting Whispers, Disguise Magic, Distracting Decoy, Divine Plagues, Diviner's Sight, Dizzying Colors, Dome of Tranquility, Draconic Barrage, Draw Ire, Déjà Vu, Earth's Bile, Earthworks, Echoing Weapon, Eject Soul, Elemental Betrayal, Elemental Toss, Elysian Whimsy, Embodiment of Battle, Empty Inside, Endure, Enfeeble, Entreat Spirit, Equal Footing, Evolution Surge, Exchange Image, Extend Boost, Extradimensional Cover, Face in the Crowd, Fact Check, Faerie Dust, Fashionista, Fated Healing, Fear, Fire Ray, Fishing Spot, Flashy Disappearance, Fleet Step, Flense, Flourishing Flora, Flurry of Claws, Fold Metal, Foraging Friends, Force Barrage, Force Bolt, Force Fang, Force Fling, Forced Mercy, Forced Quiet, Forge, Fortify Summoning, Frenzied Revelry, Friendfetch, Friendly Push, Funeral Flames, Garden of Healing, Genie's Veil, Gentle Landing, Gift of the Anemos, Glutton's Jaws, Goblin Pox, Grasping Vine, Gravitational Pull, Gravity Weapon, Grease, Grim Tendrils, Gritty Wheeze, Groom Companion, Guided Introspection, Gust of Wind, Halcyon Mists, Hallowed Ground, Hand of the Apprentice, Harm, Heal, Heal Animal, Heal Companion, Healer's Blessing, Heart's Hook, Helpful Steps, Hippocampus Retreat, Hollow Heart, Home Among Mulberry Leaves, Horizon Thunder Sphere, Hurtling Stone, Hydraulic Push, Hymn of Healing, Ignite Ambition, Ill Omen, Illusory Disguise, Illusory Object, Imprint Message, Incendiary Aura, Infuse Vitality, Inkshot, Inner Upheaval, Instant Pottery, Interposing Earth, Invisible Item, Item Facade, Jealous Hex, Jump, Juvenile Companion, Keen Smell, Kinetic Ram, Know Location, Lament, Lay on Hands, Leaden Steps, Liberating Command, Life Boost, Life Link, Life Tap, Lift Nature's Caul, Lingering Composition, Lock, Loremaster's Etude, Lose the Path, Magic Hide, Magic Stone, Magic's Vessel, Malediction, Mending, Message Rune, Metal Merged, Mindlink, Moonbeam, Mud Pit, Muscle Barrier, Mushroom Patch, Mystic Armor, Necromancer's Generosity, Necrotic Bomb, Needle of Vengeance, Negate Aroma, Nettleskin, Noxious Vapors, Nudge the Odds, Nymph's Grace, Nymph's Token, Oathkeeper's Insignia, Object Memory, Object Reading, Overselling Flourish, Overstuff, Parch, Patron's Puppet, Penumbral Shroud, Perfected Mind, Personal Rain Cloud, Pest Form, Pet Cache, Phantasmal Minion, Phantom Pain, Phase Familiar, Physical Boost, Pocket Library, Practice Makes Perfect, Precious Gleam, Propelling Air Stream, Protection, Protective Wards, Protector Tree, Protector's Sacrifice, Pummeling Rubble, Purifying Icicle, Pushing Gust, Putrefy Food and Drink, Pyroclastic Truth, Qi Rush, Quick Sort, Rainbow's End, Read Fate, Reclined Apport, Redact, Reed Whistle, Rejuvenating Flames, Restyle, Rising Surf, River Carving Mountains, Runic Body, Runic Weapon, Sacred Beasts, Sanctuary, Savor the Sting, Schadenfreude, Scholarly Recollection, Scorching Blast, Scouring Sand, Scramble Body, Seashell of Stolen Sound, Sepulchral Mask, Serrate, Share Burden, Share Lore, Shattering Gem, Shielded Arm, Shielding Strike, Shields of the Spirit, Shillelagh, Shocking Grasp, Shockwave, Shooting Star, Signal Skyrocket, Sky Laughs at Waves, Sky Sight, Sleep, Slime Spit, Snare Hopping, Snowball, Song of the Soul, Soothe, Soothing Words, Soul Siphon, Spider Sting, Spinning Staff, Spirit Link, Spirit Ward, Split the Tongue, Spray of Stars, Stick On, Store Time, String of Fate, Stumbling Curse, Sudden Shift, Summon Animal, Summon Construct, Summon Fey, Summon Lesser Servitor, Summon Plant or Fungus, Summon Undead, Sure Strike, Swampcall, Swarmsense, Swear Oath, Sweet Dream, Synchronize, Synchronize Steps, Tailwind, Tempest Surge, Tempest Touch, Temporal Distortion, Temporary Tool, Tentacular Limbs, Tether, Thicket of Knives, Thoughtful Gift, Threefold Limb, Thunderous Strike, Thunderstrike, Tidal Surge, Touch of Obedience, Touch of Undeath, Touch of the Void, Traveling Workshop, Trickster's Mirrors, Turbulent Tide, Ulcerous Canker, Unbroken Panoply, Undeath's Blessing, Unexpected Windfall, Unfetter Eidolon, Unimpeded Stride, Unraveling Blast, Untamed Form, Untamed Shift, Updraft, Vanishing Tracks, Veil of Confidence, Veil of Dreams, Vengeful Glare, Ventriloquism, Verdant Sprout, Verminous Lure, Vibrant Thorns, Victory Cry, Vindicator's Mark, Waking Nightmare, Wall of Shrubs, Warped Terrain, Weaken Earth, Weapon Surge, Weapon Trance, Weave Wood, Whispering Quiet, Wildfire, Winter Bolt, Wish Market, Withering Grasp, Wooden Fists, Word of Truth, Zenith Star

</details>

<details><summary>Rank 2: 245</summary>

Acid Arrow, Acid Grip, Advanced Scurvy, Albatross Curse, Allfood, Animal Feature, Animal Form, Animal Messenger, Animated Assault, Animus Mine, Ash Cloud, Augury, Avenging Wildwood, Banishing Touch, Bee-Man's Summons, Befitting Attire, Binding Muzzle, Blast of the Bellows, Blazing Armory, Blazing Blade, Blazing Bolt, Blistering Invective, Blood Duplicate, Blood Runs Cold, Blood Vendetta, Blur, Bone Spray, Boneshaker, Bony Barrage, Bralani Referendum, Brand the Impenitent, Breath of Drought, Brine Dragon Bile, Burrow Ward, Buzzing Servants, Calm, Canopy Crawler, Carrion Mire, Cauterize Wounds, Charitable Urge, Clad In Metal, Claws of the Otter, Clawsong, Cleanse Affliction, Cleanse Air, Clear Mind, Coiling Dance, Confetti Cloud, Create Food, Cutting Insult, Dancing Shield, Darkness, Darkvision, Deafness, Death Knell, Dimensional Drop, Disintegrating Puddle, Dismantle, Disorienting Flash, Dispel Magic, Draw Blood, Electrostatic Glider, Elemental Zone, Embed Message, Empathic Link, Empty Pack, Enhance Victuals, Enlarge, Enlarge Companion, Entangling Flora, Environmental Endurance, Erase Trail, Everlight, Expeditious Excavation, Exploding Earth, Explosive Dust, Extract Poison, Faerie Fire, False Vitality, Falsify Heat, Familiar's Resurrection, Far-Flung Fetch, Fear the Sun, Feast of Ashes, Feral Shades, Final Sacrifice, Fireproof, Flame Wisp, Floating Flame, Floating Harness, Frog Tongue, Frozen Lungs, Fungal Hyphae, Fungal Infestation, Gecko Grip, Gentle Breeze, Ghostly Carrier, Ghoulish Cravings, Glacial Causeway, Grave Impressions, Guiding Star, Harmonize Self, Heat Metal, Helpful Reload, Helpful Scribe, Helpful Wood Spirits, Hidebound, Horrifying Blood Loss, Humanoid Form, Hunter's Luck, Ignite Fireworks, Illusory Creature, Illusory Shroud, Imitate Fauna, Imp Sting, Impart Empathy, Impeccable Flow, Imprinting Hand, Inner Radiance Torrent, Instant Armor, Inveigle, Invisibility, Invoke the Crimson Oath, Iron Gut, Kgalaserke's Axes, Knock, Laughing Fit, Lifelink Surge, Light of Revelation, Lock Item, Loose Time's Arrow, Lucky Number, Luminous Stardust Healing, Magic Warrior Aspect, Magic Warrior Transformation, Magnetic Attraction, Magnetic Repulsion, Manifestation of Spirits, Mark of Blood, Marvelous Mount, Menacing Lament, Mental Map, Metal Reverberation, Mimic Undead, Mind Games, Mirror Image, Mist, Mist Sight, Murder of Crows, Noise Blast, Oaken Resilience, Oil-Slicked Walls, One with Plants, Osseous Cage, Pack Attack, Palm-Held Sun, Paranoia, Pave Ground, Peaceful Rest, Penumbral Disguise, Perfect Strike, Persistent Servant, Phantasmal Treasure, Phantom Crowd, Propulsive Breeze, Pyrefowl Rebuke, Quench, Radiant Field, Rapid Adaptation, Reaper's Lantern, Resist Energy, Restoration, Retrieving Hook, Revealing Light, Rime Slick, Rite of Cleansing Flame, Rubble Step, Sea Surge, See the Unseen, Shadow Zombie, Shape Wood, Share Life, Shatter, Shift Perspective, Shining Starlight Attack, Shrink, Silence, Slough Skin, Sonata Span, Soothing Mist, Sound Body, Speak with Animals, Spirit Sense, Spirit of the Beast, Spiritual Armament, Spiritual Weapon, Splinter Volley, Spy's Mark, Status, Steel Fortifications, Sticky Fire, Stupefy, Sudden Blight, Sudden Bolt, Summon Elemental, Summoner's Precaution, Summoner's Visage, Sun Blade, Sure Footing, Swallow Light, Sweetest Solstice, Tacky Pine Sap, Teeth to Terror, Telekinetic Maneuver, The Everfull Moon, The Parrot's Whisper, The Queen's Rainbow, Thermal Remedy, Thunder Echo, Thundering Dominance, Timely Reminder, Timely Tutor, Tracing Bond, Translate, Tremorsense, Umbral Extraction, Umbral Mindtheft, Uncover Device, Unrelenting Gravity, Valiant Anthem, Vanish Weapon, Veil of Spirits, Vicious Jealousy, Vision of Weakness, Voice on the Breeze, Vomit Swarm, Warping Pull, Warrior's Regret, Watchdog, Water Breathing, Water Walk, Waterproof, Web, With Friends like These, Worm's Repast

</details>

<details><summary>Rank 3: 261</summary>

Aberrant Whispers, Access Lore, Agonizing Despair, Ancestral Defense, Angelic Wings, Animal Vision, Annunciation of the Outer Gate, Anointed Ground, Antlion Trap, Aqueous Orb, Armor of Bones, Awaken Portal, Battlefield Persistence, Beastmaster Trance, Begone, Behold the Weave, Bind Heroic Spirit, Bind Undead, Blastback, Blazing Dive, Blinding Beauty, Blindness, Blister Bomb, Blood in the Water, Bloody Tendrils, Bone Flense, Bone Moth's Kiss, Bonewall Bulwark, Bottomless Stomach, Bracing Tendrils, Burglar's Blind, Burning Trail, Caster's Imposition, Cave Fangs, Censure Falsehoods, Chilling Darkness, Chosen Gravity, Circle of Protection, Claim Curse, Clairaudience, Cloud Dragon's Cloak, Combustion, Companion's Shadow, Conjured Conveyance, Conjurer's Countermeasure, Consecrate Flesh, Coral Scourge, Cordyceps Command, Cozy Cabin, Crashing Wave, Crisis of Faith, Croak Voice, Cup of Dust, Curse of Lost Time, Cyclone Rondo, Day's Weight, Deceiver's Cloak, Deep Sight, Defensive Prescience, Delay Affliction, Disruptive Transfer, Distracting Chatter, Dive and Breach, Dividing Trench, Dragon Breath, Drain Life, Dream Message, Eagle's Cry, Earthbind, Echo Jump, Eidolon's Wrath, Electrified Crystal Ward, Elemental Absorption, Elemental Annihilation Wave, Elemental Motion, Embrace the Pit, Enthrall, Envenom Companion, Ephemeral Tracking, Excise Lexicon, Extend Blood Magic, Extend Spell, Eyes of the Dead, Familiar's Call, Familiar's Face, Far Reach, Far Sight, Fate's Travels, Feet to Fins, Fey Disappearance, Fireball, Firework Blast, Focusing Hum, Fractious Echo, Fungal Exhalation, Garden of Stone, Gasping Marsh, Geas, Ghost Rush, Ghostly Weapon, Glass Sand, Gleaming Pet, Gravity Wave, Gravity Well, Haste, Heart's Desire, Heatvision, Hedge Prison, Heroism, Holy Light, Horde of Underlings, Horrific Visage, Hypercognition, Hypnotize, Ibex's Harvest, Impending Doom, Incendiary Ashes, Inertia Lock, Infectious Ennui, Inscrutable Mask, Insect Form, Instant Parade, Interstellar Void, Invent Code, Invoke the Harrow, Iron Rain, Ki Cutting Sight, Labyrinthine Prison, Lashing Rope, Levitate, Life Connection, Life Pact, Lightning Bolt, Lightning Lasso, Lively Flight, Locate, Lotus Walk, Mad Monkeys, Magical Fetters, Magnetic Acceleration, Malicious Shadow, Martyr's Intervention, Mind Reading, Mind of Menace, Mindscape Door, Mindscape Shift, Moonlight Ray, Moth's Supper, Mycological Malady, Nothing Up My Sleeve, Noxious Metals, One with Stone, Oneiric Mire, Ooze Form, Organsight, Overload Connection, Overwhelming Memory, Painted Scout, Paralyze, Perceive the Threads of Fate, Percussive Impact, Perseis's Precautions, Personal Blizzard, Phantom Prison, Pillar of Water, Positive Attunement, Powerful Inhalation, Primal Chorus, Pulverizing Cascade, Purging Toxins, Pyrotechnics, Qi Blast, Radiant Globe, Rally Point, Ranger's Bramble, Reblooded, Rend Magic, Restraining Chains, Return the Favor, Ring of Truth, Roaring Applause, Rouse Skeletons, Rune Trap, Safe Passage, Sand Form, Scrying Ripples, Sculpt Sound, Sea of Thought, Secret Page, Secure Siege Weapons, Shadow Projectile, Shadow Spy, Shared Invisibility, Sheltering Wings, Shift Blame, Shifting Sand, Show the Way, Shrink Item, Shrink the Span, Shroud of Flame, Sign of Conviction, Skyglass Prison, Slow, Soothing Blossoms, Soul Cutter, Sparkleskin, Speak With Magic, Speak with Plants, Spectral Blade, Spirit Veil, Spontaneous Cartography, Steal Shadow, Stinking Cloud, Stone Lance, Strength of Mind, Subjugate Undead, Sudden Recollection, Sun's Fury, Swamp of Sloth, Tempest Cloak, Temporal Twin, The Four Hunters, Thief of Fortune, Threatening Mimicry, Threefold Aspect, Thunderburst, Time Jump, Time Pocket, Time Skip, Tiny Wings, Tracking Mayflies, Trade Items, Transcribe Conflict, Travel by Turtle, Unblinking Flame Revelation, Unbreaking Wave Advance, Undertow, Unfolding Wind Rush, Unravel Knowledge, Unseasonable Squall, Untwisting Iron Buffer, Vampiric Feast, Veil of Privacy, Wall of Radiance, Wall of Shadow, Wall of Thorns, Wall of Virtue, Wall of Water, Wall of Wind, Wanderer's Guide, Warding Aggression, Warning Stripes, Weapon Tide, Web of Eyes, Whirling Flames, Whirling Scarves, Widow’s Bite, Wings of the Valkyrie, Winter's Breath, Wooden Double, Zombie Horde

</details>

<details><summary>Rank 4: 285</summary>

Achaekek's Clutch, Adaptive Ablation, Aerial Form, Air Walk, Airlift, Anathematic Reprisal, Anchoring Air, Aromatic Lure, Artistic Flourish, Asterism, Bestial Curse, Blood Chestnuts, Bloodspray Curse, Bottle the Storm, Bridge of Vines, Bursting Bloom, Call The Blood, Call the Ten, Capital Dividend, Captivating Adoration, Channel Arrogance, Chroma Leach, Chromatic Armor, Chromatic Ray, Cinder Swarm, Clairvoyance, Clinging Shadows Stance, Cloak of Light, Cloud Current, Clownish Curse, Commanding Lash, Community Restoration, Compel True Name, Competitive Edge, Confront Selves, Confusion, Conglomerate of Limbs, Conjured Clockwork, Containment, Coral Eruption, Countless Eyes, Creation, Crystallized Vapors, Darkened Eyes, Darkened Sight, Dawnflower's Light, Daydreamer's Curse, Deathless March, Debilitating Dichotomy, Delusional Pride, Destructive Aura, Detect Creator, Detect Scrying, Diamond Dust, Dimensional Steps, Dinosaur Form, Dirge of Remembrance, Discern Lies, Dispelling Globe, Disperse into Air, Divine Wrath, Door to Beyond, Downpour, Draw the Lightning, Dreamer's Call, Dull Ambition, Dust Storm, Dutiful Challenge, Ectoplasmic Interstice, Elemental Gift, Elemental Sense, Elemental Sheath, Elemental Tempest, Elephant Form, Enduring Might, Energy Absorption, Enervation, Enhance Senses, Entangle Fate, Ephemeral Hazards, Eradicate Undeath, Euphoric Renewal, Fallen Soldier's Lament, Fallow Field, False Nature, Familiar Form, Favorable Review, Fearful Feast, Fetch, Fey Form, Filter Air, Fire Shield, Flame Barrier, Flicker, Fly, Font of Serenity, Force Rain, Forgotten Lines, Fortissimo Composition, Foul Miasma, Freezing Touch, Friends to Foes, Fulminating Impact, Garden of Death, Ghostly Tragedy, Ghostly Transcription, Girzanje's March, Glass Form, Glimpse the Truth, Grasp of the Deep, Grasping Earth, Haunting Spirit, Holy Cascade, Honeyed Words, Hop, Skip, Jump, Hot Air, Hydraulic Torrent, Ice Storm, Implement of Destruction, Incarnate Shadow Minuet, Inevitable Destination, Infectious Melody, Infiltrator's Tunnel, Interdisciplinary Incantation, Internal Insurrection, Invisibility Cloak, Invisibility Curtain, Isolation, It is Written, Know the Enemy, Life Siphon, Life's Flowing River, Life's Fresh Bloom, Life-Draining Roots, Liminal Doorway, Living Terrain, Localized Quake, Lucky Break, Luring Wail, Magic Mailbox, Magnetize, Malignant Sustenance, Mantis Form, Mantis's Grasp, Mercurial Stride, Mirage, Mirror's Misfortune, Misty Memory, Morass of Ages, Mountain Resilience, Movanic Glimmer, Murderous Vine, Mutilate, Mystic Beacon, Nature's Bounty, Necrotic Radiation, Nightmare, Ocular Overload, Ordained Purpose, Outcast's Curse, Overflowing Sorrow, Painful Vibrations, Path of Least Resistance, Peaceful Bubble, Perfected Body, Pernicious Poltergeist, Personal Runewell, Pest Swarm, Petal Storm, Phantasmal Killer, Phantasmal Protagonist, Phoenix Ward, Planar Tether, Precious Metals, Procyal Philosophy, Prophet's Luck, Protector's Sphere, Pulse of Civilization, Purifying Veil, Quantic Dampening, Radiant Beam, Radiant Heart of Devotion, Ranage's Circle, Rapid Retreat, Ravenous Portal, Read Omens, Rebounding Barrier, Rebuke Death, Reflected Beauty, Reflective Scales, Reinforced Rations, Remember the Lost, Repel Metal, Replicate, Rest Eternal, Retributive Pain, Rewrite Memory, Rigid Form, Roar of the Dragon, Rope Trick, Rune of Observation, Runic Impression, Rust Cloud, Rusting Grasp, Sacred Nimbus, Safeguard Secret, Sage's Curse, Sanguine Mist, Sanguine Transference, Seal Fate, Shadow Strike, Shaken Confidence, Shape Stone, Shared Nightmare, Shielding Formation, Shifting Form, Show the Path, Shroud of the Mantis, Sliding Blocks, Snake Fangs, Soft Landing, Solid Fog, Songbird's Call, Soothing Spring, Spell Immunity, Spike Stones, Spiral of Horrors, Spiritual Anamnesis, Spiritual Attunement, Spiritual Renewal, Stasis, Steal Voice, Stifling Stillness, Stonesense, Stormwind Flight, Sudden Swarm, Suggestion, Swarm Form, Swarming Wasp Stings, Take its Course, Talking Corpse, Telepathy, Tempt Fate, Tireless Worker, Tomorrow's Dawn, Tortoise and the Hare, Touch of the Moon, Transcribe Moment, Translocate, Transmigrate, Traveler's Transit, Trickster's Feathers, Trickster's Twin, Umbral Graft, Unbounded Sphere, Unfettered Movement, Unity, Unsettling Knowledge, Unsettling Perspective, Vampiric Maiden, Vapor Form, Variable Gravity, Vicious Howl, Vision of Beauty, Vision of Death, Vital Beacon, Vital Luminance, Vital Seed, Waking Dream, Wall Of Mirrors, Wall of Fire, Weapon Storm, Weaponize Secret, Web of Influence, Whispers of the Void, Wild Feast, Wild Winds Stance, Wind Whispers, Winning Streak, Wood Walk, Word of Freedom, Wordsmith, Ymeri's Mark, Zeal for Battle, Zephyr Slip

</details>

<details><summary>Rank 5: 202</summary>

Aberrant Form, Abyssal Plague, Acid Storm, Ancestral Winds, Arcane Countermeasure, Astral Projection, Bandit's Doom, Banishment, Belittling Boast, Black Tentacles, Blackfinger's Blades, Blazing Fissure, Blessing of Defiance, Blind Eye, Blinding Bottle, Blinding Foam, Blink Charge, Blister, Blood Feast, Blood-Feasting Breath, Blossoming Gore, Boomerang Shot, Breath of Life, Calcium Rain, Call Spirit, Celestial Brand, Chameleon Coat, Chromatic Wall, Chthonian Wrath, Cleansing Flames, Cloak of Colors, Cone of Cold, Confusing Cry, Consuming Darkness, Control Water, Corrosive Muck, Crucible of Iron, Curse of Death, Dance of Darkness, Death Ward, Desperate Repair, Diadem of Divine Radiance, Divine Dragon's Watch, Divine Immolation, Domora's Defense, Dragon Wings, Drain Planar Connection, Dreaming Potential, Drop Dead, Ectoplasmic Expulsion, Elemental Blast, Elemental Breath, Elemental Form, Ember Doppelgänger, Engrave Memory, Entwined Roots, Establish Ward, Etheric Shards, False Vision, Fey Glamour, Fire's Pathway, Flame Dancer, Flame Strike, Flames of Ego, Flammable Fumes, Flowing Strike, Footholds and Foothills, Forceful Hand, Fortifying Brew, Freezing Rain, Geyser, Glacial Heart, Glacial Skewer, Glimmer of Charm, Glossolalia, Gluttonous Growth, Grasping Grave, Grisly Growths, Hallucination, Healing Well, Hellfire Plume, Horizon's Veil, Howling Blizzard, Hunter's Vision, Illusory Scene, Imaginary Lockbox, Impaling Spike, Incarnate Faerie Revelers, Incarnate Skeletal Giant, Incendiary Fog, Inevitable Disaster, Infectious Comedy, Instant Minefield, Invoke Spirits, King's Castle, Lashunta's Life Bubble, Let Not the Fallen Rest, Lightning Storm, Loyalty's Ward, Magic Passage, Mantle of the Frozen Heart, Mantle of the Magma Heart, Mantle of the Melting Heart, Mantle of the Unwavering Heart, Mariner's Curse, Mind Probe, Mirecloak, Mirror Malefactors, Moon Frenzy, Mosquito Blight, Nature's Pathway, Oblivious Expulsion, Ode to Ouroboros, Over the Coals, Pack Breaker, Pillars of Sand, Plague Shot, Plant Form, Plasma Whirl, Portrait of Spite, Portrait of the Artist, Pressure Zone, Psychic Outburst, Pulverizing Wake, Quicken Time, Rallying Banner, Ravening Maw, Repelling Pulse, Restorative Moment, Return Beacon, Rewinding Step, Rewrite Possibility, Rip the Spirit, Ritual Obstruction, Sawtooth Terrain, Scouring Pulse, Scouting Eye, Secret Chest, Sending, Shadow Blast, Shadow Jump, Shadow Siphon, Shall not Falter, Shall not Rout, Shepherd of Souls, Shock and Awe, Slither, Soulshelter Vessel, Space Fold Gate, Speak with Stones, Spectral Advance, Spellmaster's Ward, Spiked Carapace, Spiritual Guardian, Spiritual Torrent, Spiritual Transport, Stagnate Time, Steal the Sky, Stormburst, Strange Geometry, Subconscious Suggestion, Summon Anarch, Summon Axiom, Summon Celestial, Summon Dragon, Summon Entity, Summon Fiend, Summon Giant, Summon Healing Servitor, Summon Monitor, Symphony of the Unfettered Heart, Synaptic Pulse, Synesthesia, Telekinetic Haul, Telepathic Bond, Temporary Glyph, Terrain Transposition, Tornadic Gale, Toxic Cloud, Transmute Rock And Mud, Tree of Life and Death, Truespeech, Umbral Journey, Unblinking Flame Aura, Unbreaking Wave Vapor, Unfolding Wind Buffet, Unravel Existence, Untwisting Iron Roots, Unusual Anatomy, Vindicator's Judgment, Wall of Flesh, Wall of Ice, Wall of Stone, Warshard Shot, Wave of Despair, Weight of the World, Whispers of a Dead Goddess, Wind Jump, Wisdom of the Winds, Wish-Twisted Form, Wronged Monk's Wrath, Wyvern Sting, You're Mine

</details>

<details><summary>Rank 6: 81</summary>

Accelerated Decomposition, Ancestral Form, Arrow Salvo, Ash Form, Awaken Entropy, Binding Circle, Blade Barrier, Boots on the Ground, Bridge of Graves, Cast into Time, Catch Your Name, Chain Lightning, Champion's Sacrifice, Chromatic Image, Claim Undead, Crimson Breath, Cryostasis, Daemon Form, Demon Form, Devil Form, Disintegrate, Dominate, Dragon Form, Entreat the Many, Explosive Barrage, Field of Life, Field of Razors, Flame Vortex, Flaming Fusillade, For Love, For Lightning, Frost Pillar, Frozen Fog, Halcyon Infusion, Heinous Future, Heroic Feat, Life-Giving Form, Lignify, Living Thunderbolt, Lure Dream, Manifold Lives, Mislead, Missed Cue, Moonlight Bridge, Nature's Reprisal, Necrotize, Never Mind, Pain of Ages, Personal Ocean, Petrify, Phantasmal Calamity, Phantom Orchestra, Poltergeist's Fury, Purple Worm Sting, Revel in Retribution, Rose's Thorns, Sacred Form, Scintillating Safeguard, Siege Weapon's Blessing, Skeleton Army, Sleepless Season, Speak With Water, Speaking Sky, Spellsurge, Spellwrack, Spirit Blast, Stone to Flesh, Suffocate, Suspended Retribution, Teleport, Tempest Form, Tentacular Innervation, Terminate Bloodline, Truesight, Utter Destruction, Vampiric Exsanguination, Vibrant Pattern, Wall of Force, Wall of Metal, Word of Revision, Zealous Conviction, Zero Gravity

</details>

<details><summary>Rank 7: 55</summary>

Angel Form, Attacked from Within, Blightburn Blast, Contingency, Cosmic Form, Curse of the Spirit Orchestra, Defy the Gods, Devouring Void, Divine Decree, Divine Vessel, Eclipse Burst, Energy Aegis, Entrancing Eyes, Ethereal Jaunt, Execute, Fiendish Rift, Fiery Body, Frigid Flurry, Hasted Assault, Hungry Depths, Incarnate Tempest of Shades, Inexhaustible Cynicism, Interplanar Teleport, Leng Sting, Mask of Terror, Momentary Recovery, Moonburst, Planar Palace, Planar Seal, Pollen Pods, Power Word Blind, Prismatic Armor, Project Image, Recall Legacy, Recurring Nightmare, Regenerate, Retrocognition, Return To Essence, Reverse Gravity, Shadow's Web, Skeletal Lancers, Soothing Ballad, Spell Riposte, Spell Turning, Summon Stampede, Sunburst, Telekinetic Bombardment, Teleportation Circle, Time Beacon, Unbearable Cacophony, Unfettered Pack, Unfolding Wind Blitz, Untwisting Iron Augmentation, Visions of Danger, Warp Mind

</details>

<details><summary>Rank 8: 36</summary>

Antimagic Field, Arctic Rift, Awaken Curse, Boil Blood, Canticle of Everlasting Grief, Clockwork Devotion, Clone Companion, Confusing Colors, Desiccate, Devour Life, Disappearance, Divine Armageddon, Divine Aura, Divine Inspiration, Dream Council, Earthbreaker Stride, Ferrous Form, Freedom, Hidden Mind, Hypnopompic Terrors, Imprisonment, Migration, Part the Mists to Paradise, Pinpoint, Polar Ray, Power Word Stun, Prying Survey, Punishing Winds, Quandary, Rite of the Red Star, Spirit Song, Spiritual Epidemic, Stop Heart, Sudden Transposition, Take Your Places, Uncontrollable Dance

</details>

<details><summary>Rank 9: 27</summary>

Bilocation, Crusade, Detonate Magic, Dimensional Excision, Disjunction, Embrace Nothingness, Foresight, Implosion, Linnorm Sting, Phantasmagoria, Power Word Kill, Prismatic Shield, Prismatic Sphere, Proliferating Eyes, Purify Tanglebriar, Resplendent Mansion, Seize Soul, Separation, Telepathic Demand, Unblinking Flame Ignition, Unfolding Wind Crash, Unspeakable Shadow, Untwisting Iron Pillar, Void Harvest, Voracious Gestalt, Wails of the Damned, Weird

</details>

<details><summary>Rank 10: 21</summary>

Alter Reality, Apex Companion, Dinosaur Fort, Element Embodied, Fatal Aria, Fated Confrontation, Freeze Time, Gate, Hero's Defiance, Indestructibility, Living Graveyard, Manifestation, Miracle, Nullify, Perfected Thrall, Perfection of Essence, Primal Herd, Primal Phenomenon, Raga of Remembrance, Remake, Wish

</details>

## Note-only spells

<details><summary>Cantrips: 20</summary>

Approximate, Artistic Recollection, Create Earthen Facsimile, Deep Breath, Detect Magic, Detect Metal, Distortion Lens, Draw Moisture, Frost's Touch, Ghost Sound, Glowing Trail, Illuminate, Join Pasts, Know the Way, Prestidigitation, Sigil, Telekinetic Hand, Tesseract Tunnel, Tremor Signs, Vector Screen

</details>

<details><summary>Rank 1: 57</summary>

Air Bubble, Alarm, Breadcrumbs, Buoyant Bubbles, Carryall, Cinder Scribe, Cleanse Cuisine, Cloak of Shadow, Confound the Eye and Confuse the Mind, Connective Current, Cradle Aloft, Create Water, Decompose, Detect Poison, Disguise Magic, Dome of Tranquility, Fold Metal, Foraging Friends, Friendly Push, Gentle Landing, Helpful Steps, Illusory Object, Imprint Message, Instant Pottery, Invisible Item, Item Facade, Jump, Know Location, Lock, Message Rune, Mindlink, Negate Aroma, Oathkeeper's Insignia, Object Reading, Patron's Puppet, Pet Cache, Putrefy Food and Drink, Quick Sort, Reclined Apport, Redact, Restyle, Rising Surf, Seashell of Stolen Sound, Sky Sight, Snare Hopping, Store Time, String of Fate, Swarmsense, Synchronize, Synchronize Steps, Temporary Tool, Thoughtful Gift, Vanishing Tracks, Ventriloquism, Verdant Sprout, Weave Wood, Whispering Quiet

</details>

<details><summary>Rank 2: 63</summary>

Allfood, Animal Messenger, Augury, Bee-Man's Summons, Befitting Attire, Blast of the Bellows, Blood Duplicate, Buzzing Servants, Clad In Metal, Cleanse Air, Create Food, Electrostatic Glider, Elemental Zone, Embed Message, Empathic Link, Empty Pack, Enhance Victuals, Environmental Endurance, Erase Trail, Familiar's Resurrection, Far-Flung Fetch, Fireproof, Floating Harness, Ghostly Carrier, Grave Impressions, Guiding Star, Helpful Scribe, Hunter's Luck, Impart Empathy, Magic Warrior Aspect, Magic Warrior Transformation, Magnetic Attraction, Marvelous Mount, Mist Sight, Pack Attack, Pave Ground, Peaceful Rest, Penumbral Disguise, Perfect Strike, Persistent Servant, Phantom Crowd, Propulsive Breeze, Rubble Step, Shape Wood, Share Life, Shift Perspective, Slough Skin, Sonata Span, Speak with Animals, Spy's Mark, Status, Summoner's Precaution, Thunder Echo, Timely Reminder, Timely Tutor, Tracing Bond, Translate, Uncover Device, Voice on the Breeze, Watchdog, Water Breathing, Water Walk, Waterproof

</details>

<details><summary>Rank 3: 65</summary>

Access Lore, Ancestral Defense, Animal Vision, Bottomless Stomach, Bracing Tendrils, Burglar's Blind, Chosen Gravity, Claim Curse, Clairaudience, Cloud Dragon's Cloak, Companion's Shadow, Conjured Conveyance, Cozy Cabin, Deceiver's Cloak, Dividing Trench, Electrified Crystal Ward, Ephemeral Tracking, Extend Blood Magic, Extend Spell, Familiar's Call, Familiar's Face, Far Reach, Far Sight, Fate's Travels, Feet to Fins, Focusing Hum, Fractious Echo, Heatvision, Hypercognition, Inertia Lock, Instant Parade, Invent Code, Locate, Lotus Walk, Mindscape Shift, Nothing Up My Sleeve, Painted Scout, Perceive the Threads of Fate, Perseis's Precautions, Pillar of Water, Rally Point, Scrying Ripples, Secret Page, Shadow Spy, Sheltering Wings, Show the Way, Shrink Item, Shrink the Span, Speak With Magic, Speak with Plants, Spontaneous Cartography, Temporal Twin, Threefold Aspect, Time Jump, Time Pocket, Tiny Wings, Trade Items, Transcribe Conflict, Travel by Turtle, Unfolding Wind Rush, Wall of Shadow, Wall of Water, Wanderer's Guide, Web of Eyes, Wooden Double

</details>

<details><summary>Rank 4: 63</summary>

Air Walk, Airlift, Artistic Flourish, Clairvoyance, Cloud Current, Creation, Dawnflower's Light, Destructive Aura, Detect Creator, Detect Scrying, Dimensional Steps, Discern Lies, Disperse into Air, Ectoplasmic Interstice, Elemental Sense, Enhance Senses, False Nature, Familiar Form, Fetch, Forgotten Lines, Ghostly Transcription, Hop, Skip, Jump, Interdisciplinary Incantation, Invisibility Curtain, It is Written, Liminal Doorway, Lucky Break, Magic Mailbox, Magnetize, Mantis Form, Mirage, Misty Memory, Movanic Glimmer, Mystic Beacon, Ocular Overload, Path of Least Resistance, Peaceful Bubble, Procyal Philosophy, Pulse of Civilization, Quantic Dampening, Ravenous Portal, Read Omens, Reflected Beauty, Rope Trick, Rune of Observation, Sanguine Transference, Show the Path, Sliding Blocks, Soft Landing, Solid Fog, Stonesense, Telepathy, Transcribe Moment, Translocate, Transmigrate, Trickster's Feathers, Unity, Web of Influence, Wind Whispers, Wood Walk, Wordsmith, Zeal for Battle, Zephyr Slip

</details>

<details><summary>Rank 5: 37</summary>

Blackfinger's Blades, Blind Eye, Chameleon Coat, Desperate Repair, Dreaming Potential, Engrave Memory, False Vision, Fey Glamour, Fire's Pathway, Hunter's Vision, Illusory Scene, Imaginary Lockbox, King's Castle, Magic Passage, Nature's Pathway, Ode to Ouroboros, Pillars of Sand, Portrait of the Artist, Return Beacon, Rewinding Step, Ritual Obstruction, Scouting Eye, Secret Chest, Shadow Jump, Space Fold Gate, Speak with Stones, Spiritual Transport, Summon Anarch, Summon Axiom, Telekinetic Haul, Telepathic Bond, Temporary Glyph, Terrain Transposition, Truespeech, Umbral Journey, Wall of Stone, Wisdom of the Winds

</details>

<details><summary>Rank 6: 17</summary>

Boots on the Ground, Bridge of Graves, Champion's Sacrifice, Cryostasis, Halcyon Infusion, Heroic Feat, Lure Dream, Moonlight Bridge, Personal Ocean, Siege Weapon's Blessing, Speak With Water, Spellsurge, Teleport, Terminate Bloodline, Wall of Metal, Word of Revision, Zero Gravity

</details>

<details><summary>Rank 7: 13</summary>

Contingency, Ethereal Jaunt, Interplanar Teleport, Planar Palace, Project Image, Recall Legacy, Retrocognition, Reverse Gravity, Teleportation Circle, Time Beacon, Unbearable Cacophony, Unfettered Pack, Unfolding Wind Blitz

</details>

<details><summary>Rank 8: 12</summary>

Antimagic Field, Clone Companion, Divine Inspiration, Dream Council, Migration, Part the Mists to Paradise, Pinpoint, Prying Survey, Punishing Winds, Quandary, Rite of the Red Star, Take Your Places

</details>

<details><summary>Rank 9: 7</summary>

Bilocation, Crusade, Prismatic Sphere, Proliferating Eyes, Purify Tanglebriar, Resplendent Mansion, Seize Soul

</details>

<details><summary>Rank 10: 13</summary>

Alter Reality, Dinosaur Fort, Fated Confrontation, Freeze Time, Gate, Indestructibility, Manifestation, Miracle, Perfection of Essence, Primal Phenomenon, Raga of Remembrance, Remake, Wish

</details>

## Effect + note spells

<details><summary>Cantrips: 0</summary>

None.

</details>

<details><summary>Rank 1: 0</summary>

None.

</details>

<details><summary>Rank 2: 0</summary>

None.

</details>

<details><summary>Rank 3: 0</summary>

None.

</details>

<details><summary>Rank 4: 0</summary>

None.

</details>

<details><summary>Rank 5: 0</summary>

None.

</details>

<details><summary>Rank 6: 1</summary>

Tangling Creepers

</details>

<details><summary>Rank 7: 1</summary>

True Target

</details>

<details><summary>Rank 8: 0</summary>

None.

</details>

<details><summary>Rank 9: 1</summary>

Sacred Covenant

</details>

<details><summary>Rank 10: 1</summary>

Nature Incarnate

</details>
