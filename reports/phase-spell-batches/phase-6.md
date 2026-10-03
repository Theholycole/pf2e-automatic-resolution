# Phase 6: Summons and created creatures

56 primary worklist entries; 56 entries with this phase signal including cross-phase dependencies. Assignments are planning candidates, not verified semantic classifications.

Descriptions are grouped first by rule family, then by normalized word/bigram similarity. Each cohort has at most 12 entries. Similarity is a discovery aid; check the full source and differing values/branches before sharing implementation or evidence.

## Rule-family index

| Rule family | Spells | Not enabled | Wording cohorts |
| --- | --- | --- | --- |
| Created entities | 12 | 2 | 10 |
| Incarnate arrival/departure | 28 | 19 | 22 |
| Creature creation | 16 | 0 | 3 |


## P6-001 — Created entities: Dread Mosquito Storm

**1 spells; 1 not enabled.** Suggested source-reading anchor: Dread Mosquito Storm. This is not a verified-test designation.

**Test contract:** Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.

**Shared signals:** Area exposure, Save-result condition rider, Native condition, Created entities, Delegated affliction, Modifier / resistance

**Anchor wording:** Necrotic Blood (disease, thrall) Level 18; If an afflicted creature dies, you create a thrall in its space of the same size as the creature.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dread Mosquito Storm](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/dread-mosquito-storm.json) | 9 | Not enabled | 2, 3 | 1.00 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |


## P6-002 — Created entities: Reanimate Foe

**1 spells; 1 not enabled.** Suggested source-reading anchor: Reanimate Foe. This is not a verified-test designation.

**Test contract:** Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.

**Shared signals:** Save-result condition rider, Healing / recipient mode, Created entities

**Anchor wording:** Critical Failure You create a thrall in the corpse's space, but you don't spend the Focus Point for casting this spell..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Reanimate Foe](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/reanimate-foe.json) | 9 | Not enabled | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 of your thralls |


## P6-003 — Created entities: Recurring Nightmare

**3 spells; 0 not enabled.** Suggested source-reading anchor: Recurring Nightmare. This is not a verified-test designation.

**Test contract:** Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.

**Shared signals:** Native condition, Created entities

**Anchor wording:** You create a thrall within range, and you can create it in a space occupied by a creature.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Recurring Nightmare](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/recurring-nightmare.json) | 7 | Enabled route | 2, 3, 4 | 1.00 | will; non-basic/no save; duration 1 minute; target source/area/text |
| [Conglomerate of Limbs](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/conglomerate-of-limbs.json) | 4 | Enabled route | 2, 3, 4 | 0.29 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Living Graveyard](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/living-graveyard.json) | 10 | Enabled route | 2, 3 | 0.19 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |


## P6-004 — Created entities: Bind Heroic Spirit

**1 spells; 0 not enabled.** Suggested source-reading anchor: Bind Heroic Spirit. This is not a verified-test designation.

**Test contract:** Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.

**Shared signals:** Created entities, Modifier / resistance

**Anchor wording:** Additionally, whenever you critically hit a creature with a Strike, you can create a thrall in a space adjacent to the target of the Strike, as your heroic attack inspires other spirits to join you on the battlefield..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Bind Heroic Spirit](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/bind-heroic-spirit.json) | 3 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 of your thralls |


## P6-005 — Created entities: Bloody Tendrils

**1 spells; 0 not enabled.** Suggested source-reading anchor: Bloody Tendrils. This is not a verified-test designation.

**Test contract:** Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.

**Shared signals:** Basic-save damage, Created entities

**Anchor wording:** You create up to 3 Medium thralls shaped like bloody tendrils in range.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Bloody Tendrils](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/bloody-tendrils.json) | 3 | Enabled route | 2, 3 | 1.00 | reflex; basic; duration 1 minute; target source/area/text |


## P6-006 — Created entities: Blossoming Gore

**1 spells; 0 not enabled.** Suggested source-reading anchor: Blossoming Gore. This is not a verified-test designation.

**Test contract:** Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.

**Shared signals:** Area exposure, Ending or dismissal, Save-result condition rider, Persistent damage, Native condition, Created entities

**Anchor wording:** y spilling the blood of a thrall, you grow a large field of bloody roses that feeds on the life force of those around it and uses it to create thralls that do your bidding.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Blossoming Gore](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/blossoming-gore.json) | 5 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration 1 minute; target 1 of your thralls |


