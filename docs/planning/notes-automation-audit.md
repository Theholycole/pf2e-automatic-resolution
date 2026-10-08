# Notes automation audit

2026-10-05. The user asked: "check all spells with notes and see if anything in notes could be automated".

## Method

- I compiled all 1994 PF2e spells and collected every note string in each compiled plan: row notes, manual instructions, GM reminders, card notes, and the text of note-only spells.
- 1065 spells carry at least one note:
  - 450 are note-only;
  - 2 are Effect + note;
  - the rest (save, effect, ongoing, care) are automated spells that also carry GM notes.
- I searched the notes for mechanical words: dice, conditions, saves, typed bonuses and penalties, Hit Points, resistance and weakness, Speeds, senses, and pushes and pulls. I then read each spell's full text.

## Left as notes (and why)

- **Behaviour, attitude and information:** what a creature believes, says or learns. The decisions of 2026-10-01 and 2026-10-04 make these the GM's.
- **Objects and the environment:** locks, doors, fires, fog, unattended items, structures and terrain features the module doesn't model. Examples: Fireproof, Waterproof, Lock, Temporal Ward, Wall of Water's aquatic rules.
- **World-scale and travel:** Earthquake's collapses, Upheaval, Veil of Broken Reality, Astral Labyrinth, Interplanar Teleport (group 6/12, decided 2026-10-04).
- **Rituals:** handled by the GM (decisions 2026-10-03).
- **Choices only the player or GM can make:** "you can move the target up to 15 feet", "a direction of your choice", Warping Pull's "an unoccupied square up to 10 feet closer" (the caster picks it), Invoke the Harrow's boon or bane, and repeated substitutions such as Show the Path. "A space of its choice" next to an area (Blade Barrier, Lifewood Cage, Frost Pillar) gets the nearest free space by default; the GM moves the creature elsewhere if it chooses.
- **Labels on automated cards:** "Target the creatures it reaches: …" on incarnate and summon cards, where the card already rolls the save and damage.

## Automatable, now planned

### Batch N1: bonuses, Speeds and senses as Effects — done (notes batch 1, live-passed)

| Spell | What becomes automatic |
| --- | --- |
| Movanic Glimmer | +2 status to Perception and Will saves on the animal(s); a toggle for the +1 to Command an Animal |
| Chameleon Coat | +3 status to Stealth to Hide (+4 at 8th) on up to 8 targets |
| Penumbral Disguise | +1/+2/+3 status to Stealth to Hide, with a "dim light or darkness" toggle |
| Uncover Device | +2 status to Thievery to Disable a Device |
| Discern Lies | +4 status to Perception (and its DC) against a Lie, with a toggle |
| Threefold Aspect | +4 status to Deception to pass as the chosen age, with a toggle |
| Chosen Gravity | +1 status to saves and Fortitude DC against forced movement, with a toggle |
| Part the Mists to Paradise | +4 status to saves on the targets |
| Stonesense | Tremorsense (imprecise) 100 feet |
| Elemental Sense | The chosen sense (tremorsense 30 feet and the others) |
| Enhance Senses | Low-light vision, or darkvision if the creature already has low-light vision |
| Tiny Wings | A 20-foot fly Speed on the familiar, or +15 feet to an existing one |
| Feet to Fins | A swim Speed equal to the land Speed; land Speed 5 feet |

### Batch N2: scene-wide and save cards — done (notes batch 2, live-passed)

Under Sunless Skies, Call of the Quenching, Trim the Blight and Theogeny already had GM option buttons (2026-10-04). Added: Theogeny's critical punishment (a watcher) and Spellsurge's Interference aura.

| Spell | What becomes automatic |
| --- | --- |
| Under Sunless Skies | Allies: greater darkvision, 40 temporary Hit Points, +3 status to saves. Enemies: –3 status to Will saves |
| Call of the Quenching | Allies: fire resistance 15 and Concealed. Enemies ending a turn in the area: 7d4 piercing + 7d4 bludgeoning, basic Reflex |
| Theogeny | Allies: a fly Speed and +1d10 spirit on Strikes. Foes: weakness 5 to holy or unholy. Enemies take 10 spirit when critically hit or when they critically fail a save |
| Trim the Blight | The 12d10 spirit Fortitude card with its rows (Sickened and Slowed; the reach change is a note) on the creatures the GM targets |
| Spellsurge | Interference: +2 circumstance to saves against mental effects in the aura (the other options stay notes) |

### Batch N3: forced movement notes — done (notes batch 3, live-passed)

| Spell | What becomes automatic |
| --- | --- |
| Rainbow Fumarole | Already automated: the hazard moves the token 10 feet away from the fumarole (since spellshape batch 16); its note now says so |
| Garden of Stone | Each creature in the area moved to the nearest unoccupied space |
| Tornadic Gale | Medium or smaller creatures adjacent to the line pulled to the nearest unoccupied space in it |
| Arcane Explosion | A failing creature that can't complete the 10-foot push is knocked Prone |
| Planar Collision | A push stopped by a wall: bludgeoning equal to the feet left |
| Blade Barrier | A creature that succeeds is moved to the nearest space outside the wall |
| Lifewood Cage | A creature that succeeds is moved to the nearest space outside the cage |
| Frost Pillar | On a success, the creature is moved to the nearest adjacent free space |
| Patron's Protector | The knock-back away from the familiar |
| Life's Flowing River | Already automated: a critical failure's 20-foot push away from the caster (its note only restates it) |

### Batch N4: other notes — done (notes batch 4, live-passed)

Also in batch 4: GM notes are seen only by the GM (the user, 2026-10-05).

Checked since the audit: Unblinking Flame Aura (its healing), Shattering Gem (its shatter) and Unravel Knowledge (its note controls) were already automated too. Crisis of Faith (its card already asks whether the target casts divine spells), Return the Favor and Zealous Conviction (PF2e's Effect already gives the temporary Hit Points) are already automated, so they're off the list.

| Spell | What becomes automatic |
| --- | --- |
| Stone Lance | Immobilized removed from a creature that isn't on the ground (elevation above 0) |
| Unravel Knowledge | The chosen ability: 3d8 mental (3d4 for a basic action) the first time each round the target uses it, followed through its messages |
| Unblinking Flame Aura | The healing (3 × level) on the caster |
| Shattering Gem | The destroyer within 10 feet: the damage card (basic Reflex) |
| Pyrotechnics | A creature as the fire source: 1d6 cold |
| Vacuum | A creature that critically fails: PF2e's suffocation Fortitude save at the end of each of its turns |
| Pact Broker | –1 status to the caster's Deception to Lie to that creature |
| Musical Shift | Its watched riders: bleed on piercing or slashing damage, Prone on a critical failure |

Each batch is checked against what the spell's card already does before it's built. A part already automated is dropped from the list.