## P6-007 — Created entities: Create Thrall

**1 spells; 0 not enabled.** Suggested source-reading anchor: Create Thrall. This is not a verified-test designation.

**Test contract:** Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.

**Shared signals:** Created entities

**Anchor wording:** You either create 2 thralls in unoccupied squares within range or create 1 thrall and immediately Command that Thrall..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Create Thrall](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/create-thrall.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P6-008 — Created entities: Horde of Underlings

**1 spells; 0 not enabled.** Suggested source-reading anchor: Horde of Underlings. This is not a verified-test designation.

**Test contract:** Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.

**Shared signals:** Sustain, Created entities

**Anchor wording:** ou summon six underlings, such as skeletons or kobolds.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Horde of Underlings](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/horde-of-underlings.json) | 3 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P6-009 — Created entities: Perfected Thrall

**1 spells; 0 not enabled.** Suggested source-reading anchor: Perfected Thrall. This is not a verified-test designation.

**Test contract:** Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.

**Shared signals:** Created entities

**Anchor wording:** ou create a perfect thrall that's the conglomeration of all aspects of necromancy.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Perfected Thrall](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/perfected-thrall.json) | 10 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P6-010 — Created entities: Skeletal Lancers

**1 spells; 0 not enabled.** Suggested source-reading anchor: Skeletal Lancers. This is not a verified-test designation.

**Test contract:** Entity statistics and placement; independent actions; control; triggered creation; limits; cleanup and source loss.

**Shared signals:** Attack and dependent result, Created entities

**Anchor wording:** You create up to 5 thralls in different spaces within range.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Skeletal Lancers](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/skeletal-lancers.json) | 7 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P6-011 — Incarnate arrival/departure: Unholy Army

**5 spells; 4 not enabled.** Suggested source-reading anchor: Unholy Army. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Persistent damage, Native condition, Incarnate arrival/departure

**Anchor wording:** Arrive Dance of Duality A legion of adhukaits arrive on the field, dancing and scurrying in and among your enemy's front line.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unholy Army](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/unholy-army.json) | 8 | Not enabled | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |
| [Holy Host](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/holy-host.json) | 8 | Not enabled | 2, 3, 4, 7 | 0.38 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |
| [Pest Swarm](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/pest-swarm.json) | 4 | Enabled route | 2, 3, 4, 7 | 0.35 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |
| [Incarnate Kaiju](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/incarnate-kaiju.json) | 10 | Not enabled | 2, 3, 4, 7 | 0.23 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |
| [Incarnate Wild Rose](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/incarnate-wild-rose.json) | 6 | Not enabled | 2, 3 | 0.19 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-012 — Incarnate arrival/departure: Summon Elemental Herald

**2 spells; 2 not enabled.** Suggested source-reading anchor: Summon Elemental Herald. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Basic-save damage, Native condition, Incarnate arrival/departure

**Anchor wording:** Air Speed fly 60 feet; Arrive (air) Supercell Front The herald of air arrives in the form of a twisting tornado, with high-speed winds slamming into your enemies.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Summon Elemental Herald](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/summon-elemental-herald.json) | 8 | Not enabled | 2, 3, 4, 7 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |
| [Incarnate Deific Herald](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/incarnate-deific-herald.json) | 8 | Not enabled | 2, 3, 4 | 0.16 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-013 — Incarnate arrival/departure: Beseech Arcanotheign

**1 spells; 1 not enabled.** Suggested source-reading anchor: Beseech Arcanotheign. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Basic-save damage, Native condition, Healing / recipient mode, Incarnate arrival/departure

**Anchor wording:** Arrive (sonic) Storm's Unbridled Destruction Arcanotheign arrives with a flash of light and a cacophonous crash of colliding magic.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Beseech Arcanotheign](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/beseech-arcanotheign.json) | 9 | Not enabled | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-014 — Incarnate arrival/departure: Call Fluxwraith

**1 spells; 1 not enabled.** Suggested source-reading anchor: Call Fluxwraith. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Condition-dependent lifetime, Turn trigger or boundary, Save-result condition rider, Native condition, Incarnate arrival/departure, Information / adjudication

**Anchor wording:** Arrive (transmutation) Interrupted Lives .

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Call Fluxwraith](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/call-fluxwraith.json) | 9 | Not enabled | 2, 3, 4 | 1.00 | will; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-015 — Incarnate arrival/departure: Conquering Soldiers

**1 spells; 1 not enabled.** Suggested source-reading anchor: Conquering Soldiers. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Native condition, Healing / recipient mode, Incarnate arrival/departure, Modifier / resistance

**Anchor wording:** Arrive (auditory, emotion, fear, mental) Banner's Call The conquering army manifests before you and your allies, letting out a battle cry of victory and devotion.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Conquering Soldiers](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/conquering-soldiers.json) | 10 | Not enabled | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-016 — Incarnate arrival/departure: Final Fate of the Locust Host

**1 spells; 1 not enabled.** Suggested source-reading anchor: Final Fate of the Locust Host. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Basic-save damage, Persistent damage, Granted movement speed, Native condition, Incarnate arrival/departure

**Anchor wording:** Arrive Behold the Rotten Lord Deskari's corpse is unspeakably foul, emitting a putrid stench, and constantly twitches thanks to the movement of the millions of insects and vermin that consume it.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Final Fate of the Locust Host](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/final-fate-of-the-locust-host.json) | 7 | Not enabled | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-017 — Incarnate arrival/departure: Garden of the Green Man's Growth

**1 spells; 1 not enabled.** Suggested source-reading anchor: Garden of the Green Man's Growth. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Basic-save damage, Native condition, Incarnate arrival/departure, Terrain, Forced movement

**Anchor wording:** Arrive (plant) Verdant Bloom The green man erupts from the ground in a burst of lush growth, dealing 10d8[bludgeoning] damage to creatures in a type:emanation|distance:60 with a basic Reflex save.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Garden of the Green Man's Growth](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/garden-of-the-green-mans-growth.json) | 10 | Not enabled | 2, 3, 7 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-018 — Incarnate arrival/departure: Incarnate Ancient Specter

**1 spells; 1 not enabled.** Suggested source-reading anchor: Incarnate Ancient Specter. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Incarnate arrival/departure

**Anchor wording:** Arrive (mental, visual) Kneel, Peons! The specter raises its hand, indicating that all foes should pay it obeisance.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Incarnate Ancient Specter](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/incarnate-ancient-specter.json) | 7 | Not enabled | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-019 — Incarnate arrival/departure: Incarnate Archmage

**1 spells; 1 not enabled.** Suggested source-reading anchor: Incarnate Archmage. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Native condition, Choice / casting variant, Incarnate arrival/departure

**Anchor wording:** Arrive (force) Archmage's Amplification The archmage arrives in a fierce burst of magical force, automatically dealing 3d4+3 force damage to up to 5 creatures it chooses within 100 feet of it.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Incarnate Archmage](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/incarnate-archmage.json) | 8 | Not enabled | 2, 3, 4 | 1.00 | will; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-020 — Incarnate arrival/departure: Incarnate Draconic Legion

**1 spells; 1 not enabled.** Suggested source-reading anchor: Incarnate Draconic Legion. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Basic-save damage, Choice / casting variant, Incarnate arrival/departure

**Anchor wording:** Arrive Energy Annihilation The draconic legion breathes out two blasts of energy: a type:line|distance:120 and a type:cone|distance:60 that can't overlap.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Incarnate Draconic Legion](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/incarnate-draconic-legion.json) | 9 | Not enabled | 2, 3, 4 | 1.00 | reflex; basic; duration until the end of your next turn; target source/area/text |


## P6-021 — Incarnate arrival/departure: Jassim's Allegiance

**1 spells; 1 not enabled.** Suggested source-reading anchor: Jassim's Allegiance. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Incarnate arrival/departure

**Anchor wording:** Arrive (fire) Eyes of Fire Jassim emerges from the ground and glares at your enemies, a fearsome look forming on a face of ancient metal and glass.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Jassim's Allegiance](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/jassims-allegiance.json) | 10 | Not enabled | 2, 3 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-022 — Incarnate arrival/departure: Summon Ancient Fleshforged

**1 spells; 1 not enabled.** Suggested source-reading anchor: Summon Ancient Fleshforged. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Basic-save damage, Native condition, Attack and dependent result, Choice / casting variant, Incarnate arrival/departure

**Anchor wording:** Bone Breaker Size Gargantuan, Speed 40 feet, climb 100 feet Arrive Skull Breaking Hum (evocation, sonic) The Bone Breaker appears in a shower of bone fragments.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Summon Ancient Fleshforged](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/summon-ancient-fleshforged.json) | 9 | Not enabled | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-023 — Incarnate arrival/departure: Summon Irii

**1 spells; 1 not enabled.** Suggested source-reading anchor: Summon Irii. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Turn trigger or boundary, Incarnate arrival/departure

**Anchor wording:** Arrive (fortune, prediction) Decree the Immutability of Time While within 30 feet of the fate, you and your allies who roll below 10 on a d20 for an attack roll, Perception check, saving throw, or skill check get a 10 instead..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Summon Irii](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/summon-irii.json) | 8 | Not enabled | 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-024 — Incarnate arrival/departure: Summon Oliphaunt of Jandelay

**1 spells; 1 not enabled.** Suggested source-reading anchor: Summon Oliphaunt of Jandelay. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Basic-save damage, Incarnate arrival/departure, Forced movement

**Anchor wording:** Arrive (force) Devastating Displacement Using hidden magics and long-lost techniques, you conjure an immense gate to Jandelay, compelling the Oliphaunt to step through.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Summon Oliphaunt of Jandelay](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/summon-oliphaunt-of-jandelay.json) | 10 | Not enabled | 3, 4, 7 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-025 — Incarnate arrival/departure: Summon Warden of the Wild

**1 spells; 1 not enabled.** Suggested source-reading anchor: Summon Warden of the Wild. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Temporary immunity, Save-result condition rider, Basic-save damage, Native condition, Incarnate arrival/departure, Terrain, Forced movement

**Anchor wording:** Warden of Caverns and Burrows: Speed 60 feet, burrow 100 feet; Arrive (earth) Obsidian Cage Obsidian stalagmites burst from the earth as the warden surfaces, impaling enemies and trapping them in stalagmites.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Summon Warden of the Wild](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/summon-warden-of-the-wild.json) | 8 | Not enabled | 2, 3, 7 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-026 — Incarnate arrival/departure: Skeleton Army

**2 spells; 0 not enabled.** Suggested source-reading anchor: Skeleton Army. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Basic-save damage, Persistent damage, Incarnate arrival/departure

**Anchor wording:** Arrive Bone March The skeletal hulks rise from the dirt, slashing through your enemies and attacking with their dirt-encrusted, bony hands.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Skeleton Army](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/skeleton-army.json) | 6 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |
| [Clockwork Devotion](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/clockwork-devotion.json) | 8 | Enabled route | 2, 3 | 0.18 | reflex; basic; duration until the end of your next turn; target source/area/text |


## P6-027 — Incarnate arrival/departure: Incarnate Faerie Revelers

**1 spells; 0 not enabled.** Suggested source-reading anchor: Incarnate Faerie Revelers. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Native condition, Incarnate arrival/departure

**Anchor wording:** Arrive (mental) Mischief The infectious nature of the faerie revel causes chaos.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Incarnate Faerie Revelers](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/incarnate-faerie-revelers.json) | 5 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-028 — Incarnate arrival/departure: Incarnate Shadow Minuet

**1 spells; 0 not enabled.** Suggested source-reading anchor: Incarnate Shadow Minuet. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Area exposure, Save-result condition rider, Native condition, Incarnate arrival/departure

**Anchor wording:** Arrive (spirit) Dance Card Your shadow invites other shadows to dance with it.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Incarnate Shadow Minuet](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/incarnate-shadow-minuet.json) | 4 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-029 — Incarnate arrival/departure: Incarnate Skeletal Giant

**1 spells; 0 not enabled.** Suggested source-reading anchor: Incarnate Skeletal Giant. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Save-result condition rider, Basic-save damage, Native condition, Incarnate arrival/departure

**Anchor wording:** Arrive Earthshaking Entrance The giant lands on the ground with a resounding crash, shaking the earth with its weight.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Incarnate Skeletal Giant](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/incarnate-skeletal-giant.json) | 5 | Enabled route | 2, 3 | 1.00 | reflex; basic; duration until the end of your next turn; target source/area/text |


## P6-030 — Incarnate arrival/departure: Incarnate Tempest of Shades

**1 spells; 0 not enabled.** Suggested source-reading anchor: Incarnate Tempest of Shades. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Condition-dependent lifetime, Save-result condition rider, Native condition, Incarnate arrival/departure

**Anchor wording:** Arrive (void) Vortex of Death Each enemy creature within a type:emanation|distance:60 must attempt a Fortitude save with the following effects..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Incarnate Tempest of Shades](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/incarnate-tempest-of-shades.json) | 7 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-031 — Incarnate arrival/departure: Summon Healing Servitor

**1 spells; 0 not enabled.** Suggested source-reading anchor: Summon Healing Servitor. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Basic-save damage, Healing / recipient mode, Incarnate arrival/departure

**Anchor wording:** Arrive (healing, necromancy, vitality) Servitor's Protection The servitor appears in a flash of light, moving from ally to ally and granting them a temporary reprieve.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Summon Healing Servitor](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/summon-healing-servitor.json) | 5 | Enabled route | 2, 3, 4 | 1.00 | fortitude; basic; duration until the end of your next turn; target source/area/text |


## P6-032 — Incarnate arrival/departure: Summon Stampede

**1 spells; 0 not enabled.** Suggested source-reading anchor: Summon Stampede. This is not a verified-test designation.

**Test contract:** Arrival/departure effects; entity size and placement; movement/actions; end timing; no assumed ordinary summoned-actor controls.

**Shared signals:** Area exposure, Save-result condition rider, Basic-save damage, Native condition, Counteract, Incarnate arrival/departure

**Anchor wording:** Arrive (emotion, fear, mental) Foreboding Tremors The sheer energy of a stampede can cause even apex predators to panic.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Summon Stampede](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/summon-stampede.json) | 7 | Enabled route | 2, 3, 4 | 1.00 | will; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P6-033 — Creature creation: Summon Elemental

**12 spells; 0 not enabled.** Suggested source-reading anchor: Summon Elemental. This is not a verified-test designation.

**Test contract:** Legal creature selection/rank; missing data; placement; ownership; independent cast identity; duration; detachment.

**Shared signals:** Creature creation

**Anchor wording:** ou summon a creature that has the elemental trait and whose level is 1 or lower to fight for you..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Summon Elemental](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/summon-elemental.json) | 2 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Fiend](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/summon-fiend.json) | 5 | Enabled route | 3, 4 | 0.80 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Celestial](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/summon-celestial.json) | 5 | Enabled route | 3, 4 | 0.80 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Dragon](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/summon-dragon.json) | 5 | Enabled route | 3, 4 | 0.80 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Giant](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/summon-giant.json) | 5 | Enabled route | 3, 4 | 0.79 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Monitor](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/summon-monitor.json) | 5 | Enabled route | 3, 4 | 0.79 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Entity](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/summon-entity.json) | 5 | Enabled route | 3, 4 | 0.78 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Undead](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/summon-undead.json) | 1 | Enabled route | 3, 4 | 0.72 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Animal](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/summon-animal.json) | 1 | Enabled route | 3, 4 | 0.71 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Construct](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/summon-construct.json) | 1 | Enabled route | 3, 4 | 0.69 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Fey](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/summon-fey.json) | 1 | Enabled route | 3, 4 | 0.69 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Plant or Fungus](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/summon-plant-or-fungus.json) | 1 | Enabled route | 3, 4 | 0.64 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P6-034 — Creature creation: Summon Axiom

**3 spells; 0 not enabled.** Suggested source-reading anchor: Summon Axiom. This is not a verified-test designation.

**Test contract:** Legal creature selection/rank; missing data; placement; ownership; independent cast identity; duration; detachment.

**Shared signals:** Creature creation

**Anchor wording:** You summon a common lawful creature that has the celestial, monitor, or fiend trait and whose level is 5 or lower.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Summon Axiom](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/summon-axiom.json) | 5 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Anarch](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/summon-anarch.json) | 5 | Note only (resolved) | 3, 4 | 0.83 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Summon Lesser Servitor](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/summon-lesser-servitor.json) | 1 | Enabled route | 3, 4 | 0.36 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P6-035 — Creature creation: Phantasmal Minion

**1 spells; 0 not enabled.** Suggested source-reading anchor: Phantasmal Minion. This is not a verified-test designation.

**Test contract:** Legal creature selection/rank; missing data; placement; ownership; independent cast identity; duration; detachment.

**Shared signals:** Created entities

**Anchor wording:** ou summon a Phantasmal Minion.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Phantasmal Minion](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/phantasmal-minion.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


