# Phase 2: Outcome-specific Effects and conditions

595 primary worklist entries; 1330 entries with this phase signal including cross-phase dependencies. Assignments are planning candidates, not verified semantic classifications.

Descriptions are grouped first by rule family, then by normalized word/bigram similarity. Each cohort has at most 12 entries. Similarity is a discovery aid; check the full source and differing values/branches before sharing implementation or evidence.

## Rule-family index

| Rule family | Spells | Not enabled | Wording cohorts |
| --- | --- | --- | --- |
| Delegated affliction | 24 | 0 | 8 |
| Basic-save damage | 58 | 0 | 32 |
| Native condition | 162 | 0 | 70 |
| Save-result condition rider | 32 | 0 | 15 |
| degree-outcome | 68 | 0 | 49 |
| native-effect | 159 | 0 | 76 |
| Persistent damage | 53 | 0 | 19 |
| Temporary immunity | 39 | 0 | 12 |


## P2-001 — Delegated affliction: Spider Sting

**12 spells; 0 not enabled.** Suggested source-reading anchor: Spider Sting. This is not a verified-test designation.

**Test contract:** Initial outcomes; affliction handoff explicitly shown; no claim of delegated progression automation.

**Shared signals:** Save-result condition rider, Delegated affliction

**Anchor wording:** Failure The target is afflicted with spider venom at stage 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spider Sting](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/spider-sting.json) | 1 | Enabled route | — | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Leng Sting](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/leng-sting.json) | 7 | Enabled route | — | 0.79 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Imp Sting](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/imp-sting.json) | 2 | Enabled route | — | 0.63 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Swarming Wasp Stings](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/swarming-wasp-stings.json) | 4 | Enabled route | — | 0.61 | fortitude; non-basic/no save; duration outcome/text; target 10-foot burst |
| [Purple Worm Sting](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/purple-worm-sting.json) | 6 | Enabled route | — | 0.60 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Linnorm Sting](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/linnorm-sting.json) | 9 | Enabled route | — | 0.57 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Goblin Pox](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/goblin-pox.json) | 1 | Enabled route | — | 0.57 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Wyvern Sting](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/wyvern-sting.json) | 5 | Enabled route | — | 0.54 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Blinding Bottle](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/blinding-bottle.json) | 5 | Enabled route | — | 0.47 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Internal Insurrection](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/internal-insurrection.json) | 4 | Enabled route | 3 | 0.40 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Crimson Breath](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/crimson-breath.json) | 6 | Enabled route | 3 | 0.38 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Advanced Scurvy](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/advanced-scurvy.json) | 2 | Enabled route | 3 | 0.32 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |


## P2-002 — Delegated affliction: Abyssal Plague

**6 spells; 0 not enabled.** Suggested source-reading anchor: Abyssal Plague. This is not a verified-test designation.

**Test contract:** Initial outcomes; affliction handoff explicitly shown; no claim of delegated progression automation.

**Shared signals:** Save-result condition rider, Native condition, Delegated affliction

**Anchor wording:** Failure The target is afflicted with Abyssal plague at stage 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Abyssal Plague](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/abyssal-plague.json) | 5 | Enabled route | — | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Blightburn Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/blightburn-blast.json) | 7 | Enabled route | — | 0.25 | fortitude; basic; duration outcome/text; target source/area/text |
| [Divine Plagues](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/divine-plagues.json) | 1 | Enabled route | — | 0.25 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Bone Moth's Kiss](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/bone-moths-kiss.json) | 3 | Enabled route | — | 0.23 | fortitude; non-basic/no save; duration outcome/text; target 1 creature with bones or a natural exoskeleton |
| [Blister Bomb](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/blister-bomb.json) | 3 | Enabled route | 3 | 0.19 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Blood Chestnuts](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/blood-chestnuts.json) | 4 | Enabled route | 3 | 0.18 | fortitude; non-basic/no save; duration outcome/text; target 1 living creature |


## P2-003 — Delegated affliction: Cordyceps Command

**1 spells; 0 not enabled.** Suggested source-reading anchor: Cordyceps Command. This is not a verified-test designation.

**Test contract:** Initial outcomes; affliction handoff explicitly shown; no claim of delegated progression automation.

**Shared signals:** Save-result condition rider, Native condition, Choice / casting variant, Delegated affliction

**Anchor wording:** While the target is controlled by the cordyceps toxin's stage 3 effects, it performs that behavior.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cordyceps Command](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/cordyceps-command.json) | 3 | Enabled route | 4 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |


## P2-004 — Delegated affliction: Ectoplasmic Expulsion

**1 spells; 0 not enabled.** Suggested source-reading anchor: Ectoplasmic Expulsion. This is not a verified-test designation.

**Test contract:** Initial outcomes; affliction handoff explicitly shown; no claim of delegated progression automation.

**Shared signals:** Native condition, Counteract, Delegated affliction, Modifier / resistance

**Anchor wording:** ou call upon tendrils of ephemeral ectoplasm to pass through the target and carry away a harmful psychic affliction.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ectoplasmic Expulsion](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/ectoplasmic-expulsion.json) | 5 | Enabled route | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P2-005 — Delegated affliction: Mariner's Curse

**1 spells; 0 not enabled.** Suggested source-reading anchor: Mariner's Curse. This is not a verified-test designation.

**Test contract:** Initial outcomes; affliction handoff explicitly shown; no claim of delegated progression automation.

**Shared signals:** Save-result condition rider, Native condition, Delegated affliction

**Anchor wording:** The curse can be lifted by 4th-rank Cleanse Affliction or similar magic.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mariner's Curse](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/mariners-curse.json) | 5 | Enabled route | — | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-006 — Delegated affliction: Restoration

**1 spells; 0 not enabled.** Suggested source-reading anchor: Restoration. This is not a verified-test designation.

**Test contract:** Initial outcomes; affliction handoff explicitly shown; no claim of delegated progression automation.

**Shared signals:** Native condition, Delegated affliction

**Anchor wording:** This can't reduce the stage below stage 1 or cure the affliction..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Restoration](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/restoration.json) | 2 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P2-007 — Delegated affliction: Restorative Moment

**1 spells; 0 not enabled.** Suggested source-reading anchor: Restorative Moment. This is not a verified-test designation.

**Test contract:** Initial outcomes; affliction handoff explicitly shown; no claim of delegated progression automation.

**Shared signals:** Temporary immunity, Native condition, Delegated affliction

**Anchor wording:** The target decreases the values of any Doomed and Drained conditions it has by 1 and can immediately attempt one saving throw against each affliction it has with a stage length of 1 day or less.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Restorative Moment](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/restorative-moment.json) | 5 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P2-008 — Delegated affliction: Take its Course

**1 spells; 0 not enabled.** Suggested source-reading anchor: Take its Course. This is not a verified-test designation.

**Test contract:** Initial outcomes; affliction handoff explicitly shown; no claim of delegated progression automation.

**Shared signals:** Turn trigger or boundary, Persistent damage, Delegated affliction, Modifier / resistance

**Anchor wording:** hen someone has overindulged, you can hasten them past the worst of their affliction or intensify their misery.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Take its Course](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/take-its-course.json) | 4 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-009 — Basic-save damage: Electric Arc

**12 spells; 0 not enabled.** Suggested source-reading anchor: Electric Arc. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Each target takes 2d4 electricity damage with a basic Reflex save..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Electric Arc](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/electric-arc.json) | 1 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target 1 or 2 creatures |
| [Draw the Lightning](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/draw-the-lightning.json) | 4 | Enabled route | 3 | 0.29 | reflex; basic; duration 1 minute; target 1 creature that is either taller than you or higher than you |
| [Frostbite](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/frostbite.json) | 1 | Enabled route | 3 | 0.26 | fortitude; basic; duration outcome/text; target 1 creature |
| [Sudden Bolt](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/sudden-bolt.json) | 2 | Enabled route | — | 0.21 | reflex; basic; duration outcome/text; target 1 creature or object |
| [Lightning Bolt](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/lightning-bolt.json) | 3 | Enabled route | — | 0.20 | reflex; basic; duration outcome/text; target source/area/text |
| [Acid Storm](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/acid-storm.json) | 5 | Enabled route | 3 | 0.20 | reflex; basic; duration 1 minute; target source/area/text |
| [Dragon Breath](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/dragon-breath.json) | 3 | Enabled route | — | 0.20 | reflex; basic; duration outcome/text; target source/area/text |
| [Bone Spear](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/bone-spear.json) | 1 | Enabled route | — | 0.19 | reflex; basic; duration outcome/text; target 1 of your thralls |
| [Concordant Choir](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/concordant-choir.json) | 1 | Enabled route | — | 0.19 | fortitude; basic; duration outcome/text; target varies |
| [Spirit Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/spirit-blast.json) | 6 | Enabled route | — | 0.17 | fortitude; basic; duration outcome/text; target 1 creature |
| [Sudden Blight](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/sudden-blight.json) | 2 | Enabled route | 4 | 0.17 | fortitude; basic; duration outcome/text; target source/area/text |
| [Whirling Flames](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/whirling-flames.json) | 3 | Enabled route | — | 0.16 | reflex; basic; duration outcome/text; target source/area/text |


## P2-010 — Basic-save damage: Vampiric Exsanguination

**12 spells; 0 not enabled.** Suggested source-reading anchor: Vampiric Exsanguination. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage

**Anchor wording:** You deal 12d6 void damage to living creatures in the area with a basic Fortitude save..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Vampiric Exsanguination](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/vampiric-exsanguination.json) | 6 | Enabled route | — | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |
| [Vampiric Revelry](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/vampiric-revelry.json) | 9 | Enabled route | — | 0.78 | fortitude; basic; duration outcome/text; target source/area/text |
| [Breathe Fire](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/breathe-fire.json) | 1 | Enabled route | — | 0.62 | reflex; basic; duration outcome/text; target source/area/text |
| [All-Encompassing Hunger](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/all-encompassing-hunger.json) | 1 | Enabled route | — | 0.49 | fortitude; basic; duration outcome/text; target 1 living creature |
| [Shatter Mind](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/shatter-mind.json) | 3 | Enabled route | — | 0.48 | will; basic; duration outcome/text; target source/area/text |
| [Life-Draining Roots](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/life-draining-roots.json) | 4 | Enabled route | — | 0.38 | reflex; basic; duration outcome/text; target source/area/text |
| [Telekinetic Rend](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/telekinetic-rend.json) | 1 | Enabled route | — | 0.38 | fortitude; basic; duration outcome/text; target 2 non-overlapping 5-foot bursts |
| [Drain Life](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/drain-life.json) | 3 | Enabled route | — | 0.35 | fortitude; basic; duration outcome/text; target 1 living creature |
| [Pulverizing Cascade](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/pulverizing-cascade.json) | 3 | Enabled route | — | 0.35 | reflex; basic; duration outcome/text; target source/area/text |
| [Necrotic Bomb](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/necrotic-bomb.json) | 1 | Enabled route | — | 0.28 | fortitude; basic; duration outcome/text; target 1 of your thralls |
| [Force Rain](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/force-rain.json) | 4 | Enabled route | — | 0.26 | reflex; basic; duration outcome/text; target source/area/text |
| [Chain Lightning](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/chain-lightning.json) | 6 | Enabled route | — | 0.23 | reflex; basic; duration outcome/text; target 1 creature, plus any number of additional creatures |


## P2-011 — Basic-save damage: Cone of Cold

**3 spells; 0 not enabled.** Suggested source-reading anchor: Cone of Cold. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Icy cold rushes forth from your hands. You deal 12d6 cold damage to creatures in the area.. Heightened (+1) The damage increases by 2d6..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cone of Cold](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/cone-of-cold.json) | 5 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |
| [Crashing Wave](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/crashing-wave.json) | 3 | Enabled route | — | 0.29 | reflex; basic; duration outcome/text; target source/area/text |
| [Holy Cascade](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/holy-cascade.json) | 4 | Enabled route | — | 0.18 | reflex; basic; duration outcome/text; target source/area/text |


## P2-012 — Basic-save damage: Fireball

**3 spells; 0 not enabled.** Suggested source-reading anchor: Fireball. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** A roaring blast of fire detonates at a spot you designate, dealing 6d6 fire damage.. Heightened (+1) The damage increases by 2d6..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fireball](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/fireball.json) | 3 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |
| [Hellfire Plume](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/hellfire-plume.json) | 5 | Enabled route | — | 0.17 | reflex; basic; duration outcome/text; target source/area/text |
| [Eradicate Undeath](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/eradicate-undeath.json) | 4 | Enabled route | — | 0.15 | fortitude; basic; duration outcome/text; target source/area/text |


## P2-013 — Basic-save damage: Acidic Burst

**1 spells; 0 not enabled.** Suggested source-reading anchor: Acidic Burst. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage

**Anchor wording:** ou create a shell of acid around yourself that immediately bursts outward, dealing 2d6 acid damage to each creature in the area with a basic Reflex save..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Acidic Burst](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/acidic-burst.json) | 1 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-014 — Basic-save damage: Animal Allies

**1 spells; 0 not enabled.** Suggested source-reading anchor: Animal Allies. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage, Creature creation

**Anchor wording:** The animals swarm around the creatures in the area, dealing each of them 3d4 piercing damage with a basic Reflex save..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Animal Allies](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/animal-allies.json) | 1 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-015 — Basic-save damage: Bony Barrage

**1 spells; 0 not enabled.** Suggested source-reading anchor: Bony Barrage. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Turn trigger or boundary, Basic-save damage, Modifier / resistance

**Anchor wording:** Destroy the target thrall, and each creature in a 30-foot cone originating from the thrall's former space takes 2d10 piercing damage with a basic Reflex save.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Bony Barrage](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/bony-barrage.json) | 2 | Enabled route | 3 | 1.00 | reflex; basic; duration outcome/text; target 1 of your thralls |


## P2-016 — Basic-save damage: Brain Drain

**1 spells; 0 not enabled.** Suggested source-reading anchor: Brain Drain. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage, Choice / casting variant

**Anchor wording:** This deals 1d8 mental damage with a basic Will save..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Brain Drain](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/brain-drain.json) | 1 | Enabled route | 4 | 1.00 | will; basic; duration outcome/text; target 1 creature |


## P2-017 — Basic-save damage: Call the Ten

**1 spells; 0 not enabled.** Suggested source-reading anchor: Call the Ten. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Turn trigger or boundary, Basic-save damage, Modifier / resistance

**Anchor wording:** The spirits then either strike their designated targets with magical energy, dealing each one 4d6 spirit damage with a basic Fortitude save, or shield them, granting their target resistance 3 to physical and spirit damage until the beginning of your next turn.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Call the Ten](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/call-the-ten.json) | 4 | Enabled route | 3 | 1.00 | fortitude; basic; duration outcome/text; target up to 10 creatures, including yourself |


## P2-018 — Basic-save damage: Cataclysm

**1 spells; 0 not enabled.** Suggested source-reading anchor: Cataclysm. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage

**Anchor wording:** Each creature attempts one basic Reflex save that applies to all five types of damage..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cataclysm](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/cataclysm.json) | 10 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-019 — Basic-save damage: Chthonian Wrath

**1 spells; 0 not enabled.** Suggested source-reading anchor: Chthonian Wrath. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You evoke the energy of a part of the Outer Rifts. The damage types of the spell (one energy and one physical) are based on the result of rolling on the table below. You deal 4d6 damage of each of the corresponding damage types to each crea

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Chthonian Wrath](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/chthonian-wrath.json) | 5 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-020 — Basic-save damage: Cry of Destruction

**1 spells; 0 not enabled.** Suggested source-reading anchor: Cry of Destruction. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Your voice booms, smashing what's in front of you. Each creature and unattended object in the area takes 1d8 sonic damage. If you already dealt damage to an enemy this turn with a Strike or spell, increase the damage dice from this spell to

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cry of Destruction](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/cry-of-destruction.json) | 1 | Enabled route | — | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |


## P2-021 — Basic-save damage: Desiccate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Desiccate. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You pull the moisture from the targets' bodies, dealing 10d10 void damage. Creatures made of water (such as water elementals) and plant creatures use the outcome for one degree of success worse than the result of their saving throw. Creatur

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Desiccate](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/desiccate.json) | 8 | Enabled route | — | 1.00 | fortitude; basic; duration outcome/text; target any number of living creatures |


## P2-022 — Basic-save damage: Eidolon's Wrath

**1 spells; 0 not enabled.** Suggested source-reading anchor: Eidolon's Wrath. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage

**Anchor wording:** our eidolon releases a powerful energy attack that deals 5d6 damage of the type you chose when you took the Eidolon's Wrath feat, with a basic Reflex save..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Eidolon's Wrath](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/eidolons-wrath.json) | 3 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-023 — Basic-save damage: Elemental Blast

**1 spells; 0 not enabled.** Suggested source-reading anchor: Elemental Blast. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Area burst|distance:10, cone|distance:30, or line|distance:60. You gather elemental energy and blast your foes in one of the various listed shapes of your choosing, dealing 8d6 damage. This spell deals damage according to your elemental inf

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Elemental Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/elemental-blast.json) | 5 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-024 — Basic-save damage: Final Sacrifice

**1 spells; 0 not enabled.** Suggested source-reading anchor: Final Sacrifice. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage

**Anchor wording:** The target is immediately slain, and the explosion deals 6d6 fire damage to creatures within 20 feet of it with a basic Reflex save.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Final Sacrifice](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/final-sacrifice.json) | 2 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target 1 creature with the minion trait that you summoned or permanently control |


## P2-025 — Basic-save damage: Flame Strike

**1 spells; 0 not enabled.** Suggested source-reading anchor: Flame Strike. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Modifier / resistance

**Anchor wording:** Because the flame is infused with divine energy, creatures in the area apply only half their usual fire resistance.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Flame Strike](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/flame-strike.json) | 5 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-026 — Basic-save damage: Frigid Flurry

**1 spells; 0 not enabled.** Suggested source-reading anchor: Frigid Flurry. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage

**Anchor wording:** The flurry deals 9d6 cold damage and 9d6 slashing damage to all foes, with a basic Reflex save, but the gust flows harmlessly around your allies.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Frigid Flurry](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/frigid-flurry.json) | 7 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-027 — Basic-save damage: Hallowed Ground

**1 spells; 0 not enabled.** Suggested source-reading anchor: Hallowed Ground. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage, Counteract, Modifier / resistance

**Anchor wording:** Each undead creature in the area takes 1d6 vitality damage and 1d4 spirit damage when you Cast the Spell, with a basic Fortitude save.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Hallowed Ground](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/hallowed-ground.json) | 1 | Enabled route | 3, 4 | 1.00 | fortitude; basic; duration 1 minute; target source/area/text |


## P2-028 — Basic-save damage: Ibex's Harvest

**1 spells; 0 not enabled.** Suggested source-reading anchor: Ibex's Harvest. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage, Choice / casting variant

**Anchor wording:** Choose one creature in the emanation to take 2d8 mental (basic Will save), while each other creature in the emanation gains 5 temporary Hit Points that last 1 minute..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ibex's Harvest](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/ibexs-harvest.json) | 3 | Enabled route | 4 | 1.00 | will; basic; duration outcome/text; target 1 or more creature |


## P2-029 — Basic-save damage: Inevitable Disaster

**1 spells; 0 not enabled.** Suggested source-reading anchor: Inevitable Disaster. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage

**Anchor wording:** Some kind of strange accident occurs [[/gmr 1d4 #rounds]]{1d4 rounds} later, dealing 55 damage to the creature, with a basic Fortitude save.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Inevitable Disaster](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/inevitable-disaster.json) | 5 | Enabled route | — | 1.00 | fortitude; basic; duration outcome/text; target 1 creature |


## P2-030 — Basic-save damage: Invoke the Crimson Oath

**1 spells; 0 not enabled.** Suggested source-reading anchor: Invoke the Crimson Oath. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Save-result condition rider, Basic-save damage

**Anchor wording:** You deal normal melee damage for your weapon, including all appropriate bonuses, penalties, modifiers, and properties, to each creature in the spell's area; they must each attempt a basic Fortitude save.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Invoke the Crimson Oath](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/invoke-the-crimson-oath.json) | 2 | Enabled route | — | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |


## P2-031 — Basic-save damage: Lament

**1 spells; 0 not enabled.** Suggested source-reading anchor: Lament. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage, Counteract

**Anchor wording:** ou let out your negative emotions in a guttural wail that shakes your enemies' hearts and deals 1d8 mental damage (basic Will save) to each creature in the area.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Lament](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/lament.json) | 1 | Enabled route | 4 | 1.00 | will; basic; duration outcome/text; target 1 or more creatures |


## P2-032 — Basic-save damage: Metallic Meteorite Glyph

**1 spells; 0 not enabled.** Suggested source-reading anchor: Metallic Meteorite Glyph. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Turn trigger or boundary, Basic-save damage

**Anchor wording:** The meteor collides with the target, dealing 8d12[bludgeoning] damage with a basic Reflex save.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Metallic Meteorite Glyph](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/metallic-meteorite-glyph.json) | 8 | Enabled route | 3 | 1.00 | reflex; basic; duration outcome/text; target 1 creature |


## P2-033 — Basic-save damage: Powerful Inhalation

**1 spells; 0 not enabled.** Suggested source-reading anchor: Powerful Inhalation. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Save-result condition rider, Basic-save damage

**Anchor wording:** Creatures in the area when the spell is cast take 5d6 bludgeoning damage with a basic Fortitude save.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Powerful Inhalation](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/powerful-inhalation.json) | 3 | Enabled route | — | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |


## P2-034 — Basic-save damage: Retributive Pain

**1 spells; 0 not enabled.** Suggested source-reading anchor: Retributive Pain. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Trigger A creature in range damages you.. You vengefully reflect your pain upon your tormentor. The target takes mental damage equal to half the triggering damage..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Retributive Pain](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/retributive-pain.json) | 4 | Enabled route | — | 1.00 | fortitude; basic; duration outcome/text; target the triggering creature |


## P2-035 — Basic-save damage: Sacred Beasts

**1 spells; 0 not enabled.** Suggested source-reading anchor: Sacred Beasts. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Requirements You worship a deity.. You call out to the creatures of the wild favored by your deity. You quickly summon your deity's sacred animal (or a small swarm of them if the animal is usually Tiny). For example, you would call forth a 

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sacred Beasts](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/sacred-beasts.json) | 1 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-036 — Basic-save damage: Sage's Curse

**1 spells; 0 not enabled.** Suggested source-reading anchor: Sage's Curse. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure As failure, and the target treats the outcomes of all checks to Recall Knowledge as one degree of success worse than the result the target rolled (a critical success becomes a success, a success becomes a failure, and a failure becomes a critical failure)..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sage's Curse](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/sages-curse.json) | 4 | Enabled route | 3 | 1.00 | will; basic; duration varies; target 1 creature |


## P2-037 — Basic-save damage: Shattering Gem

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shattering Gem. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage

**Anchor wording:** If the gem is reduced to 0 Hit Points, it shatters, immediately dealing 1d8 slashing damage (basic Reflex save) to the creature that destroyed it, as long as that creature is within 10 feet of the target..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shattering Gem](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/shattering-gem.json) | 1 | Enabled route | 3 | 1.00 | reflex; basic; duration 1 minute; target 1 creature |


## P2-038 — Basic-save damage: Spiritual Torrent

**1 spells; 0 not enabled.** Suggested source-reading anchor: Spiritual Torrent. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You release your spiritual essence in a torrential blast of energy, dealing 10d6 damage. If you're a living creature, this spell deals vitality damage and gains the vitality trait. If you're an undead creature, this spell deals void damage 

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spiritual Torrent](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/spiritual-torrent.json) | 5 | Enabled route | — | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |


## P2-039 — Basic-save damage: Swallow Light

**1 spells; 0 not enabled.** Suggested source-reading anchor: Swallow Light. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Basic-save damage, Counteract, Choice / casting variant

**Anchor wording:** Creatures in the area can attempt a basic Reflex save against your spell DC.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Swallow Light](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/swallow-light.json) | 2 | Enabled route | 3, 4 | 1.00 | reflex; basic; duration 1 minute; target 1 magical light effect |


## P2-040 — Basic-save damage: Vampiric Feast

**1 spells; 0 not enabled.** Suggested source-reading anchor: Vampiric Feast. This is not a verified-test designation.

**Test contract:** All four multipliers; damage components/types; legal ranks; native IWR; persistent damage; extra mechanics remain gated.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Your touch leeches the lifeblood out of a target to empower yourself. You deal 6d6 void damage to the target. You gain temporary Hit Points equal to half the void damage the target takes (after applying resistances and the like). You lose a

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Vampiric Feast](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/vampiric-feast.json) | 3 | Enabled route | — | 1.00 | fortitude; basic; duration outcome/text; target 1 living creature |


## P2-041 — Native condition: Attacked from Within

**12 spells; 0 not enabled.** Suggested source-reading anchor: Attacked from Within. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Success The target takes half damage and is Frightened 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Attacked from Within](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/attacked-from-within.json) | 7 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |
| [Stop Heart](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/stop-heart.json) | 8 | Enabled route | — | 0.83 | fortitude; non-basic/no save; duration outcome/text; target 1 living creature |
| [Fear](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/fear.json) | 1 | Enabled route | 3 | 0.66 | will; non-basic/no save; duration varies; target 1 creature |
| [Accelerated Decomposition](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/accelerated-decomposition.json) | 6 | Enabled route | 3 | 0.62 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Agonizing Despair](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/agonizing-despair.json) | 3 | Enabled route | — | 0.60 | will; non-basic/no save; duration outcome/text; target 1 creature |
| [Utter Destruction](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/utter-destruction.json) | 6 | Enabled route | 3 | 0.57 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Shadow's Web](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/shadows-web.json) | 7 | Enabled route | 3 | 0.54 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Synaptic Pulse](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/synaptic-pulse.json) | 5 | Enabled route | 3 | 0.50 | will; non-basic/no save; duration 1 round; target source/area/text |
| [Canticle of Everlasting Grief](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/canticle-of-everlasting-grief.json) | 8 | Enabled route | 3 | 0.47 | will; non-basic/no save; duration varies; target 1 creature |
| [Dead Weight](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/dead-weight.json) | 1 | Enabled route | 3 | 0.43 | fortitude; non-basic/no save; duration 1 round; target 1 of your thralls |
| [Ancestral Touch](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/ancestral-touch.json) | 1 | Enabled route | — | 0.42 | will; non-basic/no save; duration outcome/text; target 1 living creature |
| [Spiritual Epidemic](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/spiritual-epidemic.json) | 8 | Enabled route | 3 | 0.42 | will; non-basic/no save; duration varies; target 1 creature |


## P2-042 — Native condition: Dizzying Colors

**12 spells; 0 not enabled.** Suggested source-reading anchor: Dizzying Colors. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Success The creature is Dazzled for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dizzying Colors](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/dizzying-colors.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 or more rounds (see below); target source/area/text |
| [Dazzling Flash](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/dazzling-flash.json) | 1 | Enabled route | 3 | 0.78 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Blinding Beauty](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/blinding-beauty.json) | 3 | Enabled route | 3 | 0.52 | will; non-basic/no save; duration outcome/text; target source/area/text |
| [Ashen Wind](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/ashen-wind.json) | 1 | Enabled route | — | 0.46 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Tortoise and the Hare](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/tortoise-and-the-hare.json) | 4 | Enabled route | 3 | 0.37 | fortitude; non-basic/no save; duration outcome/text; target 1 foe, and either yourself or 1 ally |
| [Day's Weight](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/days-weight.json) | 3 | Enabled route | 3 | 0.36 | fortitude; non-basic/no save; duration 1 minute; target 1 living creature |
| [Deathless March](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/deathless-march.json) | 4 | Enabled route | 3 | 0.36 | will; non-basic/no save; duration outcome/text; target source/area/text |
| [Manifestation of Spirits](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/manifestation-of-spirits.json) | 2 | Enabled route | 3 | 0.34 | will; non-basic/no save; duration varies; target 1 creature |
| [Grasping Grave](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/grasping-grave.json) | 5 | Enabled route | 3 | 0.29 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Stupefy](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/stupefy.json) | 2 | Enabled route | 3 | 0.29 | will; non-basic/no save; duration varies; target 1 creature |
| [Slow](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/slow.json) | 3 | Enabled route | 3 | 0.27 | fortitude; non-basic/no save; duration 1 minute; target 1 creature |
| [Roar of the Dragon](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/roar-of-the-dragon.json) | 4 | Enabled route | 3 | 0.27 | will; non-basic/no save; duration varies; target source/area/text |


## P2-043 — Native condition: Gritty Wheeze

**12 spells; 0 not enabled.** Suggested source-reading anchor: Gritty Wheeze. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Failure The creature takes full damage and is Dazzled for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Gritty Wheeze](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/gritty-wheeze.json) | 1 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Signal Skyrocket](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/signal-skyrocket.json) | 1 | Enabled route | 3 | 0.87 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Divine Decree](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/divine-decree.json) | 7 | Enabled route | 3 | 0.87 | fortitude; non-basic/no save; duration varies; target source/area/text |
| [Noise Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/noise-blast.json) | 2 | Enabled route | 3 | 0.84 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Thunderburst](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/thunderburst.json) | 3 | Enabled route | 3 | 0.81 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Spray of Stars](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/spray-of-stars.json) | 1 | Enabled route | 3 | 0.74 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Painful Vibrations](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/painful-vibrations.json) | 4 | Enabled route | 3 | 0.73 | fortitude; non-basic/no save; duration outcome/text; target 1 living creature |
| [Wails of the Damned](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/wails-of-the-damned.json) | 9 | Enabled route | — | 0.65 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Eagle's Cry](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/eagles-cry.json) | 3 | Enabled route | 3 | 0.63 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Boil Blood](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/boil-blood.json) | 8 | Enabled route | — | 0.62 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Deathly Scream](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/deathly-scream.json) | 1 | Enabled route | — | 0.62 | will; non-basic/no save; duration outcome/text; target 1 of your thralls |
| [Mantis's Grasp](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/mantiss-grasp.json) | 4 | Enabled route | 3 | 0.61 | reflex; non-basic/no save; duration outcome/text; target 1 creature |


## P2-044 — Native condition: Magical Fetters

**12 spells; 0 not enabled.** Suggested source-reading anchor: Magical Fetters. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** Success The target is Clumsy 1 and takes a –10-foot status penalty to its Speed for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Magical Fetters](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/magical-fetters.json) | 3 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration outcome/text; target 1 creature |
| [Envenom Companion](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/envenom-companion.json) | 3 | Enabled route | 3 | 0.26 | fortitude; non-basic/no save; duration 1 minute; target your companion or eidolon |
| [Albatross Curse](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/albatross-curse.json) | 2 | Enabled route | 3 | 0.26 | will; non-basic/no save; duration 1 minute (see text); target 1 creature |
| [Synesthesia](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/synesthesia.json) | 5 | Enabled route | 3 | 0.22 | will; non-basic/no save; duration varies; target 1 creature |
| [Vision of Beauty](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/vision-of-beauty.json) | 4 | Enabled route | 3 | 0.22 | will; non-basic/no save; duration varies; target 1 creature |
| [Chroma Leach](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/chroma-leach.json) | 4 | Enabled route | 3 | 0.21 | fortitude; non-basic/no save; duration outcome/text; target 1 living creature |
| [Heinous Future](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/heinous-future.json) | 6 | Enabled route | 3 | 0.20 | will; non-basic/no save; duration outcome/text; target 1 creature |
| [Debilitating Terror](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/debilitating-terror.json) | 1 | Enabled route | 3 | 0.19 | will; non-basic/no save; duration until the start of your next turn; target 1 creature |
| [Charming Push](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/charming-push.json) | 1 | Enabled route | 3 | 0.19 | will; non-basic/no save; duration until the start of your next turn; target 1 creature |
| [Mercurial Stride](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/mercurial-stride.json) | 4 | Enabled route | — | 0.18 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Remake Physiology](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/remake-physiology.json) | 9 | Enabled route | 3 | 0.17 | fortitude; non-basic/no save; duration varies; target 1 living creature |
| [Ghoulish Cravings](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/ghoulish-cravings.json) | 2 | Enabled route | 3 | 0.16 | will; non-basic/no save; duration varies; target 1 creature |


## P2-045 — Native condition: Shockwave

**12 spells; 0 not enabled.** Suggested source-reading anchor: Shockwave. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Success The creature is Off-Guard until the start of its next turn..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shockwave](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/shockwave.json) | 1 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Anchoring Air](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/anchoring-air.json) | 4 | Enabled route | 3 | 0.39 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Distracting Decoy](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/distracting-decoy.json) | 1 | Enabled route | 3 | 0.38 | will; non-basic/no save; duration outcome/text; target 1 creature |
| [Overselling Flourish](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/overselling-flourish.json) | 1 | Enabled route | 3 | 0.30 | will; non-basic/no save; duration outcome/text; target the triggering creature |
| [Shining Starlight Attack](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/shining-starlight-attack.json) | 2 | Enabled route | 3, 4 | 0.26 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Veil of Spirits](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/veil-of-spirits.json) | 2 | Enabled route | 3, 4 | 0.24 | reflex; non-basic/no save; duration 1 minute; target source/area/text |
| [Entangle Fate](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/entangle-fate.json) | 4 | Enabled route | 3 | 0.24 | will; non-basic/no save; duration 3 rounds; target 2 to 4 creatures in range |
| [Enfeeble](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/enfeeble.json) | 1 | Enabled route | 3 | 0.22 | fortitude; non-basic/no save; duration varies; target 1 creature |
| [Stagnate Time](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/stagnate-time.json) | 5 | Enabled route | 3 | 0.18 | will; non-basic/no save; duration 1 minute; target source/area/text |
| [Weird](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/weird.json) | 9 | Enabled route | 3 | 0.17 | will; non-basic/no save; duration outcome/text; target any number of creatures |
| [Threatening Mimicry](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/threatening-mimicry.json) | 3 | Enabled route | 3 | 0.16 | will; non-basic/no save; duration outcome/text; target source/area/text |
| [Equal Footing](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/equal-footing.json) | 1 | Enabled route | 3 | 0.16 | will; non-basic/no save; duration varies; target 1 creature with a land Speed greater than yours |


## P2-046 — Native condition: Stormburst

**12 spells; 0 not enabled.** Suggested source-reading anchor: Stormburst. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Failure The creature takes full damage and is knocked Prone..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Stormburst](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/stormburst.json) | 5 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Unraveling Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/unraveling-blast.json) | 1 | Enabled route | 3 | 0.42 | will; non-basic/no save; duration outcome/text; target 1 creature |
| [Arctic Rift](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/arctic-rift.json) | 8 | Enabled route | 3 | 0.40 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Chastising Retort](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/chastising-retort.json) | 1 | Enabled route | 3 | 0.37 | will; non-basic/no save; duration outcome/text; target the triggering creature |
| [Blazing Fissure](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/blazing-fissure.json) | 5 | Enabled route | 3 | 0.36 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Falling Sky](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/falling-sky.json) | 8 | Enabled route | 3 | 0.30 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Gravity Wave](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/gravity-wave.json) | 3 | Enabled route | 3 | 0.28 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Bandit's Doom](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/bandits-doom.json) | 5 | Enabled route | 3 | 0.24 | will; non-basic/no save; duration 1 month; target 1 item of 2 Bulk or less |
| [Crisis of Faith](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/crisis-of-faith.json) | 3 | Enabled route | 3 | 0.22 | will; non-basic/no save; duration outcome/text; target 1 creature |
| [Phantasmagoria](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/phantasmagoria.json) | 9 | Enabled route | 3, 4 | 0.21 | will; non-basic/no save; duration outcome/text; target any number of creatures |
| [Slime Spit](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/slime-spit.json) | 1 | Enabled route | 3 | 0.21 | reflex; non-basic/no save; duration outcome/text; target 1 creature |
| [Unsettling Perspective](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/unsettling-perspective.json) | 4 | Enabled route | 4 | 0.21 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-047 — Native condition: Quicken Time

**6 spells; 0 not enabled.** Suggested source-reading anchor: Quicken Time. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** Any creature that begins its turn in the area is Quickened until the end of its turn and can use the extra action only to Stride or Strike.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Quicken Time](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/quicken-time.json) | 5 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Glacial Causeway](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/glacial-causeway.json) | 2 | Enabled route | 3 | 0.54 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Time Skip](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/time-skip.json) | 3 | Enabled route | 3 | 0.48 | no primary save; non-basic/no save; duration 1 round; target 1 willing creature other than yourself |
| [Haste](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/haste.json) | 3 | Enabled route | 3 | 0.30 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |
| [Hasted Assault](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/hasted-assault.json) | 7 | Enabled route | 3 | 0.22 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Allegro](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/allegro.json) | 7 | Enabled route | 3 | 0.21 | no primary save; non-basic/no save; duration 1 round; target 1 ally |


## P2-048 — Native condition: Command

**3 spells; 0 not enabled.** Suggested source-reading anchor: Command. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** You can command the target to approach you, run away (as if it had the Fleeing condition), release what it's holding, drop Prone, or stand in place.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Command](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/command.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration until the end of the target's next turn; target 1 creature |
| [Dreamer's Call](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/dreamers-call.json) | 4 | Enabled route | 3, 4 | 0.21 | will; non-basic/no save; duration until the end of the target's next turn; target 1 creature |
| [Sleep](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/sleep.json) | 1 | Enabled route | 3 | 0.16 | will; non-basic/no save; duration outcome/text; target source/area/text |


## P2-049 — Native condition: Guided Introspection

**3 spells; 0 not enabled.** Suggested source-reading anchor: Guided Introspection. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** If the target would become Confused during the spell's duration, they reduce the duration of the confused condition by 1 round, to a minimum of 1 round.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Guided Introspection](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/guided-introspection.json) | 1 | Partial Effect | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |
| [Veil of Confidence](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/veil-of-confidence.json) | 1 | Enabled route | 3 | 0.25 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Strength of Mind](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/strength-of-mind.json) | 3 | Partial Effect | 3 | 0.17 | no primary save; non-basic/no save; duration 10 minutes; target 1 willing creature |


## P2-050 — Native condition: Sunburst

**3 spells; 0 not enabled.** Suggested source-reading anchor: Sunburst. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Counteract

**Anchor wording:** Critical Failure The creature takes full damage and becomes Blinded permanently..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sunburst](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/sunburst.json) | 7 | Enabled route | 3, 4 | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Moonburst](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/moonburst.json) | 7 | Enabled route | 3, 4 | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Eclipse Burst](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/eclipse-burst.json) | 7 | Enabled route | 3, 4 | 0.52 | reflex; non-basic/no save; duration outcome/text; target source/area/text |


## P2-051 — Native condition: Sure Footing

**3 spells; 0 not enabled.** Suggested source-reading anchor: Sure Footing. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition, Counteract

**Anchor wording:** Attempt to counteract an effect of your choice imposing one of these conditions on the target: Clumsy, Grabbed, or Paralyzed.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sure Footing](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/sure-footing.json) | 2 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 willing creature |
| [Clear Mind](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/clear-mind.json) | 2 | Enabled route | 3, 4 | 0.87 | no primary save; non-basic/no save; duration outcome/text; target 1 willing creature |
| [Symphony of the Unfettered Heart](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/symphony-of-the-unfettered-heart.json) | 5 | Enabled route | 4 | 0.18 | no primary save; non-basic/no save; duration outcome/text; target you or 1 ally |


## P2-052 — Native condition: You're Mine

**3 spells; 0 not enabled.** Suggested source-reading anchor: You're Mine. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Native condition

**Anchor wording:** Success The target is Stunned 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [You're Mine](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/youre-mine.json) | 5 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 round; target 1 creature |
| [Dominate](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/dominate.json) | 6 | Enabled route | 3 | 0.28 | will; non-basic/no save; duration until the next time you make your daily preparations; target 1 creature |
| [Temporary Possession](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/temporary-possession.json) | 8 | Enabled route | 3, 4 | 0.18 | will; non-basic/no save; duration outcome/text; target 1 of your thralls |


## P2-053 — Native condition: Coral Scourge

**2 spells; 0 not enabled.** Suggested source-reading anchor: Coral Scourge. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** Success The target is Clumsy 1.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Coral Scourge](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/coral-scourge.json) | 3 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target 1 creature |
| [Peaceful Bubble](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/peaceful-bubble.json) | 4 | Note only (resolved) | 3 | 0.16 | no primary save; non-basic/no save; duration 24 hours; target source/area/text |


## P2-054 — Native condition: Creative Splash

**2 spells; 0 not enabled.** Suggested source-reading anchor: Creative Splash. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** 1d4 Color Failure Critical Failure 1 White Dazzled for 1 round Dazzled for 1 minute 2 Red Enfeebled 1 for 1 round Enfeebled 2 for 1 round 3 Yellow Frightened 1 Frightened 2 4 Blue Clumsy 1 for 1 round Clumsy 2 for 1 round

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Creative Splash](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/creative-splash.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target source/area/text |
| [Prismatic Spray](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/prismatic-spray.json) | 7 | Enabled route | — | 0.20 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-055 — Native condition: Dirge of Doom

**2 spells; 0 not enabled.** Suggested source-reading anchor: Dirge of Doom. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** nemies within the area are Frightened 1.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dirge of Doom](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/dirge-of-doom.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 round; target source/area/text |
| [Menacing Lament](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/menacing-lament.json) | 2 | Enabled route | 3 | 0.18 | no primary save; non-basic/no save; duration 1 round; target source/area/text |


## P2-056 — Native condition: Euphoric Renewal

**2 spells; 0 not enabled.** Suggested source-reading anchor: Euphoric Renewal. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition, Modifier / resistance

**Anchor wording:** You're Quickened on your next turn.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Euphoric Renewal](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/euphoric-renewal.json) | 4 | Partial Effect | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |
| [Cutting Eye](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/cutting-eye.json) | 1 | Enabled route | 3 | 0.26 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-057 — Native condition: Horrific Visage

**2 spells; 0 not enabled.** Suggested source-reading anchor: Horrific Visage. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Failure The foe is Frightened 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Horrific Visage](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/horrific-visage.json) | 3 | Enabled route | — | 1.00 | will; non-basic/no save; duration outcome/text; target source/area/text |
| [Temporal Distortion](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/temporal-distortion.json) | 1 | Enabled route | 3 | 0.15 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-058 — Native condition: Rallying Banner

**2 spells; 0 not enabled.** Suggested source-reading anchor: Rallying Banner. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition, Modifier / resistance

**Anchor wording:** They gain a +1 status bonus to attack rolls and a +1 status bonus to saves against fear, emotion effects that inflict despair, and effects that would impose the Confused or Controlled condition.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Rallying Banner](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/rallying-banner.json) | 5 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |
| [Death Ward](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/death-ward.json) | 5 | Partial Effect | 3 | 0.15 | no primary save; non-basic/no save; duration 10 minutes; target 1 living creature touched |


## P2-059 — Native condition: Schadenfreude

**2 spells; 0 not enabled.** Suggested source-reading anchor: Schadenfreude. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Failure The creature is overcome by its amusement and is Stupefied 1 for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Schadenfreude](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/schadenfreude.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration outcome/text; target the triggering foe |
| [Perfected Body](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/perfected-body.json) | 4 | Enabled route | — | 0.17 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-060 — Native condition: Uncontrollable Dance

**2 spells; 0 not enabled.** Suggested source-reading anchor: Uncontrollable Dance. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** For the duration of the spell, the target is Off-Guard and can't use reactions.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Uncontrollable Dance](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/uncontrollable-dance.json) | 8 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |
| [Unspeakable Shadow](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/unspeakable-shadow.json) | 9 | Enabled route | 3, 4 | 0.15 | will; non-basic/no save; duration varies; target 1 creature |


## P2-061 — Native condition: Unfettered Movement

**2 spells; 0 not enabled.** Suggested source-reading anchor: Unfettered Movement. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** When they attempt to Escape an effect that has them Immobilized, Grabbed, or Restrained, they automatically succeed unless the effect is magical and of a higher rank than the unfettered movement spell..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unfettered Movement](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/unfettered-movement.json) | 4 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target 1 creature touched |
| [Unimpeded Stride](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/unimpeded-stride.json) | 1 | Enabled route | — | 0.29 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-062 — Native condition: Unrelenting Gravity

**2 spells; 0 not enabled.** Suggested source-reading anchor: Unrelenting Gravity. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Failure The target falls Prone and is encumbered for 1 round.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unrelenting Gravity](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/unrelenting-gravity.json) | 2 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration 1 round; target 1 creature |
| [Shape Stone](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/shape-stone.json) | 4 | Enabled route | 3 | 0.15 | reflex; non-basic/no save; duration outcome/text; target cube of stone 10 feet across or smaller |


## P2-063 — Native condition: Vampiric Maiden

**2 spells; 0 not enabled.** Suggested source-reading anchor: Vampiric Maiden. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** The target takes full damage and is Immobilized by the iron maiden for 1 round or until it uses an Interact action to extricate itself, whichever comes first..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Vampiric Maiden](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/vampiric-maiden.json) | 4 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Flesh Tsunami](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/flesh-tsunami.json) | 8 | Enabled route | 3 | 0.29 | fortitude; non-basic/no save; duration 1 minute; target 1 of your thralls |


## P2-064 — Native condition: Annunciation of the Outer Gate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Annunciation of the Outer Gate. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Information / adjudication

**Anchor wording:** Success The creature is Frightened 1.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Annunciation of the Outer Gate](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/annunciation-of-the-outer-gate.json) | 3 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration 10 minutes (see text); target source/area/text |


## P2-065 — Native condition: Aromatic Lure

**1 spells; 0 not enabled.** Suggested source-reading anchor: Aromatic Lure. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Success The target is distracted by the tantalizing scents, becoming Stupefied 1 for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Aromatic Lure](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/aromatic-lure.json) | 4 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration Varies; target 1 creature |


## P2-066 — Native condition: Astral Labyrinth

**1 spells; 0 not enabled.** Suggested source-reading anchor: Astral Labyrinth. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Counteract, Choice / casting variant, Incarnate arrival/departure

**Anchor wording:** Success The creature is Stunned 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Astral Labyrinth](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/astral-labyrinth.json) | 9 | Note only (resolved) | 3, 4 | 1.00 | will; non-basic/no save; duration 1 day; target source/area/text |


## P2-067 — Native condition: Banishment

**1 spells; 0 not enabled.** Suggested source-reading anchor: Banishment. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Modifier / resistance

**Anchor wording:** Critical Success The target resists being banished and you are Stunned 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Banishment](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/banishment.json) | 5 | Enabled route | — | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature that isn't on its home plane |


## P2-068 — Native condition: Befuddle

**1 spells; 0 not enabled.** Suggested source-reading anchor: Befuddle. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** ou sow seeds of confusion in your target's mind, causing its actions and thoughts to become clumsy..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Befuddle](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/befuddle.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 round; target 1 creature |


## P2-069 — Native condition: Cast into Time

**1 spells; 0 not enabled.** Suggested source-reading anchor: Cast into Time. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Native condition, Information / adjudication

**Anchor wording:** When it returns, it takes full damage and is Sickened 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cast into Time](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/cast-into-time.json) | 6 | Enabled route | 3, 4 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |


## P2-070 — Native condition: Channel Arrogance

**1 spells; 0 not enabled.** Suggested source-reading anchor: Channel Arrogance. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Information / adjudication

**Anchor wording:** Success The target takes half damage and is Fascinated with you for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Channel Arrogance](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/channel-arrogance.json) | 4 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-071 — Native condition: Chromatic Image

**1 spells; 0 not enabled.** Suggested source-reading anchor: Chromatic Image. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** Green 5[poison] damage and 5[mental] damage, plus it's Frightened 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Chromatic Image](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/chromatic-image.json) | 6 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-072 — Native condition: Cleansing Flames

**1 spells; 0 not enabled.** Suggested source-reading anchor: Cleansing Flames. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition, Counteract, Modifier / resistance

**Anchor wording:** You can attempt to counteract a single poison or non-curse effect imparting the Clumsy, Dazzled, Enfeebled, Fatigued, Frightened, Paralyzed, Sickened, or Stupefied condition.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cleansing Flames](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/cleansing-flames.json) | 5 | Enabled route | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P2-073 — Native condition: Crescent Scepter

**1 spells; 0 not enabled.** Suggested source-reading anchor: Crescent Scepter. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** Success The creature becomes Frightened 1, the penalty applying to its attack roll..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Crescent Scepter](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/crescent-scepter.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration until the beginning of your next turn; target source/area/text |


## P2-074 — Native condition: Curse of Recoil

**1 spells; 0 not enabled.** Suggested source-reading anchor: Curse of Recoil. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Native condition, Modifier / resistance

**Anchor wording:** Success The recoil from their ranged attack causes the target to be Off-Guard until the beginning of their next turn..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Curse of Recoil](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/curse-of-recoil.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 round; target 1 creature |


## P2-075 — Native condition: Defy the Gods

**1 spells; 0 not enabled.** Suggested source-reading anchor: Defy the Gods. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Modifier / resistance

**Anchor wording:** If the target has the divine, holy, or unholy trait and becomes drained by this spell, you gain resistance 15 to holy and unholy for 1 minute..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Defy the Gods](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/defy-the-gods.json) | 7 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-076 — Native condition: Distracting Chatter

**1 spells; 0 not enabled.** Suggested source-reading anchor: Distracting Chatter. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Modifier / resistance

**Anchor wording:** The target is Off-Guard, takes a -2 status penalty to purely auditory Perception checks, and must succeed at a flat|dc:5 to use auditory abilities or verbal spell components.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Distracting Chatter](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/distracting-chatter.json) | 3 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-077 — Native condition: Dread Secret

**1 spells; 0 not enabled.** Suggested source-reading anchor: Dread Secret. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Native condition, Choice / casting variant, Information / adjudication, Modifier / resistance

**Anchor wording:** Failure As success, and the creature becomes Frightened 1 from the revelation of its dread secret..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dread Secret](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/dread-secret.json) | 6 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration until the end of your next turn; target up to 6 creatures |


## P2-078 — Native condition: Déjà Vu

**1 spells; 0 not enabled.** Suggested source-reading anchor: Déjà Vu. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Turn trigger or boundary, Native condition

**Anchor wording:** If the target can't repeat an action, such as Casting a Spell that has been exhausted or needing to target a creature that has died, it can act as it chooses for that action but becomes Stupefied 1 until the end of its turn..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Déjà Vu](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/déjà-vu.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 2 rounds; target 1 creature |


## P2-079 — Native condition: Eject Soul

**1 spells; 0 not enabled.** Suggested source-reading anchor: Eject Soul. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Choice / casting variant

**Anchor wording:** Failure The target is Stunned 1 as its soul briefly loses its connection to their body..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Eject Soul](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/eject-soul.json) | 1 | Enabled route | 3, 4 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 living creature that has a soul |


## P2-080 — Native condition: Expeditious Excavation

**1 spells; 0 not enabled.** Suggested source-reading anchor: Expeditious Excavation. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Failure The creature falls Prone in the nearest available space of its choice or falls into the pit if it prefers..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Expeditious Excavation](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/expeditious-excavation.json) | 2 | Enabled route | — | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |


## P2-081 — Native condition: Flames of Ego

**1 spells; 0 not enabled.** Suggested source-reading anchor: Flames of Ego. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Success The target sheds bright light in a emanation|distance:20 (and dim light to the next 40 feet) and becomes Fascinated with itself for 1 round.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Flames of Ego](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/flames-of-ego.json) | 5 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-082 — Native condition: Foresight

**1 spells; 0 not enabled.** Suggested source-reading anchor: Foresight. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition, Choice / casting variant, Information / adjudication, Modifier / resistance

**Anchor wording:** While foresight is in effect, the target gains a +2 status bonus to initiative rolls and isn't Off-Guard against Undetected creatures or when flanked.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Foresight](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/foresight.json) | 9 | Partial Effect | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target 1 creature |


## P2-083 — Native condition: Grease

**1 spells; 0 not enabled.** Suggested source-reading anchor: Grease. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Modifier / resistance

**Anchor wording:** Each creature standing on the greasy surface must succeed at a Reflex save or an Acrobatics check against your spell DC or fall Prone.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Grease](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/grease.json) | 1 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target 1 object of Bulk 1 or less |


## P2-084 — Native condition: Hollow Heart

**1 spells; 0 not enabled.** Suggested source-reading anchor: Hollow Heart. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Critical Failure As failure, and the target is Frightened 1 as it realizes it can't rely on anyone but itself..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Hollow Heart](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/hollow-heart.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-085 — Native condition: Hypnopompic Terrors

**1 spells; 0 not enabled.** Suggested source-reading anchor: Hypnopompic Terrors. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** ou send a wave of nightmarish visions crashing over your targets, leaving them paralyzed by fear.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Hypnopompic Terrors](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/hypnopompic-terrors.json) | 8 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration outcome/text; target up to 10 creatures |


## P2-086 — Native condition: Impending Doom

**1 spells; 0 not enabled.** Suggested source-reading anchor: Impending Doom. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** On the second round, it becomes Off-Guard.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Impending Doom](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/impending-doom.json) | 3 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 3 round; target 1 living creature |


## P2-087 — Native condition: Invoke True Name

**1 spells; 0 not enabled.** Suggested source-reading anchor: Invoke True Name. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition, Modifier / resistance

**Anchor wording:** Until the end of the current turn, the target is Off-Guard against your spells and takes a -2 circumstance penalty to saving throws against your spells.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Invoke True Name](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/invoke-true-name.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature whose true name you know |


## P2-088 — Native condition: Invoke the Harrow

**1 spells; 0 not enabled.** Suggested source-reading anchor: Invoke the Harrow. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition, Modifier / resistance

**Anchor wording:** Hammers (Str) Boon: The target gains a +2 status bonus to damage rolls; Bane: The target is Enfeebled 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Invoke the Harrow](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/invoke-the-harrow.json) | 3 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 round; target 1 creature |


## P2-089 — Native condition: Liberating Command

**1 spells; 0 not enabled.** Suggested source-reading anchor: Liberating Command. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** If the target is Grabbed, Immobilized, or Restrained, it can immediately use a reaction to attempt to [[/act escape]]..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Liberating Command](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/liberating-command.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P2-090 — Native condition: Nature's Enmity

**1 spells; 0 not enabled.** Suggested source-reading anchor: Nature's Enmity. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Turn trigger or boundary, Basic-save damage, Native condition, Modifier / resistance

**Anchor wording:** The target attempts a basic Reflex save and is Off-Guard for 1 round on any outcome other than a critical success..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Nature's Enmity](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/natures-enmity.json) | 9 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration 10 minutes; target up to 5 creatures |


## P2-091 — Native condition: Necrotize

**1 spells; 0 not enabled.** Suggested source-reading anchor: Necrotize. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Native condition, Modifier / resistance

**Anchor wording:** Joints The target's joints necrotize, making its movements ungainly and clumsy.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Necrotize](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/necrotize.json) | 6 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration varies; target 1 living creature |


## P2-092 — Native condition: Never Mind

**1 spells; 0 not enabled.** Suggested source-reading anchor: Never Mind. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Success The target is Stupefied 2 for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Never Mind](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/never-mind.json) | 6 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-093 — Native condition: Prismatic Armor

**1 spells; 0 not enabled.** Suggested source-reading anchor: Prismatic Armor. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Modifier / resistance

**Anchor wording:** An attacker that critically fails on its saving throw against the spell is Blinded rather than Dazzled..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Prismatic Armor](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/prismatic-armor.json) | 7 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |


## P2-094 — Native condition: Radiant Field

**1 spells; 0 not enabled.** Suggested source-reading anchor: Radiant Field. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Turn trigger or boundary, Native condition

**Anchor wording:** Creatures with Light Blindness that are Blinded by radiant field and remain in the area must attempt a Fortitude save at the start of their turns.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Radiant Field](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/radiant-field.json) | 2 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |


## P2-095 — Native condition: Raise Dead

**1 spells; 0 not enabled.** Suggested source-reading anchor: Raise Dead. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** The time spent in the Boneyard leaves the target temporarily debilitated, making it Clumsy 2, Drained 2, and Enfeebled 2 for 1 week; these conditions can't be removed or reduced by any means until the week has passed.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Raise Dead](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/raise-dead.json) | 6 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 dead creature of 13th level or lower |


## P2-096 — Native condition: Ranger's Bramble

**1 spells; 0 not enabled.** Suggested source-reading anchor: Ranger's Bramble. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** A creature that critically fails the save takes (max(0,@item.level -1))d4[bleed] damage in addition to being Immobilized.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ranger's Bramble](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/rangers-bramble.json) | 3 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target source/area/text |


## P2-097 — Native condition: Rapid Adaptation

**1 spells; 0 not enabled.** Suggested source-reading anchor: Rapid Adaptation. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Granted movement speed, Native condition, Information / adjudication, Modifier / resistance

**Anchor wording:** Mountain The target isn't Off-Guard when Climbing, and when it rolls a success on an Acrobatics check to Balance on rubble, it gets a critical success instead..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Rapid Adaptation](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/rapid-adaptation.json) | 2 | Partial Effect | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target your companion or eidolon |


## P2-098 — Native condition: Restraining Chains

**1 spells; 0 not enabled.** Suggested source-reading anchor: Restraining Chains. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Failure The target is Clumsy 1 and can only move up to 10 feet away from where the chains are fettered until the chains are broken or the target Escapes..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Restraining Chains](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/restraining-chains.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 creature touching or standing on a solid surface |


## P2-099 — Native condition: Revealing Light

**1 spells; 0 not enabled.** Suggested source-reading anchor: Revealing Light. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Choice / casting variant

**Anchor wording:** A creature affected by revealing light is Dazzled.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Revealing Light](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/revealing-light.json) | 2 | Enabled route | 3, 4 | 1.00 | reflex; non-basic/no save; duration varies; target source/area/text |


## P2-100 — Native condition: Share Vision

**1 spells; 0 not enabled.** Suggested source-reading anchor: Share Vision. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition, Modifier / resistance

**Anchor wording:** For the duration of the hex, the two of you share any vision-based senses (such as darkvision or low-light vision) and gain a +2 status bonus to Perception checks, but if either of you are Blinded or Dazzled, you both are..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Share Vision](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/share-vision.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target 1 willing creature |


## P2-101 — Native condition: Shared Nightmare

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shared Nightmare. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Native condition

**Anchor wording:** One of you will become Confused, based on the target's Will save..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shared Nightmare](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/shared-nightmare.json) | 4 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-102 — Native condition: Shock and Awe

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shock and Awe. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Information / adjudication

**Anchor wording:** Success The target is Frightened 1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shock and Awe](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/shock-and-awe.json) | 5 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration 1 round; target source/area/text |


## P2-103 — Native condition: Soul Siphon

**1 spells; 0 not enabled.** Suggested source-reading anchor: Soul Siphon. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** You gain temporary Hit Points equal to the total amount of HP the target loses, including the HP lost from becoming Drained..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Soul Siphon](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/soul-siphon.json) | 1 | Enabled route | — | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 living creature |


## P2-104 — Native condition: Sparkleskin

**1 spells; 0 not enabled.** Suggested source-reading anchor: Sparkleskin. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Modifier / resistance

**Anchor wording:** Failure The creature is Dazzled for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sparkleskin](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/sparkleskin.json) | 3 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration 10 minutes; target 1 willing creature |


## P2-105 — Native condition: Spiritual Anamnesis

**1 spells; 0 not enabled.** Suggested source-reading anchor: Spiritual Anamnesis. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Information / adjudication

**Anchor wording:** Success The creature is Slowed 1 for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spiritual Anamnesis](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/spiritual-anamnesis.json) | 4 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-106 — Native condition: Stone to Flesh

**1 spells; 0 not enabled.** Suggested source-reading anchor: Stone to Flesh. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition

**Anchor wording:** You restore a Petrified creature to its normal state or transform a stone object into a mass of inert flesh (without stone's Hardness) in roughly the same shape..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Stone to Flesh](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/stone-to-flesh.json) | 6 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target petrified creature or human-size stone object |


## P2-107 — Native condition: Temporal Ward

**1 spells; 0 not enabled.** Suggested source-reading anchor: Temporal Ward. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Native condition

**Anchor wording:** Critical Failure As failure, but the temporal displacement also causes the creature to lose their bearings, making them Confused for 1 minute..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Temporal Ward](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/temporal-ward.json) | 6 | Note only (resolved) | 3 | 1.00 | will; non-basic/no save; duration 10 minutes; target 1 container or doorway |


## P2-108 — Native condition: Unsettling Knowledge

**1 spells; 0 not enabled.** Suggested source-reading anchor: Unsettling Knowledge. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition, Choice / casting variant

**Anchor wording:** Success The target is Fascinated by the knowledge you shared for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unsettling Knowledge](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/unsettling-knowledge.json) | 4 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-109 — Native condition: Variable Gravity

**1 spells; 0 not enabled.** Suggested source-reading anchor: Variable Gravity. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Native condition, Choice / casting variant, Modifier / resistance

**Anchor wording:** You gain a +2 status bonus to your saving throws and DCs to resist forced movement and attempts to knock you Prone.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Variable Gravity](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/variable-gravity.json) | 4 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 5 minutes; target source/area/text |


## P2-110 — Native condition: Waking Nightmare

**1 spells; 0 not enabled.** Suggested source-reading anchor: Waking Nightmare. This is not a verified-test designation.

**Test contract:** All degrees; value and duration; overlap; native immunity; per-cast ownership; correction/recovery; selective cleanup.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** A creature frightened by this spell takes 1 additional mental damage each time it's hit by a Strike..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Waking Nightmare](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/waking-nightmare.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-111 — Save-result condition rider: Void Warp

**12 spells; 0 not enabled.** Suggested source-reading anchor: Void Warp. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Native condition

**Anchor wording:** On a critical failure, the target is also Enfeebled 1 until the start of your next turn..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Void Warp](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/void-warp.json) | 1 | Enabled route | 3 | 1.00 | fortitude; basic; duration outcome/text; target 1 living creature |
| [Vitality Lash](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/vitality-lash.json) | 1 | Enabled route | 3 | 0.49 | fortitude; basic; duration outcome/text; target 1 creature that is undead or otherwise has void healing |
| [Torturous Trauma](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/torturous-trauma.json) | 1 | Enabled route | 3 | 0.44 | fortitude; basic; duration outcome/text; target 1 living creature |
| [Rip the Spirit](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/rip-the-spirit.json) | 5 | Enabled route | — | 0.40 | fortitude; basic; duration outcome/text; target 1 living creature |
| [Fungal Exhalation](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/fungal-exhalation.json) | 3 | Enabled route | — | 0.30 | reflex; basic; duration outcome/text; target source/area/text |
| [Daze](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/daze.json) | 1 | Enabled route | — | 0.27 | will; basic; duration outcome/text; target 1 creature |
| [Disorienting Flash](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/disorienting-flash.json) | 2 | Enabled route | 3 | 0.25 | fortitude; basic; duration outcome/text; target source/area/text |
| [Updraft](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/updraft.json) | 1 | Enabled route | — | 0.23 | reflex; basic; duration outcome/text; target 1 creature |
| [Tempest Surge](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/tempest-surge.json) | 1 | Enabled route | 3 | 0.21 | reflex; basic; duration outcome/text; target 1 creature |
| [Debilitating Dichotomy](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/debilitating-dichotomy.json) | 4 | Enabled route | — | 0.20 | will; basic; duration outcome/text; target 1 creature other than you |
| [Arrow Salvo](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/arrow-salvo.json) | 6 | Enabled route | — | 0.20 | reflex; basic; duration outcome/text; target source/area/text |
| [Haunting Hymn](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/haunting-hymn.json) | 1 | Enabled route | 3 | 0.19 | fortitude; basic; duration outcome/text; target source/area/text |


## P2-112 — Save-result condition rider: Entreat the Many

**3 spells; 0 not enabled.** Suggested source-reading anchor: Entreat the Many. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Additionally, creatures that critically fail the save are knocked Prone..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Entreat the Many](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/entreat-the-many.json) | 6 | Enabled route | — | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |
| [Firework Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/firework-blast.json) | 3 | Enabled route | — | 0.20 | reflex; basic; duration outcome/text; target source/area/text |
| [Unfolding Wind Crash](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/unfolding-wind-crash.json) | 9 | Enabled route | 3 | 0.20 | reflex; basic; duration outcome/text; target source/area/text |


## P2-113 — Save-result condition rider: Spirit Song

**3 spells; 0 not enabled.** Suggested source-reading anchor: Spirit Song. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Save-result condition rider, Native condition

**Anchor wording:** Critical Failure The creature takes double damage, can't use reactions until the beginning of its turn, and is Stunned 2..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spirit Song](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/spirit-song.json) | 8 | Enabled route | 3 | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |
| [Split the Tongue](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/split-the-tongue.json) | 1 | Enabled route | 3 | 0.19 | fortitude; basic; duration outcome/text; target A creature within 30 feet fails a Deception or Diplomacy check. |
| [Ordained Purpose](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/ordained-purpose.json) | 4 | Enabled route | — | 0.17 | will; basic; duration outcome/text; target source/area/text |


## P2-114 — Save-result condition rider: Timber

**3 spells; 0 not enabled.** Suggested source-reading anchor: Timber. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Basic-save damage, Native condition

**Anchor wording:** A creature that critically fails its save is knocked for a loop, making it Dazzled until the end of its next turn..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Timber](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/timber.json) | 1 | Enabled route | 3 | 1.00 | reflex; basic; duration outcome/text; target source/area/text |
| [Localized Quake](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/localized-quake.json) | 4 | Enabled route | 3 | 0.31 | reflex; basic; duration outcome/text; target source/area/text |
| [Noxious Vapors](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/noxious-vapors.json) | 1 | Enabled route | 3 | 0.23 | fortitude; basic; duration 1 round; target source/area/text |


## P2-115 — Save-result condition rider: Explosive Barrage

**1 spells; 0 not enabled.** Suggested source-reading anchor: Explosive Barrage. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Basic-save damage, Native condition

**Anchor wording:** Each creature caught in at least one of these bursts takes 6d8 fire damage and 6d4 sonic damage (basic Fortitude save).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Explosive Barrage](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/explosive-barrage.json) | 6 | Enabled route | 3 | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |


## P2-116 — Save-result condition rider: Frog Tongue

**1 spells; 0 not enabled.** Suggested source-reading anchor: Frog Tongue. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Basic-save damage, Native condition, Modifier / resistance

**Anchor wording:** our tongue extends unnaturally, flicking out toward a creature within range and dealing 2d8 bludgeoning damage (basic Reflex save).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Frog Tongue](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/frog-tongue.json) | 2 | Enabled route | 3 | 1.00 | reflex; basic; duration 1 minute; target 1 creature |


## P2-117 — Save-result condition rider: Pain of Ages

**1 spells; 0 not enabled.** Suggested source-reading anchor: Pain of Ages. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Save-result condition rider, Native condition, Information / adjudication

**Anchor wording:** On a critical failure, the creature is also Stunned for 1 round as it reels from the impact of so much anguish..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Pain of Ages](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/pain-of-ages.json) | 6 | Enabled route | 3, 4 | 1.00 | will; basic; duration outcome/text; target source/area/text |


## P2-118 — Save-result condition rider: Parch

**1 spells; 0 not enabled.** Suggested source-reading anchor: Parch. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Save-result condition rider, Native condition, Choice / casting variant, Modifier / resistance

**Anchor wording:** Critical Failure The target takes a –2 status penalty to its checks and DCs for 1 minute and is Dazzled as long as it has this penalty..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Parch](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/parch.json) | 1 | Enabled route | 3, 4 | 1.00 | fortitude; basic; duration outcome/text; target 1 creature |


## P2-119 — Save-result condition rider: Plasma Whirl

**1 spells; 0 not enabled.** Suggested source-reading anchor: Plasma Whirl. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Save-result condition rider, Basic-save damage, Native condition

**Anchor wording:** Creatures that fail their saves become Sickened 1 (Sickened 2 on a critical failure) due to their exposure to cosmic radiation..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Plasma Whirl](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/plasma-whirl.json) | 5 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-120 — Save-result condition rider: Radiant Beam

**1 spells; 0 not enabled.** Suggested source-reading anchor: Radiant Beam. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Save-result condition rider, Native condition, Counteract

**Anchor wording:** On a failed saving throw, a creature becomes Dazzled for 1 round, or dazzled for 4 rounds on a critical failure..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Radiant Beam](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/radiant-beam.json) | 4 | Enabled route | 3, 4 | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-121 — Save-result condition rider: Redistribute Potential

**1 spells; 0 not enabled.** Suggested source-reading anchor: Redistribute Potential. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Turn trigger or boundary, Basic-save damage, Native condition, Choice / casting variant

**Anchor wording:** A creature that fails its save also becomes Clumsy 1 from numbness if it's in the area of stolen heat or Enfeebled 1 from heat stroke if it's in the area of concentrated heat; these conditions last until the start of your next turn.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Redistribute Potential](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/redistribute-potential.json) | 5 | Enabled route | 3, 4 | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |


## P2-122 — Save-result condition rider: Remember the Lost

**1 spells; 0 not enabled.** Suggested source-reading anchor: Remember the Lost. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Save-result condition rider, Basic-save damage, Native condition

**Anchor wording:** Enemies in the area take 6d6 mental damage (basic Will save) and are Frightened 1 on a critical failure..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Remember the Lost](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/remember-the-lost.json) | 4 | Enabled route | — | 1.00 | will; basic; duration outcome/text; target source/area/text |


## P2-123 — Save-result condition rider: Stifling Stillness

**1 spells; 0 not enabled.** Suggested source-reading anchor: Stifling Stillness. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Basic-save damage, Native condition

**Anchor wording:** Creatures in the area that breathe air and aren't holding their breath must spend a single action on their turn straining to breathe the stagnant air; once they do, they still mostly breathe their own exhaled air, taking 3d6 poison damage (basic Fortitude save) and becoming Fatigued..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Stifling Stillness](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/stifling-stillness.json) | 4 | Enabled route | 3 | 1.00 | fortitude; basic; duration 1 minute; target source/area/text |


## P2-124 — Save-result condition rider: Thunderstrike

**1 spells; 0 not enabled.** Suggested source-reading anchor: Thunderstrike. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Basic-save damage, Native condition, Modifier / resistance

**Anchor wording:** ou call down a tendril of lightning that cracks with thunder, dealing 1d12 electricity damage and 1d4 sonic damage to the target with a basic Reflex save.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Thunderstrike](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/thunderstrike.json) | 1 | Enabled route | 3 | 1.00 | reflex; basic; duration outcome/text; target 1 creature |


## P2-125 — Save-result condition rider: Vomit Swarm

**1 spells; 0 not enabled.** Suggested source-reading anchor: Vomit Swarm. This is not a verified-test designation.

**Test contract:** All four degrees; distinguish failure-inherited and critical-failure-only riders; exact rider value and timing; native damage; immunity; unknown extra clauses must refuse execution.

**Shared signals:** Basic-save damage, Native condition

**Anchor wording:** The vermin swarm over anyone in the area, their bites and stings dealing 2d8 piercing damage (basic Reflex save).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Vomit Swarm](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/vomit-swarm.json) | 2 | Enabled route | — | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-126 — Degree Outcome: Subconscious Suggestion

**12 spells; 0 not enabled.** Suggested source-reading anchor: Subconscious Suggestion. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure As failure, but the duration is 1 hour..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Subconscious Suggestion](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/subconscious-suggestion.json) | 5 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |
| [Suggestion](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/suggestion.json) | 4 | Enabled route | 3 | 0.65 | will; non-basic/no save; duration varies; target 1 creature |
| [Dull Ambition](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/dull-ambition.json) | 4 | Enabled route | 3 | 0.63 | will; non-basic/no save; duration varies; target 1 creature |
| [Grasp of the Deep](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/grasp-of-the-deep.json) | 4 | Enabled route | 3 | 0.47 | will; non-basic/no save; duration 1 minute; target 1 creature |
| [Heart's Hook](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/hearts-hook.json) | 1 | Enabled route | — | 0.24 | will; non-basic/no save; duration outcome/text; target two creatures |
| [Behold the Weave](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/behold-the-weave.json) | 3 | Enabled route | 3 | 0.22 | will; non-basic/no save; duration 1 round; target 1 creature |
| [Tempest Touch](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/tempest-touch.json) | 1 | Enabled route | 3 | 0.22 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Seal Fate](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/seal-fate.json) | 4 | Enabled route | 3, 4 | 0.19 | fortitude; non-basic/no save; duration varies; target 1 living creature |
| [Planar Tether](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/planar-tether.json) | 4 | Enabled route | 3, 4 | 0.19 | will; non-basic/no save; duration varies; target 1 creature |
| [Infectious Melody](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/infectious-melody.json) | 4 | Enabled route | 3, 4 | 0.18 | will; non-basic/no save; duration varies; target enemies in the area |
| [Glossolalia](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/glossolalia.json) | 5 | Enabled route | 3, 4 | 0.16 | will; non-basic/no save; duration varies; target 1 creature |
| [Wish-Twisted Form](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/wish-twisted-form.json) | 5 | Enabled route | 3 | 0.16 | will; non-basic/no save; duration varies; target 1 creature |


## P2-127 — Degree Outcome: Chilling Spray

**4 spells; 0 not enabled.** Suggested source-reading anchor: Chilling Spray. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Modifier / resistance

**Anchor wording:** Critical Failure The creature takes double damage and takes a –10-foot status penalty to its Speeds for 2 rounds..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Chilling Spray](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/chilling-spray.json) | 1 | Enabled route | — | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Faerie Dust](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/faerie-dust.json) | 1 | Enabled route | 3 | 0.25 | will; non-basic/no save; duration 1 round; target source/area/text |
| [Draw Ire](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/draw-ire.json) | 1 | Enabled route | 3 | 0.18 | will; non-basic/no save; duration 1 minute; target 1 creature |
| [Incendiary Ashes](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/incendiary-ashes.json) | 3 | Enabled route | 3 | 0.16 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |


## P2-128 — Degree Outcome: Curse of the Spirit Orchestra

**4 spells; 0 not enabled.** Suggested source-reading anchor: Curse of the Spirit Orchestra. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Success Until the start of your next turn, the target must roll twice and use the worse result when it attempts a Diplomacy, Intimidation, Performance, or Stealth check.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Curse of the Spirit Orchestra](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/curse-of-the-spirit-orchestra.json) | 7 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |
| [Ill Omen](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/ill-omen.json) | 1 | Enabled route | 3 | 0.35 | will; non-basic/no save; duration 1 round; target 1 creature |
| [Clownish Curse](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/clownish-curse.json) | 4 | Enabled route | 3 | 0.30 | will; non-basic/no save; duration varies; target 1 creature |
| [Defensive Prescience](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/defensive-prescience.json) | 3 | Enabled route | — | 0.29 | will; non-basic/no save; duration outcome/text; target the triggering creature |


## P2-129 — Degree Outcome: Forge

**2 spells; 0 not enabled.** Suggested source-reading anchor: Forge. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Modifier / resistance

**Anchor wording:** If the target is a metal object, reduce its Hardness by an amount equal to the damage dealt until the end of your next turn..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Forge](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/forge.json) | 1 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature or unattended metal object |
| [Weaken Earth](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/weaken-earth.json) | 1 | Enabled route | 3 | 0.27 | fortitude; non-basic/no save; duration 1 minute; target 1 creature, unattended object, or hazard or structure made of stone or earth |


## P2-130 — Degree Outcome: Lock Item

**2 spells; 0 not enabled.** Suggested source-reading anchor: Lock Item. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** A willing creature can choose to critically fail the saving throw..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Lock Item](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/lock-item.json) | 2 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration varies; target 1 object held by 1 creature and the creature holding it |
| [Exchange Image](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/exchange-image.json) | 1 | Enabled route | 3 | 0.24 | will; non-basic/no save; duration varies; target you and 1 other humanoid |


## P2-131 — Degree Outcome: Binding Muzzle

**1 spells; 0 not enabled.** Suggested source-reading anchor: Binding Muzzle. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure As success, but the effect lasts 1 minute and the target can't speak..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Binding Muzzle](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/binding-muzzle.json) | 2 | Enabled route | — | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |


## P2-132 — Degree Outcome: Blinding Fury

**1 spells; 0 not enabled.** Suggested source-reading anchor: Blinding Fury. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Turn trigger or boundary, Save-result condition rider

**Anchor wording:** Success The target can't Observe you until the end of its turn, and if you're currently observed by it, you become Hidden to it..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Blinding Fury](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/blinding-fury.json) | 6 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target The triggering creature |


## P2-133 — Degree Outcome: Brand the Impenitent

**1 spells; 0 not enabled.** Suggested source-reading anchor: Brand the Impenitent. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Modifier / resistance

**Anchor wording:** Critical Failure The spell has an unlimited duration..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Brand the Impenitent](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/brand-the-impenitent.json) | 2 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration varies; target 1 creature |


## P2-134 — Degree Outcome: Caster's Imposition

**1 spells; 0 not enabled.** Suggested source-reading anchor: Caster's Imposition. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** A magical interference prevents the target from contributing to any form of cooperative spellcasting. On a failed save, the target can't participate in any ritual unless they can cast the ritual alone, and they can't access any spells provi

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Caster's Imposition](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/casters-imposition.json) | 3 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 minute; target 1 creature within 60 feet |


## P2-135 — Degree Outcome: Catch Your Name

**1 spells; 0 not enabled.** Suggested source-reading anchor: Catch Your Name. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Information / adjudication

**Anchor wording:** You learn a private name (but not the true name) of the creature who spoke your name, as well as their precise location, unless they succeed at a Will save to negate the effect.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Catch Your Name](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/catch-your-name.json) | 6 | Enabled route | 4 | 1.00 | will; non-basic/no save; duration outcome/text; target source/area/text |


## P2-136 — Degree Outcome: Celestial Accord

**1 spells; 0 not enabled.** Suggested source-reading anchor: Celestial Accord. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Modifier / resistance

**Anchor wording:** Critical Failure As failure, but the creature's attitude toward the other target improves to friendly for the duration and is indifferent thereafter (until something happens to change that attitude normally)..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Celestial Accord](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/celestial-accord.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 minute; target 2 creatures that each have an unfriendly or worse attitude toward the other |


## P2-137 — Degree Outcome: Clouded Focus

**1 spells; 0 not enabled.** Suggested source-reading anchor: Clouded Focus. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Choice / casting variant, Modifier / resistance

**Anchor wording:** Critical Failure As failure, but the target can't perceive anything beyond a range of 10 feet..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Clouded Focus](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/clouded-focus.json) | 1 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-138 — Degree Outcome: Containment

**1 spells; 0 not enabled.** Suggested source-reading anchor: Containment. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You wrap a creature in an immobile force field, whether to protect it or those around it. The field blocks attacks, effects, and creatures that would pass through it, including the target. The field has Hardness 10, 40 Hit Points, and immun

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Containment](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/containment.json) | 4 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target 1 creature |


## P2-139 — Degree Outcome: Control Water

**1 spells; 0 not enabled.** Suggested source-reading anchor: Control Water. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Area 50 feet long by 50 feet wide. By imposing your will upon the water, you can raise or lower the level of water in the chosen area by 10 feet. Creatures that have the water trait and that are in the area when you Cast the Spell must atte

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Control Water](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/control-water.json) | 5 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration 1 hour; target source/area/text |


## P2-140 — Degree Outcome: Daydreamer's Curse

**1 spells; 0 not enabled.** Suggested source-reading anchor: Daydreamer's Curse. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure As failure, except the target treats the outcomes of all checks with the concentrate trait as one degree of success worse than the result it rolled (a critical success becomes a success, a success becomes a failure, and a failure becomes a critical failure)..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Daydreamer's Curse](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/daydreamers-curse.json) | 4 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-141 — Degree Outcome: Death Knell

**1 spells; 0 not enabled.** Suggested source-reading anchor: Death Knell. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Modifier / resistance

**Anchor wording:** If this kills it, you gain 10 temporary HP and a +1 status bonus to attack and damage rolls for 10 minutes..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Death Knell](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/death-knell.json) | 2 | Enabled route | — | 1.00 | will; non-basic/no save; duration outcome/text; target 1 living creature that has 0 HP |


## P2-142 — Degree Outcome: Earthbind

**1 spells; 0 not enabled.** Suggested source-reading anchor: Earthbind. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure The target falls safely up to 120 feet.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Earthbind](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/earthbind.json) | 3 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration varies; target 1 flying creature |


## P2-143 — Degree Outcome: Ephemeral Hazards

**1 spells; 0 not enabled.** Suggested source-reading anchor: Ephemeral Hazards. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Choice / casting variant

**Anchor wording:** The hazards are merely a mental projection, and a creature receives a Will save each time it touches a hazard or is occupying one's space at the start of its turn.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ephemeral Hazards](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/ephemeral-hazards.json) | 4 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration 1 minute; target source/area/text |


## P2-144 — Degree Outcome: Excise Lexicon

**1 spells; 0 not enabled.** Suggested source-reading anchor: Excise Lexicon. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Choice / casting variant

**Anchor wording:** Critical Failure The spell's duration is unlimited..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Excise Lexicon](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/excise-lexicon.json) | 3 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-145 — Degree Outcome: Fabricated Truth

**1 spells; 0 not enabled.** Suggested source-reading anchor: Fabricated Truth. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Counteract, Choice / casting variant

**Anchor wording:** Critical Failure The target believes the statement with unlimited duration..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fabricated Truth](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/fabricated-truth.json) | 10 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration varies; target up to 5 creatures |


## P2-146 — Degree Outcome: Fate's Travels

**1 spells; 0 not enabled.** Suggested source-reading anchor: Fate's Travels. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Information / adjudication

**Anchor wording:** This information is enough to automatically succeed at Tracking the creature over that distance..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fate's Travels](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/fates-travels.json) | 3 | Note only (resolved) | 4 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 corpse |


## P2-147 — Degree Outcome: Hag's Fruit

**1 spells; 0 not enabled.** Suggested source-reading anchor: Hag's Fruit. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Effect You fall asleep for 1 round (or permanently on a critical failure) and seem to be dead; a creature must succeed at a medicine|dc:30 check to realize you're alive.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Hag's Fruit](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/hags-fruit.json) | 6 | Note only (resolved) | 3 | 1.00 | fortitude; non-basic/no save; duration 1 day; target 1 non-magical fruit |


## P2-148 — Degree Outcome: Ignite Ambition

**1 spells; 0 not enabled.** Suggested source-reading anchor: Ignite Ambition. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Modifier / resistance

**Anchor wording:** Critical Failure As success, but the creature automatically follows a suggestion that advances its own ambitions..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ignite Ambition](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/ignite-ambition.json) | 1 | Enabled route | — | 1.00 | will; non-basic/no save; duration outcome/text; target one creature being influenced |


## P2-149 — Degree Outcome: Illuminate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Illuminate. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You light all non-magical light sources in the area that use fire to provide their light—such as candles, lamps, and sconces. You can choose to make the emanation smaller than its maximum, to any distance of your choice. If a light source i

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Illuminate](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/illuminate.json) | 1 | Note only (resolved) | — | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |


## P2-150 — Degree Outcome: Impart Empathy

**1 spells; 0 not enabled.** Suggested source-reading anchor: Impart Empathy. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You expand the target's ability to understand social cues that are normally beyond its comprehension. Any creature to which the target isn't unfriendly or hostile can use Diplomacy to Make an Impression on it and to make very simple Request

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Impart Empathy](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/impart-empathy.json) | 2 | Note only (resolved) | 3 | 1.00 | will; non-basic/no save; duration 1 day; target 1 animal |


## P2-151 — Degree Outcome: Isolation

**1 spells; 0 not enabled.** Suggested source-reading anchor: Isolation. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You summon a tangible manifestation of loneliness to cloak the target from view as surely as if it were wreathed in darkness. The target attempts a Will saving throw.. Critical Success The target is unaffected.. Success The target becomes I

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Isolation](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/isolation.json) | 4 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 3 rounds; target 1 creature |


## P2-152 — Degree Outcome: Love's Sacrifice

**1 spells; 0 not enabled.** Suggested source-reading anchor: Love's Sacrifice. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Trigger You take damage that would reduce you to 0 Hit Points.. You cry out for aid, and a creature near you feels compelled to throw itself in front of the threat as the ultimate expression of their love. A target that genuinely loves the 

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Love's Sacrifice](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/loves-sacrifice.json) | 7 | Enabled route | — | 1.00 | will; non-basic/no save; duration outcome/text; target one creature |


## P2-153 — Degree Outcome: Magnetize

**1 spells; 0 not enabled.** Suggested source-reading anchor: Magnetize. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Modifier / resistance

**Anchor wording:** Whenever a creature within 15 feet Strikes a creature other than the magnetized target with a metal melee weapon, the attacker takes a –2 circumstance penalty to the attack roll..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Magnetize](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/magnetize.json) | 4 | Note only (resolved) | 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target 1 willing creature |


## P2-154 — Degree Outcome: Mark of Blood

**1 spells; 0 not enabled.** Suggested source-reading anchor: Mark of Blood. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Information / adjudication

**Anchor wording:** On a critical failure, the curse ends, and the creature's mark vanishes..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mark of Blood](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/mark-of-blood.json) | 2 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration 1 minute; target 1 piercing or slashing weapon you're wielding |


## P2-155 — Degree Outcome: Massacre

**1 spells; 0 not enabled.** Suggested source-reading anchor: Massacre. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure The creature dies..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Massacre](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/massacre.json) | 9 | Enabled route | — | 1.00 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |


## P2-156 — Degree Outcome: Mental Map

**1 spells; 0 not enabled.** Suggested source-reading anchor: Mental Map. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Information / adjudication, Modifier / resistance

**Anchor wording:** Critical Failure As failure, but you can erase all knowledge of the location from the target for 24 hours if desired..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mental Map](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/mental-map.json) | 2 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration 24 hours; target 1 creature |


## P2-157 — Degree Outcome: Mind of Menace

**1 spells; 0 not enabled.** Suggested source-reading anchor: Mind of Menace. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** This spell wards against those who attempt to subvert your mind and turns mental magic back on them. When the spell is complete, you gain the Fight with Fear reaction; once you use the reaction, the spell ends.. Spell Effect: Mind of Menace

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mind of Menace](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/mind-of-menace.json) | 3 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 24 hours; target source/area/text |


## P2-158 — Degree Outcome: Necrotic Radiation

**1 spells; 0 not enabled.** Suggested source-reading anchor: Necrotic Radiation. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure The spell lasts the full 24 hours..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Necrotic Radiation](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/necrotic-radiation.json) | 4 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration 24 hours; target one object or one 10-foot-square area |


## P2-159 — Degree Outcome: Outcast's Curse

**1 spells; 0 not enabled.** Suggested source-reading anchor: Outcast's Curse. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure As failure, and creatures that the target encounters have an initial attitude toward them of two steps worse..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Outcast's Curse](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/outcasts-curse.json) | 4 | Enabled route | — | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-160 — Degree Outcome: Paranoia

**1 spells; 0 not enabled.** Suggested source-reading anchor: Paranoia. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure As failure, except the target believes that everyone it sees is a mortal enemy.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Paranoia](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/paranoia.json) | 2 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 minute; target 1 creature |


## P2-161 — Degree Outcome: Penumbral Shroud

**1 spells; 0 not enabled.** Suggested source-reading anchor: Penumbral Shroud. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Information / adjudication, Modifier / resistance

**Anchor wording:** The target perceives light as one step lower than it actually is (bright light becomes dim light, for example), affecting their ability to sense creatures and objects accordingly..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Penumbral Shroud](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/penumbral-shroud.json) | 1 | Enabled route | 3, 4 | 1.00 | reflex; non-basic/no save; duration 10 minutes; target 1 creature |


## P2-162 — Degree Outcome: Personal Rain Cloud

**1 spells; 0 not enabled.** Suggested source-reading anchor: Personal Rain Cloud. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Turn trigger or boundary, Modifier / resistance

**Anchor wording:** Creatures with weakness to water take damage equal to their weakness at the end of each of their turns.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Personal Rain Cloud](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/personal-rain-cloud.json) | 1 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target 1 creature |


## P2-163 — Degree Outcome: Phantom Prison

**1 spells; 0 not enabled.** Suggested source-reading anchor: Phantom Prison. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You completely surround a Large or smaller creature in immobile illusory walls, trapping it inside a false prison it can't escape. No other creatures see or feel these walls, and the target can't see anything outside of the illusory walls. 

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Phantom Prison](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/phantom-prison.json) | 3 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 minute; target 1 creature |


## P2-164 — Degree Outcome: Primal Chorus

**1 spells; 0 not enabled.** Suggested source-reading anchor: Primal Chorus. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Information / adjudication, Modifier / resistance

**Anchor wording:** For purposes of using Coerce during exploration mode, you can communicate with a creature that responds to your call for the duration of the spell.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Primal Chorus](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/primal-chorus.json) | 3 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration until your next daily preparations; target source/area/text |


## P2-165 — Degree Outcome: Shadow Blast

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shadow Blast. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Basic-save damage, Choice / casting variant

**Anchor wording:** Defense reflex|basic|options:area-effect or will|basic|options:area-effect (target's choice).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shadow Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/shadow-blast.json) | 5 | Enabled route | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-166 — Degree Outcome: Talking Corpse

**1 spells; 0 not enabled.** Suggested source-reading anchor: Talking Corpse. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Information / adjudication, Modifier / resistance

**Anchor wording:** Critical Failure As failure, but the target's answers are more direct and less repetitive, though still cryptic.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Talking Corpse](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/talking-corpse.json) | 4 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration 10 minutes; target 1 corpse |


## P2-167 — Degree Outcome: The Parrot's Whisper

**1 spells; 0 not enabled.** Suggested source-reading anchor: The Parrot's Whisper. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Information / adjudication, Modifier / resistance

**Anchor wording:** Success The parrot tells you the target's highest weakness at the start of your next turn.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [The Parrot's Whisper](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/the-parrots-whisper.json) | 2 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-168 — Degree Outcome: Tidal Surge

**1 spells; 0 not enabled.** Suggested source-reading anchor: Tidal Surge. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You call forth a tremendous wave to move the target either in a body of water or on the ground. You move the target up to 10 feet in any direction along the ground or 20 feet through a body of water. An unwilling target can attempt a Fortit

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Tidal Surge](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/tidal-surge.json) | 1 | Enabled route | — | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |


## P2-169 — Degree Outcome: Touch of Undeath

**1 spells; 0 not enabled.** Suggested source-reading anchor: Touch of Undeath. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure The target takes double damage, and vitality effects heal it only half as much as normal for 1 minute..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Touch of Undeath](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/touch-of-undeath.json) | 1 | Enabled route | — | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 living creature |


## P2-170 — Degree Outcome: Trickster's Twin

**1 spells; 0 not enabled.** Suggested source-reading anchor: Trickster's Twin. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider, Choice / casting variant, Information / adjudication

**Anchor wording:** Critical Failure As success, but the target must critically succeed at a Will save to disbelieve when one of the listed events occurs..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Trickster's Twin](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/tricksters-twin.json) | 4 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration 1 minute; target 1 creature |


## P2-171 — Degree Outcome: Undeath's Blessing

**1 spells; 0 not enabled.** Suggested source-reading anchor: Undeath's Blessing. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Modifier / resistance

**Anchor wording:** In addition, harm spells gain a +2 status bonus to the Hit Points restored to the target.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Undeath's Blessing](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/undeaths-blessing.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 minute; target 1 living creature touched |


## P2-172 — Degree Outcome: Verminous Lure

**1 spells; 0 not enabled.** Suggested source-reading anchor: Verminous Lure. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Information / adjudication

**Anchor wording:** Animals with imprecise sense can use their scent as a precise sense against the target..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Verminous Lure](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/verminous-lure.json) | 1 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration 10 minutes; target 1 creature or object |


## P2-173 — Degree Outcome: Warrior's Regret

**1 spells; 0 not enabled.** Suggested source-reading anchor: Warrior's Regret. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Turn trigger or boundary, Save-result condition rider

**Anchor wording:** Success At the end of its next turn, the target takes 1d8 damage per different creature it intentionally damaged on that turn (1d8 if it damaged one creature, 2d8 if it damaged two different creatures, and so on).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Warrior's Regret](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/warriors-regret.json) | 2 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-174 — Degree Outcome: Weapon Storm

**1 spells; 0 not enabled.** Suggested source-reading anchor: Weapon Storm. This is not a verified-test designation.

**Test contract:** All degrees including omitted-branch inheritance; independent/secondary saves; condition/damage timing and terminal outcomes.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure The target takes double damage and is subject to the weapon's critical specialization effect..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Weapon Storm](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/weapon-storm.json) | 4 | Enabled route | — | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |


## P2-175 — Native Effect: Mountain Resilience

**12 spells; 0 not enabled.** Suggested source-reading anchor: Mountain Resilience. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** It gains resistance 5 to physical damage, except adamantine.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mountain Resilience](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/mountain-resilience.json) | 4 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 20 minutes; target 1 creature |
| [Hidebound](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/hidebound.json) | 2 | Enabled route | 3 | 0.79 | no primary save; non-basic/no save; duration 1 round; target 1 creature |
| [Embrace the Pit](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/embrace-the-pit.json) | 3 | Enabled route | 3 | 0.44 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Untwisting Iron Pillar](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/untwisting-iron-pillar.json) | 9 | Enabled route | 3 | 0.39 | no primary save; non-basic/no save; duration 5 rounds; target source/area/text |
| [Embrace Nothingness](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/embrace-nothingness.json) | 9 | Partial Effect | 3 | 0.29 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Thermal Stasis](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/thermal-stasis.json) | 1 | Enabled route | 3 | 0.23 | no primary save; non-basic/no save; duration until the start of your next turn; target 1 creature |
| [Entwined Roots](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/entwined-roots.json) | 5 | Enabled route | 3 | 0.23 | no primary save; non-basic/no save; duration 10 minutes; target Up to 5 willing living creatures |
| [Phase Familiar](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/phase-familiar.json) | 1 | Enabled route | — | 0.20 | no primary save; non-basic/no save; duration outcome/text; target your familiar |
| [Rebounding Barrier](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/rebounding-barrier.json) | 4 | Enabled route | — | 0.19 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Energy Aegis](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/energy-aegis.json) | 7 | Enabled route | 3 | 0.18 | no primary save; non-basic/no save; duration until your next daily preparations; target 1 creature |
| [Rallying Anthem](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/rallying-anthem.json) | 2 | Enabled route | 3 | 0.17 | no primary save; non-basic/no save; duration 1 round; target source/area/text |
| [Primal Summons](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/primal-summons.json) | 6 | Enabled route | 4 | 0.16 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-176 — Native Effect: Tailwind

**12 spells; 0 not enabled.** Suggested source-reading anchor: Tailwind. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** You gain a +10-foot status bonus to your Speed..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Tailwind](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/tailwind.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |
| [Fleet Step](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/fleet-step.json) | 1 | Enabled route | 3, 4 | 0.83 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Warp Step](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/warp-step.json) | 1 | Enabled route | 3, 4 | 0.74 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Elemental Motion](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/elemental-motion.json) | 3 | Enabled route | 3, 4 | 0.56 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Athletic Rush](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/athletic-rush.json) | 1 | Enabled route | 3, 4 | 0.55 | no primary save; non-basic/no save; duration 1 round; target source/area/text |
| [Ghost Rush](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/ghost-rush.json) | 3 | Enabled route | 4 | 0.44 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Valiant Anthem](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/valiant-anthem.json) | 2 | Enabled route | 3, 4 | 0.41 | no primary save; non-basic/no save; duration 1 round; target source/area/text |
| [Triple Time](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/triple-time.json) | 2 | Enabled route | 3, 4 | 0.36 | no primary save; non-basic/no save; duration 1 round; target source/area/text |
| [Thicket of Knives](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/thicket-of-knives.json) | 1 | Enabled route | 3 | 0.36 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Cinder Gaze](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/cinder-gaze.json) | 1 | Enabled route | — | 0.26 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Claws of the Otter](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/claws-of-the-otter.json) | 2 | Partial Effect | 3 | 0.23 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |
| [Discern Lies](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/discern-lies.json) | 4 | Note only (resolved) | 3 | 0.22 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P2-177 — Native Effect: Energy Absorption

**11 spells; 0 not enabled.** Suggested source-reading anchor: Energy Absorption. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** You gain resistance 15 to your choice of acid, cold, electricity, or fire damage from the triggering effect.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Energy Absorption](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/energy-absorption.json) | 4 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Armor of Bones](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/armor-of-bones.json) | 3 | Enabled route | 3 | 0.33 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Glass Form](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/glass-form.json) | 4 | Partial Effect | 3 | 0.33 | no primary save; non-basic/no save; duration 10 minutes; target 1 willing creature |
| [Reflective Scales](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/reflective-scales.json) | 4 | Enabled route | 3, 4 | 0.30 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Flame Barrier](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/flame-barrier.json) | 4 | Enabled route | — | 0.29 | no primary save; non-basic/no save; duration outcome/text; target the creature that would take fire damage |
| [Resist Energy](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/resist-energy.json) | 2 | Enabled route | 3, 4 | 0.28 | no primary save; non-basic/no save; duration 10 minutes; target 1 creature |
| [Conjurer's Countermeasure](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/conjurers-countermeasure.json) | 3 | Partial Effect | 3 | 0.24 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |
| [Eat Fire](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/eat-fire.json) | 1 | Enabled route | 3 | 0.23 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |
| [Enduring Might](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/enduring-might.json) | 4 | Enabled route | — | 0.19 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Adaptive Ablation](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/adaptive-ablation.json) | 4 | Enabled route | 3 | 0.17 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Thermal Remedy](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/thermal-remedy.json) | 2 | Enabled route | 3, 4 | 0.15 | no primary save; non-basic/no save; duration 1 hour; target up to 1 gallon of non-magical liquid or up to 5 pounds of food |


## P2-178 — Native Effect: Muscle Barrier

**9 spells; 0 not enabled.** Suggested source-reading anchor: Muscle Barrier. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** The creature gains a +1 status bonus to Athletics checks until the spell ends.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Muscle Barrier](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/muscle-barrier.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 of your thralls |
| [Thundering Dominance](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/thundering-dominance.json) | 2 | Enabled route | 3 | 0.26 | no primary save; non-basic/no save; duration 1 minute; target your companion or eidolon |
| [Song of Strength](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/song-of-strength.json) | 1 | Enabled route | 3 | 0.25 | no primary save; non-basic/no save; duration 1 round; target source/area/text |
| [Spirit of the Beast](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/spirit-of-the-beast.json) | 2 | Enabled route | 3, 4 | 0.24 | no primary save; non-basic/no save; duration 1 minute; target your animal companion |
| [Clinging Shadows Stance](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/clinging-shadows-stance.json) | 4 | Enabled route | 3 | 0.24 | no primary save; non-basic/no save; duration until you leave the stance; target source/area/text |
| [Groom Companion](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/groom-companion.json) | 1 | Enabled route | 3 | 0.23 | no primary save; non-basic/no save; duration 8 hours; target your companion or eidolon |
| [Physical Boost](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/physical-boost.json) | 1 | Enabled route | 3 | 0.18 | no primary save; non-basic/no save; duration until the end of the target's next turn; target 1 living creature |
| [Protection](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/protection.json) | 1 | Enabled route | 3 | 0.17 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |
| [Blessing of Defiance](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/blessing-of-defiance.json) | 5 | Enabled route | 3, 4 | 0.16 | no primary save; non-basic/no save; duration 1 round; target varies |


## P2-179 — Native Effect: Runic Weapon

**8 spells; 0 not enabled.** Suggested source-reading anchor: Runic Weapon. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** The target becomes a +1 striking weapon , gaining a +1 item bonus to attack rolls and increasing the number of weapon damage dice to two..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Runic Weapon](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/runic-weapon.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 weapon that is unattended or wielded by a willing creature |
| [Shillelagh](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/shillelagh.json) | 1 | Enabled route | 3 | 0.85 | no primary save; non-basic/no save; duration 1 minute; target 1 club or staff you hold |
| [Runic Body](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/runic-body.json) | 1 | Enabled route | 3 | 0.58 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |
| [Gravity Weapon](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/gravity-weapon.json) | 1 | Enabled route | 3 | 0.27 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Kgalaserke's Axes](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/kgalaserkes-axes.json) | 2 | Enabled route | 3 | 0.17 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |
| [Artistic Flourish](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/artistic-flourish.json) | 4 | Note only (resolved) | 3 | 0.16 | no primary save; non-basic/no save; duration 10 minutes; target 1 item or work of art that fits entirely within the range |
| [Unbroken Panoply](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/unbroken-panoply.json) | 1 | Enabled route | 3 | 0.16 | no primary save; non-basic/no save; duration 1 hour; target 1 broken weapon that is unattended or held by a willing creature |
| [Mystic Armor](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/mystic-armor.json) | 1 | Enabled route | 3 | 0.16 | no primary save; non-basic/no save; duration until your next daily preparations; target source/area/text |


## P2-180 — Native Effect: Courageous Anthem

**6 spells; 0 not enabled.** Suggested source-reading anchor: Courageous Anthem. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** You and all allies in the area gain a +1 status bonus to attack rolls, damage rolls, and saves against fear effects..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Courageous Anthem](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/courageous-anthem.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 round; target source/area/text |
| [Anointed Ground](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/anointed-ground.json) | 3 | Enabled route | 3, 4 | 0.29 | no primary save; non-basic/no save; duration until the next time you make your daily preparations; target source/area/text |
| [Frenzied Revelry](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/frenzied-revelry.json) | 1 | Enabled route | 3 | 0.20 | no primary save; non-basic/no save; duration 1 minute; target you and allies in the area |
| [Diabolic Edict](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/diabolic-edict.json) | 1 | Enabled route | 3 | 0.19 | no primary save; non-basic/no save; duration 1 round; target 1 willing living creature |
| [Touch of the Moon](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/touch-of-the-moon.json) | 4 | Enabled route | 3 | 0.16 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |
| [Boost Eidolon](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/boost-eidolon.json) | 1 | Enabled route | 3 | 0.16 | no primary save; non-basic/no save; duration 1 round; target your eidolon |


## P2-181 — Native Effect: Gecko Grip

**6 spells; 0 not enabled.** Suggested source-reading anchor: Gecko Grip. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Granted movement speed

**Anchor wording:** The target gains a climb Speed equal to its Speed..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Gecko Grip](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/gecko-grip.json) | 2 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target 1 creature |
| [Traveler's Transit](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/travelers-transit.json) | 4 | Enabled route | 3, 4 | 0.40 | no primary save; non-basic/no save; duration 5 minutes; target source/area/text |
| [Fly](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/fly.json) | 4 | Enabled route | 3, 4 | 0.26 | no primary save; non-basic/no save; duration 5 minutes; target 1 creature |
| [Animal Feature](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/animal-feature.json) | 2 | Enabled route | 3, 4 | 0.22 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Angelic Wings](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/angelic-wings.json) | 3 | Enabled route | 3, 4 | 0.17 | no primary save; non-basic/no save; duration 3 rounds; target source/area/text |
| [Adapt Self](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/adapt-self.json) | 1 | Enabled route | 3, 4 | 0.17 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-182 — Native Effect: Inscrutable Mask

**5 spells; 0 not enabled.** Suggested source-reading anchor: Inscrutable Mask. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** The mask grants you a +1 status bonus to Deception checks to Lie or Feint, Intimidation checks to Demoralize, and Stealth checks to Hide in areas of dim light or darkness..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Inscrutable Mask](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/inscrutable-mask.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |
| [Penumbral Disguise](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/penumbral-disguise.json) | 2 | Note only (resolved) | 3 | 0.31 | no primary save; non-basic/no save; duration 10 minutes; target 1 willing creature |
| [Honeyed Words](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/honeyed-words.json) | 4 | Partial Effect | 3 | 0.20 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |
| [Face in the Crowd](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/face-in-the-crowd.json) | 1 | Partial Effect | 3 | 0.17 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Illusory Shroud](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/illusory-shroud.json) | 2 | Partial Effect | 3, 4 | 0.16 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |


## P2-183 — Native Effect: Beseech the Sphinx

**4 spells; 0 not enabled.** Suggested source-reading anchor: Beseech the Sphinx. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** Choose one skill and one type of saving throw (Fortitude, Reflex, or Will).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Beseech the Sphinx](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/beseech-the-sphinx.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target 1 creature other than yourself |
| [Soothing Words](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/soothing-words.json) | 1 | Partial Effect | 3, 4 | 0.19 | no primary save; non-basic/no save; duration 1 minute; target 1 ally |
| [Fortify Summoning](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/fortify-summoning.json) | 1 | Enabled route | — | 0.15 | no primary save; non-basic/no save; duration outcome/text; target 1 creature you summoned |
| [Heroism](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/heroism.json) | 3 | Enabled route | 3 | 0.15 | no primary save; non-basic/no save; duration 10 minutes; target 1 creature |


## P2-184 — Native Effect: Weapon Surge

**4 spells; 0 not enabled.** Suggested source-reading anchor: Weapon Surge. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** On your next Strike with that weapon before the start of your next turn, you gain a +1 status bonus to the attack roll and the weapon deals an additional 1d6 spirit damage, and the Strike gains the sanctified trait.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Weapon Surge](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/weapon-surge.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 weapon you're wielding |
| [Serrate](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/serrate.json) | 1 | Enabled route | 3 | 0.23 | no primary save; non-basic/no save; duration outcome/text; target 1 metal weapon |
| [Theogeny](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/theogeny.json) | 10 | Note only (resolved) | 3, 4 | 0.17 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Precious Gleam](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/precious-gleam.json) | 1 | Enabled route | 3 | 0.16 | no primary save; non-basic/no save; duration until the beginning of your next turn; target 1 weapon that is unattended or wielded by a willing creature. |


## P2-185 — Native Effect: Wild Winds Stance

**4 spells; 0 not enabled.** Suggested source-reading anchor: Wild Winds Stance. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** While in wild winds stance , you gain a +2 circumstance bonus to AC against ranged attacks..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wild Winds Stance](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/wild-winds-stance.json) | 4 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration until you leave the stance; target source/area/text |
| [Tempest Cloak](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/tempest-cloak.json) | 3 | Enabled route | 3 | 0.28 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |
| [Prismatic Shield](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/prismatic-shield.json) | 9 | Partial Effect | 3, 4 | 0.22 | no primary save; non-basic/no save; duration until the start of your next turn; target source/area/text |
| [Metal Merged](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/metal-merged.json) | 1 | Enabled route | 3 | 0.17 | no primary save; non-basic/no save; duration 1 minute; target 1 metal weapon you are wielding |


## P2-186 — Native Effect: Endure

**3 spells; 0 not enabled.** Suggested source-reading anchor: Endure. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You invigorate the touched creature's mind and urge it to press on. You grant the touched creature 5 temporary Hit Points that last for 1 minute.. Heightened (+1) The temporary Hit Points increase by 5.. Spell Effect: Endure.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Endure](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/endure.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |
| [False Vitality](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/false-vitality.json) | 2 | Enabled route | 3 | 0.30 | no primary save; non-basic/no save; duration 8 hours; target source/area/text |
| [Untwisting Iron Buffer](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/untwisting-iron-buffer.json) | 3 | Enabled route | — | 0.26 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-187 — Native Effect: Entreat Spirit

**3 spells; 0 not enabled.** Suggested source-reading anchor: Entreat Spirit. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** You gain a +1 status bonus to an Intelligence-, Wisdom-, or Charisma-based skill of your choice.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Entreat Spirit](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/entreat-spirit.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Sweet Dream](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/sweet-dream.json) | 1 | Enabled route | 3 | 0.26 | no primary save; non-basic/no save; duration 1 hour; target 1 willing creature |
| [Infectious Enthusiasm](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/infectious-enthusiasm.json) | 1 | Enabled route | 3 | 0.25 | no primary save; non-basic/no save; duration 1 round; target source/area/text |


## P2-188 — Native Effect: Reinforce Eidolon

**3 spells; 0 not enabled.** Suggested source-reading anchor: Reinforce Eidolon. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** Your eidolon gains a +1 status bonus to AC and saving throws, plus resistance 1 to all damage equal to half the spell's rank (minimum 1)..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Reinforce Eidolon](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/reinforce-eidolon.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 round; target your eidolon |
| [Evolution Surge](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/evolution-surge.json) | 1 | Enabled route | 3, 4 | 0.19 | no primary save; non-basic/no save; duration 1 minute; target your eidolon |
| [Arcane Countermeasure](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/arcane-countermeasure.json) | 5 | Enabled route | — | 0.17 | no primary save; non-basic/no save; duration outcome/text; target the spell cast by the triggering creature |


## P2-189 — Native Effect: Darkened Sight

**2 spells; 0 not enabled.** Suggested source-reading anchor: Darkened Sight. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You infuse a creature's vision with darkness. It receives greater darkvision, allowing it to see even in magical darkness.. Spell Effect: Darkened Sight.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Darkened Sight](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/darkened-sight.json) | 4 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |
| [Deep Sight](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/deep-sight.json) | 3 | Enabled route | 3 | 0.16 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P2-190 — Native Effect: Keen Smell

**2 spells; 0 not enabled.** Suggested source-reading anchor: Keen Smell. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication

**Anchor wording:** For the spell's duration, you gain scent as an imprecise sense with a range of 30 feet.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Keen Smell](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/keen-smell.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Tremorsense](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/tremorsense.json) | 2 | Enabled route | 3, 4 | 0.68 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P2-191 — Native Effect: Mantle of the Melting Heart

**2 spells; 0 not enabled.** Suggested source-reading anchor: Mantle of the Melting Heart. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Counteract, Modifier / resistance

**Anchor wording:** All electricity effects within 30 feet of you must succeed at a counteract check against your spell DC or target you and only you..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mantle of the Melting Heart](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/mantle-of-the-melting-heart.json) | 5 | Partial Effect | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Fireproof](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/fireproof.json) | 2 | Note only (resolved) | 3, 4 | 0.24 | no primary save; non-basic/no save; duration 1 hour; target 1 object up to 10 Bulk |


## P2-192 — Native Effect: Mimic Undead

**2 spells; 0 not enabled.** Suggested source-reading anchor: Mimic Undead. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication, Modifier / resistance

**Anchor wording:** Detection spells that specifically sense living creatures must succeed at a counteract check against mimic undead to detect you.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mimic Undead](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/mimic-undead.json) | 2 | Partial Effect | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |
| [Pulse of Civilization](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/pulse-of-civilization.json) | 4 | Note only (resolved) | 3, 4 | 0.17 | no primary save; non-basic/no save; duration 8 hours; target source/area/text |


## P2-193 — Native Effect: Nudge the Odds

**2 spells; 0 not enabled.** Suggested source-reading anchor: Nudge the Odds. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Save-result condition rider, Modifier / resistance

**Anchor wording:** You gain a +1 status bonus to Games Lore checks to gamble, and if you roll a critical failure on such a check, you get a failure instead; however, the spell is too short-lived to use for Earn Income checks from gambling..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Nudge the Odds](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/nudge-the-odds.json) | 1 | Partial Effect | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |
| [Pocket Library](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/pocket-library.json) | 1 | Enabled route | 3, 4 | 0.15 | no primary save; non-basic/no save; duration 24 hours; target source/area/text |


## P2-194 — Native Effect: Tempt Fate

**2 spells; 0 not enabled.** Suggested source-reading anchor: Tempt Fate. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Save-result condition rider, Modifier / resistance

**Anchor wording:** If it's a failure, it becomes a critical failure, and the critical failure can't be reduced by abilities that usually reduce critical failure..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Tempt Fate](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/tempt-fate.json) | 4 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target the triggering creature |
| [Prophet's Luck](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/prophets-luck.json) | 4 | Enabled route | 3 | 0.19 | no primary save; non-basic/no save; duration 10 minutes; target 1 creature |


## P2-195 — Native Effect: Vanishing Tracks

**2 spells; 0 not enabled.** Suggested source-reading anchor: Vanishing Tracks. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** The DC of checks to Track you gains a +4 status bonus or is equal to your spell DC, whichever results in a higher DC..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Vanishing Tracks](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/vanishing-tracks.json) | 1 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |
| [Erase Trail](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/erase-trail.json) | 2 | Note only (resolved) | — | 0.44 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-196 — Native Effect: Ant Haul

**1 spells; 0 not enabled.** Suggested source-reading anchor: Ant Haul. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You reinforce the target's musculoskeletal system to bear more weight. The target can carry 3 more Bulk than normal before becoming Encumbered and up to a maximum of 6 more Bulk.. Spell Effect: Ant Haul.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ant Haul](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/ant-haul.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 8 hours; target 1 creature |


## P2-197 — Native Effect: Battlefield Persistence

**1 spells; 0 not enabled.** Suggested source-reading anchor: Battlefield Persistence. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** You gain a +2 status bonus to the triggering save, and if the triggering save is against an incapacitation effect, it treats you as if you were 2 levels higher..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Battlefield Persistence](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/battlefield-persistence.json) | 3 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-198 — Native Effect: Bind Undead

**1 spells; 0 not enabled.** Suggested source-reading anchor: Bind Undead. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** With a word of power, you seize control of the target. It gains the minion trait. If you or an ally uses any hostile actions against the target, the spell ends.. Spell Effect: Bind Undead.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Bind Undead](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/bind-undead.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 day; target 1 mindless undead creature with a level no greater than bind undead's spell rank |


## P2-199 — Native Effect: Chameleon Coat

**1 spells; 0 not enabled.** Suggested source-reading anchor: Chameleon Coat. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Save-result condition rider, Modifier / resistance

**Anchor wording:** Heightened (6th) If a creature affected by this spell rolls a critical failure on its Stealth check to Sneak within 30 feet of a creature that would spot it, it instead only fails its check, as the spell mildly hypnotizes the spotter..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Chameleon Coat](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/chameleon-coat.json) | 5 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target up to 8 creatures |


## P2-200 — Native Effect: Community Restoration

**1 spells; 0 not enabled.** Suggested source-reading anchor: Community Restoration. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Choice / casting variant

**Anchor wording:** You gain 2 temporary Hit Points per rank of the triggering spell, and can grant an equal number divided as you choose among allies affected by the triggering spell.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Community Restoration](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/community-restoration.json) | 4 | Enabled route | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-201 — Native Effect: Conductive Weapon

**1 spells; 0 not enabled.** Suggested source-reading anchor: Conductive Weapon. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You channel powerful electric current through the metal of a weapon, zapping anyone the item hits. The target becomes a +1 shock weapon . If any target of an attack with the weapon is wearing metal armor or is primarily made of metal, the e

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Conductive Weapon](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/conductive-weapon.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 metal weapon that is unattended or is wielded by you or a willing ally |


## P2-202 — Native Effect: Countless Eyes

**1 spells; 0 not enabled.** Suggested source-reading anchor: Countless Eyes. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Eyes form across the touched creature's body, allowing it to see in all directions at once. The subject can't be flanked for the spell's duration. In addition, when the subject succeeds when Seeking, it critically succeeds instead.. Spell E

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Countless Eyes](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/countless-eyes.json) | 4 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |


## P2-203 — Native Effect: Divine Vessel

**1 spells; 0 not enabled.** Suggested source-reading anchor: Divine Vessel. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Choice / casting variant, Modifier / resistance

**Anchor wording:** Choose an alignment your deity has (chaotic, evil, good, or lawful).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Divine Vessel](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/divine-vessel.json) | 7 | Partial Effect | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-204 — Native Effect: Dragon Wings

**1 spells; 0 not enabled.** Suggested source-reading anchor: Dragon Wings. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Leathery wings sprout from your back, giving you a fly Speed of 60 feet or your Speed, whichever is faster. If you're still flying when this spell's duration would end, you float to the ground, as with the effects of Gentle Landing.. Height

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dragon Wings](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/dragon-wings.json) | 5 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-205 — Native Effect: Elemental Sheath

**1 spells; 0 not enabled.** Suggested source-reading anchor: Elemental Sheath. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Choice / casting variant, Modifier / resistance

**Anchor wording:** Choose air, earth, fire, metal, water, or wood; the spell gains that trait.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Elemental Sheath](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/elemental-sheath.json) | 4 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-206 — Native Effect: Elemental Tempest

**1 spells; 0 not enabled.** Suggested source-reading anchor: Elemental Tempest. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Choice / casting variant, Modifier / resistance

**Anchor wording:** Foes in the area take 1d6 damage per spell rank of the spell you just cast of the same damage type the spell deals (choose one if it deals multiple types).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Elemental Tempest](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/elemental-tempest.json) | 4 | Enabled route | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-207 — Native Effect: Elemental Zone

**1 spells; 0 not enabled.** Suggested source-reading anchor: Elemental Zone. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** Spells with the chosen elemental trait cast against creatures in the zone get a +2 status bonus to one damage type the spell deals based on the chosen trait: bludgeoning or electricity for air, bludgeoning for earth, fire for fire, electricity or slashing for metal, bludgeoning or cold for water, an

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Elemental Zone](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/elemental-zone.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-208 — Native Effect: Fey Disappearance

**1 spells; 0 not enabled.** Suggested source-reading anchor: Fey Disappearance. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You become Invisible and ignore natural difficult terrain (such as underbrush). Any hostile action you use ends this invisibility, but you still ignore natural difficult terrain.. Spell Effect: Fey Disappearance. Heightened (5th) If you use

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fey Disappearance](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/fey-disappearance.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P2-209 — Native Effect: Fire Shield

**1 spells; 0 not enabled.** Suggested source-reading anchor: Fire Shield. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** As long as the shield persists, its heat grants you cold resistance 5 and makes you immune to mild and severe environmental cold.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fire Shield](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/fire-shield.json) | 4 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-210 — Native Effect: Fishing Spot

**1 spells; 0 not enabled.** Suggested source-reading anchor: Fishing Spot. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** Musical trout +2 status bonus to Performance checks.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fishing Spot](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/fishing-spot.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-211 — Native Effect: Flaming Fusillade

**1 spells; 0 not enabled.** Suggested source-reading anchor: Flaming Fusillade. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** Heightened (9th) For the duration, you also gain a status bonus to damage dealt by ignition equal to flaming fusillade 's spell rank..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Flaming Fusillade](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/flaming-fusillade.json) | 6 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-212 — Native Effect: Fortissimo Composition

**1 spells; 0 not enabled.** Suggested source-reading anchor: Fortissimo Composition. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** Critical Success The status bonus from your composition increases to +3..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fortissimo Composition](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/fortissimo-composition.json) | 4 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-213 — Native Effect: Glimpse Weakness

**1 spells; 0 not enabled.** Suggested source-reading anchor: Glimpse Weakness. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** ou glimpse a loose scale, a seam in a foe's armor, or a similar weakness, aiding your allies in landing a precise hit.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Glimpse Weakness](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/glimpse-weakness.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |


## P2-214 — Native Effect: Hidden Mind

**1 spells; 0 not enabled.** Suggested source-reading anchor: Hidden Mind. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Counteract, Information / adjudication, Modifier / resistance

**Anchor wording:** Hidden mind attempts to counteract any detection, revelation, and scrying effects as if its spell rank were 1 higher than its actual rank.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Hidden Mind](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/hidden-mind.json) | 8 | Partial Effect | 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the next time you make your daily preparations; target 1 creature |


## P2-215 — Native Effect: Impeccable Flow

**1 spells; 0 not enabled.** Suggested source-reading anchor: Impeccable Flow. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Save-result condition rider, Modifier / resistance

**Anchor wording:** If you critically fail any check while under the effects of this spell, the bonus ends and you instead have a -1 status penalty to all checks for the remaining duration..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Impeccable Flow](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/impeccable-flow.json) | 2 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-216 — Native Effect: Infuse Vitality

**1 spells; 0 not enabled.** Suggested source-reading anchor: Infuse Vitality. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You empower attacks with vital energy. The number of targets is equal to the number of actions you spent casting this spell. Each target's unarmed and weapon Strikes deal an extra 1d4 vitality damage. (This damage typically damages only und

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Infuse Vitality](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/infuse-vitality.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 to 3 willing creatures |


## P2-217 — Native Effect: Iron Gut

**1 spells; 0 not enabled.** Suggested source-reading anchor: Iron Gut. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** It is very difficult for other creatures to notice that you are hiding an object in this way; passive observers can't possibly notice and you gain a +4 circumstance bonus to your Stealth checks to Conceal an Object unless the searcher specifically searches your mouth and stomach.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Iron Gut](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/iron-gut.json) | 2 | Partial Effect | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P2-218 — Native Effect: Knock

**1 spells; 0 not enabled.** Suggested source-reading anchor: Knock. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** Knock grants a +4 status bonus to any creature that tries to open the target door, lock, or container with an Athletics or a Thievery check.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Knock](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/knock.json) | 2 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 door, lock, or container |


## P2-219 — Native Effect: Lashunta's Life Bubble

**1 spells; 0 not enabled.** Suggested source-reading anchor: Lashunta's Life Bubble. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** The shell of air enables the target to breathe even underwater or in a vacuum, protects from severe cold and heat, and grants a +1 status bonus to the target's saves against inhaled dangers such as inhaled poisons and Toxic Cloud..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Lashunta's Life Bubble](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/lashuntas-life-bubble.json) | 5 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 8 hours; target 1 creature |


## P2-220 — Native Effect: Loremaster's Etude

**1 spells; 0 not enabled.** Suggested source-reading anchor: Loremaster's Etude. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication

**Anchor wording:** You call upon your muse's deep mysteries, granting the target a greater ability to think and recall information.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Loremaster's Etude](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/loremasters-etude.json) | 1 | Enabled route | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target you or the triggering ally |


## P2-221 — Native Effect: Magic Hide

**1 spells; 0 not enabled.** Suggested source-reading anchor: Magic Hide. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** our animal companion grows a thicker hide, matted fur, or a harder shell, granting it a +1 status bonus to AC..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Magic Hide](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/magic-hide.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target your animal companion |


## P2-222 — Native Effect: Magic Stone

**1 spells; 0 not enabled.** Suggested source-reading anchor: Magic Stone. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You pour vitality energy into ordinary stones, granting them temporary magical properties. You can target 1 non-magical stone or sling bullet for every action you use Casting this Spell. The stones must be unattended or carried by you or a 

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Magic Stone](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/magic-stone.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 to 3 non-magical stones or sling bullets |


## P2-223 — Native Effect: Nudge Fate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Nudge Fate. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Save-result condition rider, Modifier / resistance

**Anchor wording:** When the target fails an attack roll, skill check, or saving throw and a +1 status bonus would turn a critical failure into a failure, or failure into a success, you grant the target a +1 status bonus to the check retroactively, changing the outcome appropriately.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Nudge Fate](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/nudge-fate.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |


## P2-224 — Native Effect: Object Memory

**1 spells; 0 not enabled.** Suggested source-reading anchor: Object Memory. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** By touching an object, you draw forth the experience of those who created and used it. If you touch a weapon, your proficiency rank with that weapon temporarily increases to trained (if it is not already trained or better). If you touch a t

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Object Memory](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/object-memory.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 weapon or tool |


## P2-225 — Native Effect: Organsight

**1 spells; 0 not enabled.** Suggested source-reading anchor: Organsight. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** For the duration, you gain a +2 circumstance bonus on Medicine checks against the target that depend on its organs, but a -2 circumstance penalty on Medicine checks depending on seeing its skin..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Organsight](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/organsight.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 living or undead creature that has organs |


## P2-226 — Native Effect: Practice Makes Perfect

**1 spells; 0 not enabled.** Suggested source-reading anchor: Practice Makes Perfect. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** The target gains a +2 status bonus to the triggering check, or a +3 bonus if the target has master or better proficiency in the skill.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Practice Makes Perfect](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/practice-makes-perfect.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target the triggering creature |


## P2-227 — Native Effect: Precious Metals

**1 spells; 0 not enabled.** Suggested source-reading anchor: Precious Metals. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** For example, a steel sword transmuted to cold iron would deal additional damage to a creature with a weakness to cold iron.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Precious Metals](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/precious-metals.json) | 4 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 metal shield or weapon, 1 suit of metal armor, or up to 1 Bulk of metal material (such as coins or metal-tipped ammunition) |


## P2-228 — Native Effect: Read Aura

**1 spells; 0 not enabled.** Suggested source-reading anchor: Read Aura. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication, Modifier / resistance

**Anchor wording:** If the object is illusory, you detect this only if the effect's rank is lower than the rank of your read aura spell..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Read Aura](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/read-aura.json) | 1 | Enabled route | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 object |


## P2-229 — Native Effect: Read the Air

**1 spells; 0 not enabled.** Suggested source-reading anchor: Read the Air. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication, Modifier / resistance

**Anchor wording:** Your body language subconsciously changes to take advantage of this information and use it in your own interactions with those creatures..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Read the Air](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/read-the-air.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-230 — Native Effect: Reed Whistle

**1 spells; 0 not enabled.** Suggested source-reading anchor: Reed Whistle. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication, Modifier / resistance

**Anchor wording:** As a reaction, you can reduce the spell's remaining duration by 1 hour to Point Out a creature you detect as you sharply whistle through the reed.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Reed Whistle](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/reed-whistle.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour or until expended; target source/area/text |


## P2-231 — Native Effect: Revel in Retribution

**1 spells; 0 not enabled.** Suggested source-reading anchor: Revel in Retribution. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Turn trigger or boundary

**Anchor wording:** At the start of each of your subsequent turns when you regain your actions, you gain an additional reaction that can be used only to attempt a Reactive Strike..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Revel in Retribution](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/revel-in-retribution.json) | 6 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-232 — Native Effect: Rewrite Possibility

**1 spells; 0 not enabled.** Suggested source-reading anchor: Rewrite Possibility. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication, Modifier / resistance

**Anchor wording:** Due to the amount of information this spell requires you to process, you can't have more than one rewrite possibility spell in effect at a time.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Rewrite Possibility](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/rewrite-possibility.json) | 5 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |


## P2-233 — Native Effect: Root Reading

**1 spells; 0 not enabled.** Suggested source-reading anchor: Root Reading. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Turn trigger or boundary, Information / adjudication, Modifier / resistance

**Anchor wording:** You can immediately attempt to Seek an undetected creature, and you gain a +1 status bonus to this attempt and any of your other attempts to Seek Hidden or undetected creatures until the end of your next turn.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Root Reading](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/root-reading.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-234 — Native Effect: Scholarly Recollection

**1 spells; 0 not enabled.** Suggested source-reading anchor: Scholarly Recollection. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Trigger You attempt a Perception check to [[/act seek]], or you attempt a skill check to Recall Knowledge with a skill you're trained in.. Speaking a short prayer as you gather your thoughts, you're blessed to find yourself pointed in the r

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Scholarly Recollection](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/scholarly-recollection.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-235 — Native Effect: See the Unseen

**1 spells; 0 not enabled.** Suggested source-reading anchor: See the Unseen. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** Subtler clues also grant you a +2 status bonus to checks you make to disbelieve illusions..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [See the Unseen](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/see-the-unseen.json) | 2 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P2-236 — Native Effect: Show the Path

**1 spells; 0 not enabled.** Suggested source-reading anchor: Show the Path. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Turn trigger or boundary, Modifier / resistance

**Anchor wording:** The creature rolls a d20 at the start of each of its turns.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Show the Path](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/show-the-path.json) | 4 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |


## P2-237 — Native Effect: Speaking Sky

**1 spells; 0 not enabled.** Suggested source-reading anchor: Speaking Sky. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication

**Anchor wording:** You can precisely sense any motion within 60 feet through vibration and air movement..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Speaking Sky](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/speaking-sky.json) | 6 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 round; target source/area/text |


## P2-238 — Native Effect: Spirit Sense

**1 spells; 0 not enabled.** Suggested source-reading anchor: Spirit Sense. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication, Modifier / resistance

**Anchor wording:** ou open your mind to the metaphysical, enabling you to sense nearby spirits.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spirit Sense](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/spirit-sense.json) | 2 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P2-239 — Native Effect: Spiritual Attunement

**1 spells; 0 not enabled.** Suggested source-reading anchor: Spiritual Attunement. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Choice / casting variant, Modifier / resistance

**Anchor wording:** If you choose the Boneyard, the resistance is to vitality and void damage instead..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spiritual Attunement](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/spiritual-attunement.json) | 4 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-240 — Native Effect: Take Root

**1 spells; 0 not enabled.** Suggested source-reading anchor: Take Root. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** The targeted creature gains a +1 circumstance bonus to their Fortitude DC against attempts to Shove them and a +1 circumstance bonus to their Reflex DC against attempts to Disarm or Trip them.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Take Root](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/take-root.json) | 1 | Partial Effect | 3 | 1.00 | no primary save; non-basic/no save; duration 1 round; target 1 willing creature |


## P2-241 — Native Effect: Thunder Echo

**1 spells; 0 not enabled.** Suggested source-reading anchor: Thunder Echo. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** Hidden chambers, objects, and creatures within the area of the effect become easier to find as they spark with static electricity, causing all creatures to gain a +2 status bonus to Perception checks to locate them for the duration.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Thunder Echo](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/thunder-echo.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P2-242 — Native Effect: Time Sense

**1 spells; 0 not enabled.** Suggested source-reading anchor: Time Sense. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication, Modifier / resistance

**Anchor wording:** hen you Cast the Spell, you gain a perfect sense of time.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Time Sense](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/time-sense.json) | 1 | Enabled route | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-243 — Native Effect: Transcribe Conflict

**1 spells; 0 not enabled.** Suggested source-reading anchor: Transcribe Conflict. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Choice / casting variant, Information / adjudication, Modifier / resistance

**Anchor wording:** When you cast this spell, choose a type of foe in the fight you transcribed and attempt to Recall Knowledge about that foe using your spell DC-10 instead of your skill modifier in an appropriate skill to do so.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Transcribe Conflict](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/transcribe-conflict.json) | 3 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P2-244 — Native Effect: Uncover Device

**1 spells; 0 not enabled.** Suggested source-reading anchor: Uncover Device. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication, Modifier / resistance

**Anchor wording:** ou focus on the construction of the object, channeling electricity through it that allows you to get a sense of its shape and construction.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Uncover Device](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/uncover-device.json) | 2 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 metal trap or device |


## P2-245 — Native Effect: Untwisting Iron Augmentation

**1 spells; 0 not enabled.** Suggested source-reading anchor: Untwisting Iron Augmentation. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** our unarmed attacks are treated as cold iron and silver, they gain the earth trait, and they gain a +1 status bonus to damage rolls per damage die..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Untwisting Iron Augmentation](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/untwisting-iron-augmentation.json) | 7 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-246 — Native Effect: Waterproof

**1 spells; 0 not enabled.** Suggested source-reading anchor: Waterproof. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Modifier / resistance

**Anchor wording:** The hydrophobic properties of the spell also grant resistance 10 to acid and a +2 bonus to saves and DCs against damaging effects with the water or acid traits..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Waterproof](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/waterproof.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target 1 object up to 10 Bulk |


## P2-247 — Native Effect: Weapon Trance

**1 spells; 0 not enabled.** Suggested source-reading anchor: Weapon Trance. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Information / adjudication

**Anchor wording:** he serenity of violence fills your mind, giving you a heightened sense of knowing exactly where your weapons need to be.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Weapon Trance](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/weapon-trance.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-248 — Native Effect: Wind Whispers

**1 spells; 0 not enabled.** Suggested source-reading anchor: Wind Whispers. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Save-result condition rider, Choice / casting variant, Information / adjudication, Modifier / resistance

**Anchor wording:** Critical Failure The winds' gossip is misinterpreted and spreads information contradictory to the rumor you were attempting to spread.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wind Whispers](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/wind-whispers.json) | 4 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P2-249 — Native Effect: Wooden Fists

**1 spells; 0 not enabled.** Suggested source-reading anchor: Wooden Fists. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Your arms and hands swell with new growth, transforming into tree trunks twice as big as their current size. Your fists deal 1d6 bludgeoning damage, lose the nonlethal trait, and have reach.. Heightened (3rd) Your fists gain the magical tra

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wooden Fists](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/wooden-fists.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-250 — Native Effect: Zealous Conviction

**1 spells; 0 not enabled.** Suggested source-reading anchor: Zealous Conviction. This is not a verified-test designation.

**Test contract:** Effect choice and rank; native rule execution; unrelated overlap; configuration; ownership and expiry.

**Shared signals:** Turn trigger or boundary, Modifier / resistance

**Anchor wording:** If you tell a target to do something, it must comply with your request, though if it would normally find the task repugnant, it can attempt a Will save at the end of its turn each round due to the cognitive dissonance.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Zealous Conviction](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/zealous-conviction.json) | 6 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target up to 10 willing creatures |


## P2-251 — Persistent damage: Cutting Insult

**12 spells; 0 not enabled.** Suggested source-reading anchor: Cutting Insult. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Persistent damage

**Anchor wording:** Your target takes 4d6[mental] damage and 1 persistent bleed damage and must attempt a Will save..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cutting Insult](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/cutting-insult.json) | 2 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |
| [Grim Tendrils](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/grim-tendrils.json) | 1 | Enabled route | 3 | 0.51 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Ulcerous Canker](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/ulcerous-canker.json) | 1 | Enabled route | 3 | 0.48 | fortitude; non-basic/no save; duration outcome/text; target 1 living creature |
| [Glass Sand](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/glass-sand.json) | 3 | Enabled route | 3 | 0.44 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Bursting Bloom](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/bursting-bloom.json) | 4 | Enabled route | 3 | 0.40 | fortitude; non-basic/no save; duration 1 minute; target 1 creature |
| [Weight of the World](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/weight-of-the-world.json) | 5 | Enabled route | 3 | 0.38 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Beheading Buzz Saw](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/beheading-buzz-saw.json) | 7 | Enabled route | 3 | 0.36 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Calcium Rain](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/calcium-rain.json) | 5 | Enabled route | 3 | 0.34 | reflex; basic; duration outcome/text; target source/area/text |
| [Ignite Fireworks](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/ignite-fireworks.json) | 2 | Enabled route | 3 | 0.28 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Bone Spray](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/bone-spray.json) | 2 | Enabled route | 3 | 0.26 | reflex; basic; duration outcome/text; target source/area/text |
| [Divine Immolation](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/divine-immolation.json) | 5 | Enabled route | 3 | 0.25 | reflex; basic; duration outcome/text; target source/area/text |
| [Teeth to Terror](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/teeth-to-terror.json) | 2 | Enabled route | 3 | 0.24 | will; non-basic/no save; duration 1 minute; target 1 creature with teeth |


## P2-252 — Persistent damage: Whispers of the Void

**12 spells; 0 not enabled.** Suggested source-reading anchor: Whispers of the Void. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Persistent damage

**Anchor wording:** Success The creature takes (floor(@item.rank/2))d8[persistent,void] damage..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Whispers of the Void](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/whispers-of-the-void.json) | 4 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Enervation](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/enervation.json) | 4 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Caustic Blast](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/caustic-blast.json) | 1 | Enabled route | 3 | 0.30 | reflex; basic; duration outcome/text; target source/area/text |
| [Ancient Dust](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/ancient-dust.json) | 1 | Enabled route | 3 | 0.25 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Acid Grip](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/acid-grip.json) | 2 | Enabled route | 3 | 0.22 | reflex; basic; duration outcome/text; target 1 creature |
| [Blood Infusion](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/blood-infusion.json) | 1 | Enabled route | 3 | 0.22 | fortitude; non-basic/no save; duration 1 minute; target 1 of your thralls |
| [Armor of Thorn and Claw](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/armor-of-thorn-and-claw.json) | 1 | Enabled route | 3, 4 | 0.20 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Worm's Repast](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/worms-repast.json) | 2 | Enabled route | 3 | 0.19 | fortitude; non-basic/no save; duration see description; target 1 corporeal creature |
| [Puff of Poison](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/puff-of-poison.json) | 1 | Enabled route | 3 | 0.19 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Scouring Pulse](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/scouring-pulse.json) | 5 | Enabled route | 3 | 0.18 | reflex; basic; duration outcome/text; target source/area/text |
| [Phantom Pain](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/phantom-pain.json) | 1 | Enabled route | 3 | 0.18 | will; non-basic/no save; duration 1 minute; target 1 creature |
| [Reblooded](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/reblooded.json) | 3 | Enabled route | 3 | 0.17 | fortitude; non-basic/no save; duration 1 minute; target 1 undead creature |


## P2-253 — Persistent damage: Combustion

**7 spells; 0 not enabled.** Suggested source-reading anchor: Combustion. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Persistent damage

**Anchor wording:** The fire deals 4d8 fire damage and 2d6[persistent,fire] damage to the creature, which must attempt a Fortitude save..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Combustion](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/combustion.json) | 3 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Heat Metal](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/heat-metal.json) | 2 | Enabled route | 3 | 0.43 | reflex; non-basic/no save; duration outcome/text; target 1 metal item or metal creature |
| [Blistering Invective](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/blistering-invective.json) | 2 | Enabled route | 3 | 0.23 | will; non-basic/no save; duration outcome/text; target 1 creature |
| [Savor the Sting](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/savor-the-sting.json) | 1 | Enabled route | 3 | 0.22 | will; non-basic/no save; duration outcome/text; target 1 creature |
| [Vengeful Glare](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/vengeful-glare.json) | 1 | Enabled route | 3 | 0.18 | fortitude; basic; duration outcome/text; target one creature you can see |
| [Unblinking Flame Emblem](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/unblinking-flame-emblem.json) | 7 | Enabled route | 3, 4 | 0.15 | no primary save; non-basic/no save; duration 3 rounds; target 1 creature |
| [Blood Runs Cold](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/blood-runs-cold.json) | 2 | Enabled route | 3 | 0.15 | fortitude; non-basic/no save; duration varies; target 1 creature |


## P2-254 — Persistent damage: Bloodspray Curse

**5 spells; 0 not enabled.** Suggested source-reading anchor: Bloodspray Curse. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Persistent damage

**Anchor wording:** Heightened (+2) The additional damage increases by 1d6, and the persistent bleed damage increases by 1d6..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Bloodspray Curse](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/bloodspray-curse.json) | 4 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration varies; target 1 creature |
| [Flourishing Flora](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/flourishing-flora.json) | 1 | Enabled route | 3 | 0.38 | reflex; basic; duration outcome/text; target source/area/text |
| [Mutilate](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/mutilate.json) | 4 | Enabled route | 3, 4 | 0.23 | fortitude; basic; duration outcome/text; target 1 creature in line of sight |
| [Expunge Blood](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/expunge-blood.json) | 6 | Enabled route | 3 | 0.20 | fortitude; non-basic/no save; duration varies; target 1 creature |
| [Blood Vendetta](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/blood-vendetta.json) | 2 | Enabled route | 3 | 0.16 | will; non-basic/no save; duration varies; target The triggering creature |


## P2-255 — Persistent damage: Entropic Wheel

**2 spells; 0 not enabled.** Suggested source-reading anchor: Entropic Wheel. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Persistent damage

**Anchor wording:** This applies only to the initial damage of the spell, not to any persistent damage or ongoing effects..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Entropic Wheel](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/entropic-wheel.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Scintillating Safeguard](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/scintillating-safeguard.json) | 6 | Enabled route | 3, 4 | 0.28 | no primary save; non-basic/no save; duration outcome/text; target up to 5 willing creatures who would be harmed by the triggering effect |


## P2-256 — Persistent damage: Noxious Metals

**2 spells; 0 not enabled.** Suggested source-reading anchor: Noxious Metals. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Save-result condition rider, Persistent damage

**Anchor wording:** Success The creature takes 1[persistent,poison] damage and is Sickened 1 as long as it takes this persistent damage..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Noxious Metals](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/noxious-metals.json) | 3 | Enabled route | 3 | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |
| [Fungal Infestation](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/fungal-infestation.json) | 2 | Enabled route | 3 | 0.22 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |


## P2-257 — Persistent damage: Achaekek's Clutch

**1 spells; 0 not enabled.** Suggested source-reading anchor: Achaekek's Clutch. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Save-result condition rider, Persistent damage

**Anchor wording:** For 1 minute, the first time per round that the target gains Persistent Bleed Damage, they immediately take that amount of slashing damage as the mantis claws grow off the symbol and rake them..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Achaekek's Clutch](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/achaekeks-clutch.json) | 4 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-258 — Persistent damage: Crucible of Iron

**1 spells; 0 not enabled.** Suggested source-reading anchor: Crucible of Iron. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Save-result condition rider, Persistent damage, Native condition

**Anchor wording:** Success The target's head is encased in iron, causing them to be Dazzled for 1 round and take 1d10 persistent fire damage..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Crucible of Iron](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/crucible-of-iron.json) | 5 | Enabled route | 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target 1 creature |


## P2-259 — Persistent damage: Dehydrate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Dehydrate. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Basic-save damage, Persistent damage, Native condition

**Anchor wording:** All creatures in the area take 1d6 persistent fire damage with a basic Fortitude save; creatures with the water or plant traits get a result one degree of success worse than they rolled.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dehydrate](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/dehydrate.json) | 1 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |


## P2-260 — Persistent damage: Feral Shades

**1 spells; 0 not enabled.** Suggested source-reading anchor: Feral Shades. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Basic-save damage, Persistent damage, Native condition, Modifier / resistance

**Anchor wording:** The shades set upon the vulnerable with greater ferocity: Prone creatures or those taking persistent bleed damage take a –2 status penalty to the save..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Feral Shades](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/feral-shades.json) | 2 | Enabled route | 3 | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |


## P2-261 — Persistent damage: Flame Dancer

**1 spells; 0 not enabled.** Suggested source-reading anchor: Flame Dancer. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Persistent damage, Native condition

**Anchor wording:** Critical hits with these Strikes also deal 2d4 persistent fire damage.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Flame Dancer](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/flame-dancer.json) | 5 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |


## P2-262 — Persistent damage: Forced Mercy

**1 spells; 0 not enabled.** Suggested source-reading anchor: Forced Mercy. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Save-result condition rider, Persistent damage, Modifier / resistance

**Anchor wording:** All physical damage dealt by the target to living creatures becomes nonlethal and all persistent bleed damage dealt by the target is reduced to 0.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Forced Mercy](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/forced-mercy.json) | 1 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P2-263 — Persistent damage: Implement of Destruction

**1 spells; 0 not enabled.** Suggested source-reading anchor: Implement of Destruction. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Save-result condition rider, Persistent damage, Native condition, Information / adjudication

**Anchor wording:** Failure The target weapon deals an additional 2d6[persistent,mental] damage to the target enemy.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Implement of Destruction](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/implement-of-destruction.json) | 4 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration 1 minute; target 1 enemy, and 1 weapon that is either unattended or wielded by you or a willing ally |


## P2-264 — Persistent damage: Moon Frenzy

**1 spells; 0 not enabled.** Suggested source-reading anchor: Moon Frenzy. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Persistent damage, Modifier / resistance

**Anchor wording:** On a critical hit with one of these unarmed attacks, the creature struck takes 1d4 persistent bleed damage..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Moon Frenzy](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/moon-frenzy.json) | 5 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target up to 5 willing creatures |


## P2-265 — Persistent damage: Pyroclastic Truth

**1 spells; 0 not enabled.** Suggested source-reading anchor: Pyroclastic Truth. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Persistent damage, Native condition, Information / adjudication

**Anchor wording:** When you Fuel Pyroclastic Truth, all creatures marked by fire take (@item.level)d12[persistent,fire] damage..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Pyroclastic Truth](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/pyroclastic-truth.json) | 1 | Enabled route | 3, 4 | 1.00 | reflex; basic; duration 1 minute; target source/area/text |


## P2-266 — Persistent damage: Rusting Grasp

**1 spells; 0 not enabled.** Suggested source-reading anchor: Rusting Grasp. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Basic-save damage, Persistent damage

**Anchor wording:** If the spell causes persistent damage from rust, a creature can attempt to scrape off the rust to assist the target in recovering from the persistent damage (reducing the DC of the flat check to end persistent damage to 10 and granting an immediate flat check).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Rusting Grasp](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/rusting-grasp.json) | 4 | Enabled route | 3 | 1.00 | fortitude; basic; duration outcome/text; target 1 metal creature, 1 non-magical metal hazard, or 1 non-magical metal item of up to 1 Bulk |


## P2-267 — Persistent damage: Spellwrack

**1 spells; 0 not enabled.** Suggested source-reading anchor: Spellwrack. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Save-result condition rider, Persistent damage

**Anchor wording:** Success Whenever the target becomes affected by a spell with a duration, the target takes 2d12[persistent,force] damage.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spellwrack](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/spellwrack.json) | 6 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P2-268 — Persistent damage: Untamed Shift

**1 spells; 0 not enabled.** Suggested source-reading anchor: Untamed Shift. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Persistent damage, Granted movement speed, Choice / casting variant, Modifier / resistance

**Anchor wording:** Untamed claws leave terrible, ragged wounds that also deal 2d6 persistent bleed damage on a hit, and untamed jaws are envenomed, also dealing 2d6 persistent poison damage on a hit..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Untamed Shift](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/untamed-shift.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P2-269 — Persistent damage: Wronged Monk's Wrath

**1 spells; 0 not enabled.** Suggested source-reading anchor: Wronged Monk's Wrath. This is not a verified-test designation.

**Test contract:** Initial damage versus later ticks; recovery DC; type/stacking; no future ticks in immediate damage totals.

**Shared signals:** Save-result condition rider, Basic-save damage, Persistent damage, Native condition

**Anchor wording:** Each creature attempts one basic Reflex save that applies to both types of damage On a failed save, the creature is Deafened for 1 round; on a critical failure, the creature also takes 2d12[persistent,electricity] damage and is deafened for 1 minute..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wronged Monk's Wrath](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/wronged-monks-wrath.json) | 5 | Enabled route | 3 | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P2-270 — Temporary immunity: Deafness

**12 spells; 0 not enabled.** Suggested source-reading anchor: Deafness. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Temporary immunity

**Anchor wording:** The target is then temporarily immune for 1 minute..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Deafness](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/deafness.json) | 2 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Blindness](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/blindness.json) | 3 | Enabled route | 3 | 0.65 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Aberrant Whispers](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/aberrant-whispers.json) | 3 | Enabled route | 3 | 0.54 | will; non-basic/no save; duration 1 round; target each foe in the area |
| [Contagious Idea](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/contagious-idea.json) | 5 | Enabled route | 3, 4 | 0.39 | no primary save; non-basic/no save; duration outcome/text; target 1 or 2 creatures other than yourself (see text) |
| [Warp Mind](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/warp-mind.json) | 7 | Enabled route | 3, 4 | 0.34 | will; non-basic/no save; duration outcome/text; target 1 creature |
| [Touch of Obedience](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/touch-of-obedience.json) | 1 | Enabled route | 3 | 0.31 | will; non-basic/no save; duration varies; target 1 living creature |
| [Pack Breaker](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/pack-breaker.json) | 5 | Enabled route | 3 | 0.30 | will; non-basic/no save; duration 1 minute; target 1 creature |
| [Gleaming Pet](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/gleaming-pet.json) | 3 | Enabled route | 3 | 0.30 | fortitude; non-basic/no save; duration 1 minute; target your companion or eidolon |
| [Power Word Stun](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/power-word-stun.json) | 8 | Enabled route | 3 | 0.29 | no primary save; non-basic/no save; duration varies; target 1 creature |
| [Celestial Brand](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/celestial-brand.json) | 5 | Enabled route | 3, 4 | 0.29 | no primary save; non-basic/no save; duration 1 round; target 1 unholy creature |
| [Steal Voice](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/steal-voice.json) | 4 | Enabled route | 3 | 0.27 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Tame](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/tame.json) | 1 | Enabled route | 3 | 0.27 | will; non-basic/no save; duration 1 minute; target 1 non-hostile domesticated animal |


## P2-271 — Temporary immunity: Shadow Projectile

**7 spells; 0 not enabled.** Suggested source-reading anchor: Shadow Projectile. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Temporary immunity

**Anchor wording:** Regardless of the result of its save, it's temporarily immune to shadow projectile for 1 hour..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shadow Projectile](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/shadow-projectile.json) | 3 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration outcome/text; target source/area/text |
| [Lose the Path](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/lose-the-path.json) | 1 | Enabled route | 3 | 0.26 | will; non-basic/no save; duration outcome/text; target the triggering creature |
| [Repel Metal](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/repel-metal.json) | 4 | Enabled route | 3 | 0.23 | no primary save; non-basic/no save; duration outcome/text; target the creature targeted by the triggering Strike |
| [Commanding Lash](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/commanding-lash.json) | 4 | Enabled route | 3 | 0.19 | will; non-basic/no save; duration until the end of your target's next turn; target A creature you dealt damage to on your most recent action. |
| [Chromatic Armor](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/chromatic-armor.json) | 4 | Enabled route | 3 | 0.19 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |
| [Over the Coals](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/over-the-coals.json) | 5 | Enabled route | 3 | 0.18 | will; non-basic/no save; duration varies; target 1 creature |
| [Grisly Growths](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/grisly-growths.json) | 5 | Enabled route | 3 | 0.17 | fortitude; basic; duration outcome/text; target 1 corporeal creature |


## P2-272 — Temporary immunity: Subjugate Undead

**7 spells; 0 not enabled.** Suggested source-reading anchor: Subjugate Undead. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Temporary immunity

**Anchor wording:** Critical Success The target is unaffected and is temporarily immune for 24 hours..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Subjugate Undead](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/subjugate-undead.json) | 3 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration varies; target one undead creature with a level of no more than your level -4 |
| [Forced Quiet](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/forced-quiet.json) | 1 | Enabled route | 3 | 0.48 | fortitude; non-basic/no save; duration varies; target 1 creature |
| [Shadow Zombie](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/shadow-zombie.json) | 2 | Enabled route | 3, 4 | 0.34 | will; non-basic/no save; duration varies; target 1 zombie of level 1 or lower |
| [Compel True Name](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/compel-true-name.json) | 4 | Enabled route | 3 | 0.33 | will; non-basic/no save; duration varies; target 1 creature whose true name you know |
| [Delusional Pride](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/delusional-pride.json) | 4 | Enabled route | 3 | 0.22 | will; non-basic/no save; duration varies; target 1 creature |
| [Bit of Luck](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/bit-of-luck.json) | 1 | Enabled route | 3 | 0.18 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |
| [Telepathic Demand](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/telepathic-demand.json) | 9 | Enabled route | 3, 4 | 0.17 | will; non-basic/no save; duration varies; target 1 creature you've telepathically contacted before |


## P2-273 — Temporary immunity: Sure Strike

**3 spells; 0 not enabled.** Suggested source-reading anchor: Sure Strike. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Temporary immunity

**Anchor wording:** You are then temporarily immune to sure strike for 10 minutes..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sure Strike](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/sure-strike.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration until the end of your turn; target source/area/text |
| [Lucky Number](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/lucky-number.json) | 2 | Enabled route | 3 | 0.22 | no primary save; non-basic/no save; duration until the next time you make your daily preparations; target source/area/text |
| [Vision of Weakness](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/vision-of-weakness.json) | 2 | Enabled route | 3, 4 | 0.17 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P2-274 — Temporary immunity: Anathematic Reprisal

**2 spells; 0 not enabled.** Suggested source-reading anchor: Anathematic Reprisal. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Temporary immunity, Basic-save damage

**Anchor wording:** The creature is then temporarily immune for 1 minute..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Anathematic Reprisal](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/anathematic-reprisal.json) | 4 | Enabled route | 3 | 1.00 | will; basic; duration outcome/text; target the triggering creature |
| [Forbidden Thought](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/forbidden-thought.json) | 1 | Enabled route | 3 | 0.22 | will; basic; duration outcome/text; target 1 creature |


## P2-275 — Temporary immunity: Fear the Sun

**2 spells; 0 not enabled.** Suggested source-reading anchor: Fear the Sun. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Turn trigger or boundary, Temporary immunity, Save-result condition rider, Native condition

**Anchor wording:** The creature is then temporarily immune for 1 minute..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fear the Sun](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/fear-the-sun.json) | 2 | Enabled route | 3 | 1.00 | fortitude; non-basic/no save; duration varies; target 1 creature |
| [Mask of Terror](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/mask-of-terror.json) | 7 | Enabled route | 3 | 0.16 | will; non-basic/no save; duration 1 minute; target 1 creature |


## P2-276 — Temporary immunity: Cloak of Colors

**1 spells; 0 not enabled.** Suggested source-reading anchor: Cloak of Colors. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Turn trigger or boundary, Temporary immunity, Save-result condition rider, Native condition

**Anchor wording:** The creature is then temporarily immune until the end of its turn; this effect has the incapacitation trait..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cloak of Colors](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/cloak-of-colors.json) | 5 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |


## P2-277 — Temporary immunity: Nightmare

**1 spells; 0 not enabled.** Suggested source-reading anchor: Nightmare. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Temporary immunity, Save-result condition rider, Native condition, Modifier / resistance

**Anchor wording:** Critical Success The target suffers no adverse effects and is temporarily immune for 1 week..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Nightmare](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/nightmare.json) | 4 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration 1 day; target 1 creature you know by name |


## P2-278 — Temporary immunity: Overwhelming Presence

**1 spells; 0 not enabled.** Suggested source-reading anchor: Overwhelming Presence. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Temporary immunity, Save-result condition rider, Native condition

**Anchor wording:** Regardless of the outcome, the target is then temporarily immune for 1 minute..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Overwhelming Presence](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/overwhelming-presence.json) | 9 | Enabled route | 3 | 1.00 | will; non-basic/no save; duration until full tribute is paid; target any number of creatures |


## P2-279 — Temporary immunity: Power Word Blind

**1 spells; 0 not enabled.** Suggested source-reading anchor: Power Word Blind. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Temporary immunity, Native condition

**Anchor wording:** Once targeted, the target is then temporarily immune for 10 minutes.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Power Word Blind](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/power-word-blind.json) | 7 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration varies; target 1 creature |


## P2-280 — Temporary immunity: Rousing Splash

**1 spells; 0 not enabled.** Suggested source-reading anchor: Rousing Splash. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Temporary immunity, Persistent damage

**Anchor wording:** The target is then temporarily immune to the temporary Hit Points from rousing splash for 10 minutes.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Rousing Splash](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/rousing-splash.json) | 1 | Partial Effect | 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P2-281 — Temporary immunity: Shift Blame

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shift Blame. This is not a verified-test designation.

**Test contract:** Who is immune to what; degree trigger; duration; repeated casts; expiry and source identity.

**Shared signals:** Temporary immunity, Choice / casting variant, Information / adjudication

**Anchor wording:** The target must attempt a Will save and is then temporarily immune for 24 hours..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shift Blame](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/shift-blame.json) | 3 | Enabled route | 3, 4 | 1.00 | will; non-basic/no save; duration outcome/text; target the target of the triggering attack or skill check |


## Cross-phase dependency list

These spells are owned by another primary worklist; reuse their listed batch instead of implementing them twice.

| Spell | Primary phase / batch | Matched signals |
| --- | --- | --- |
| Competitive Edge | P3 / P3-001 | Modifier / resistance |
| Girzanje's March | P3 / P3-001 | Modifier / resistance |
| Radiant Heart of Devotion | P3 / P3-001 | Native condition, Modifier / resistance |
| Stoke the Heart | P3 / P3-001 | Modifier / resistance |
| Veil of Dreams | P3 / P3-001 | Modifier / resistance |
| Cycle of Retribution | P3 / P3-002 | Save-result condition rider |
| Hot Air | P3 / P3-002 | Basic-save damage |
| Needle of Vengeance | P3 / P3-002 | Basic-save damage |
| Blood Ward | P3 / P3-003 | Modifier / resistance |
| Forbidding Ward | P3 / P3-003 | Modifier / resistance |
| Spirit Ward | P3 / P3-003 | Modifier / resistance |
| Dirge of Remembrance | P3 / P3-004 | Save-result condition rider |
| Unexpected Windfall | P3 / P3-004 | Save-result condition rider, Native condition |
| Wilding Word | P3 / P3-004 | Save-result condition rider, Native condition, Modifier / resistance |
| Captivating Adoration | P3 / P3-005 | Aura membership, Area exposure, Temporary immunity, Save-result condition rider, Native condition |
| Nymph's Grace | P3 / P3-005 | Aura membership, Area exposure, Native condition |
| Radiant Globe | P3 / P3-005 | Save-result condition rider, Native condition |
| Buzzing Bites | P3 / P3-006 | Temporary immunity, Save-result condition rider, Native condition |
| Clinging Ice | P3 / P3-006 | Save-result condition rider, Modifier / resistance |
| Dawnflower's Light | P3 / P3-007 | Modifier / resistance |
| Light of Revelation | P3 / P3-007 | Aura membership, Information / adjudication, Modifier / resistance |
| Evil Eye | P3 / P3-008 | Save-result condition rider, Native condition |
| Information Overload | P3 / P3-008 | Save-result condition rider, Native condition, Information / adjudication |
| Ghostly Shift | P3 / P3-009 | Modifier / resistance |
| Protector's Sphere | P3 / P3-009 | Aura membership, Modifier / resistance |
| Laughing Fit | P3 / P3-010 | Save-result condition rider, Native condition |
| Roaring Applause | P3 / P3-010 | Turn trigger or boundary, Save-result condition rider, Native condition |
| Frost Pillar | P3 / P3-011 | Native condition, Modifier / resistance |
| Lifewood Cage | P3 / P3-011 | Modifier / resistance |
| Sting of the Sea | P3 / P3-012 | Turn trigger or boundary, Save-result condition rider, Native condition |
| Tomorrow's Dawn | P3 / P3-012 | Turn trigger or boundary, Save-result condition rider, Native condition, Modifier / resistance |
| Angelic Halo | P3 / P3-013 | Aura membership, Healing / recipient mode, Modifier / resistance |
| Burrow Ward | P3 / P3-015 |  |
| Calm | P3 / P3-016 | Save-result condition rider, Modifier / resistance |
| Carrion Mire | P3 / P3-017 | Native condition, Healing / recipient mode, Counteract |
| Cloak of Light | P3 / P3-019 | Basic-save damage, Healing / recipient mode |
| Discomfiting Whispers | P3 / P3-025 | Aura membership, Area exposure |
| Elemental Betrayal | P3 / P3-027 | Choice / casting variant, Modifier / resistance |
| Embodiment of Battle | P3 / P3-028 | Attack and dependent result, Modifier / resistance |
| Fallow Field | P3 / P3-029 | Temporary immunity, Save-result condition rider, Healing / recipient mode |
| Fateful Condemnation | P3 / P3-030 | Aura membership, Save-result condition rider, Native condition, Modifier / resistance |
| Foresee the Path | P3 / P3-031 | Temporary immunity, Attack and dependent result, Modifier / resistance |
| Glimmer of Charm | P3 / P3-033 | Aura membership, Area exposure, Temporary immunity, Save-result condition rider |
| Hedge Prison | P3 / P3-036 | Save-result condition rider |
| Incendiary Aura | P3 / P3-038 | Aura membership, Persistent damage |
| Manifest Will | P3 / P3-041 | Aura membership, Modifier / resistance |
| Osseous Cage | P3 / P3-042 | Native condition |
| Pact Broker | P3 / P3-044 | Temporary immunity, Save-result condition rider, Modifier / resistance |
| Rainbow's End | P3 / P3-048 | Basic-save damage, Native condition |
| Safe Passage | P3 / P3-051 | Native condition, Modifier / resistance |
| Scrying | P3 / P3-052 | Temporary immunity, Save-result condition rider, Choice / casting variant |
| Shroud of Night | P3 / P3-054 |  |
| Silence | P3 / P3-055 | Aura membership |
| Song of the Fallen | P3 / P3-057 | Save-result condition rider, Basic-save damage, Native condition |
| Spiral of Horrors | P3 / P3-059 | Aura membership, Native condition |
| Stumbling Curse | P3 / P3-062 | Save-result condition rider, Modifier / resistance |
| Suffocate | P3 / P3-063 | Save-result condition rider |
| Tireless Worker | P3 / P3-066 | Native condition |
| Unblinking Flame Ignition | P3 / P3-067 | Aura membership, Area exposure, Granted movement speed, Native condition |
| Unravel Knowledge | P3 / P3-068 | Save-result condition rider, Choice / casting variant, Modifier / resistance |
| Voracious Gestalt | P3 / P3-070 | Aura membership, Turn trigger or boundary, Area exposure, Basic-save damage |
| Life's Fresh Bloom | P3 / P3-071 | Turn trigger or boundary, Area exposure, Granted movement speed, Native condition, Modifier / resistance |
| Petal Storm | P3 / P3-071 | Area exposure, Basic-save damage |
| Rust Cloud | P3 / P3-071 | Area exposure, Basic-save damage, Persistent damage |
| Sepulchral Mask | P3 / P3-071 | Area exposure, Save-result condition rider, Modifier / resistance |
| Toxic Cloud | P3 / P3-071 | Area exposure, Ending or dismissal |
| Tree of Life and Death | P3 / P3-071 | Area exposure, Basic-save damage, Healing / recipient mode |
| Ash Cloud | P3 / P3-072 | Area exposure, Save-result condition rider, Native condition, Information / adjudication |
| Incendiary Fog | P3 / P3-072 | Area exposure, Basic-save damage |
| Ring of Truth | P3 / P3-072 | Area exposure, Modifier / resistance |
| Stinking Cloud | P3 / P3-072 | Area exposure, Save-result condition rider, Native condition |
| Asterism | P3 / P3-073 | Area exposure, Ending or dismissal, Basic-save damage |
| Astral Rain | P3 / P3-073 | Turn trigger or boundary, Area exposure, Basic-save damage |
| Spout | P3 / P3-073 | Turn trigger or boundary, Area exposure, Save-result condition rider, Basic-save damage, Native condition |
| Ravenous Darkness | P3 / P3-074 | Area exposure, Ending or dismissal, Attack and dependent result, Modifier / resistance |
| Slither | P3 / P3-074 | Area exposure, Ending or dismissal, Save-result condition rider, Persistent damage, Native condition |
| Fire Ray | P3 / P3-075 | Area exposure, Save-result condition rider, Attack and dependent result |
| Murmuration | P3 / P3-075 | Area exposure, Save-result condition rider, Modifier / resistance |
| Rend Magic | P3 / P3-075 | Area exposure, Attack and dependent result |
| Blanket of Stars | P3 / P3-076 | Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Modifier / resistance |
| Bralani Referendum | P3 / P3-076 | Area exposure, Ending or dismissal, Basic-save damage, Native condition, Choice / casting variant |
| Shadow Army | P3 / P3-076 | Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Choice / casting variant |
| Corpse Bloom | P3 / P3-077 | Area exposure, Save-result condition rider, Native condition |
| Pollen Pods | P3 / P3-077 | Area exposure, Save-result condition rider, Native condition |
| Darklight | P3 / P3-079 | Area exposure, Basic-save damage |
| Falling Stars | P3 / P3-080 | Area exposure, Basic-save damage |
| Shadow Raid | P3 / P3-080 | Area exposure, Basic-save damage, Choice / casting variant |
| The Queen's Rainbow | P3 / P3-082 | Area exposure, Save-result condition rider, Native condition |
| Unbounded Sphere | P3 / P3-082 | Area exposure, Save-result condition rider |
| Call to Arms | P3 / P3-085 | Area exposure, Modifier / resistance |
| Circle of Protection | P3 / P3-086 | Area exposure, Modifier / resistance |
| Croak Voice | P3 / P3-087 | Area exposure, Save-result condition rider |
| Deluge | P3 / P3-088 | Area exposure, Native condition |
| Disintegrating Puddle | P3 / P3-091 | Area exposure, Attack and dependent result |
| Downpour | P3 / P3-094 | Area exposure, Modifier / resistance |
| Elysian Whimsy | P3 / P3-096 | Area exposure, Save-result condition rider, Modifier / resistance |
| Fire Seeds | P3 / P3-098 | Area exposure, Ending or dismissal |
| Font of Serenity | P3 / P3-099 | Area exposure, Temporary immunity, Counteract, Modifier / resistance |
| Foul Miasma | P3 / P3-100 | Area exposure, Save-result condition rider |
| Freezing Touch | P3 / P3-101 | Area exposure, Save-result condition rider, Persistent damage, Native condition |
| Gravity Well | P3 / P3-102 | Area exposure, Save-result condition rider |
| Hallucination | P3 / P3-103 | Area exposure, Save-result condition rider, Information / adjudication, Modifier / resistance |
| Home Among Mulberry Leaves | P3 / P3-105 | Turn trigger or boundary, Area exposure, Native condition, Attack and dependent result |
| Impaling Spike | P3 / P3-106 | Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Modifier / resistance |
| Indolent Haze | P3 / P3-107 | Area exposure, Ending or dismissal, Save-result condition rider, Native condition |
| Infinitesimal Collapse Field | P3 / P3-108 | Area exposure, Save-result condition rider, Native condition |
| Inner Radiance Torrent | P3 / P3-109 | Area exposure, Save-result condition rider, Basic-save damage, Native condition, Counteract |
| Instant Minefield | P3 / P3-110 | Area exposure, Basic-save damage |
| Luring Wail | P3 / P3-111 | Area exposure, Save-result condition rider, Native condition, Modifier / resistance |
| Overflowing Sorrow | P3 / P3-113 | Area exposure, Save-result condition rider, Counteract, Modifier / resistance |
| Safeguard Secret | P3 / P3-115 | Area exposure, Choice / casting variant, Information / adjudication, Modifier / resistance |
| Shields of the Spirit | P3 / P3-116 | Turn trigger or boundary, Area exposure, Modifier / resistance |
| Silver's Refrain | P3 / P3-117 | Area exposure, Counteract |
| Slough Skin | P3 / P3-118 | Turn trigger or boundary, Area exposure, Persistent damage, Modifier / resistance |
| Songbird's Call | P3 / P3-119 | Area exposure |
| Under Sunless Skies | P3 / P3-122 | Turn trigger or boundary, Area exposure, Native condition, Modifier / resistance |
| Vector Screen | P3 / P3-123 | Area exposure, Modifier / resistance |
| Veil of Broken Reality | P3 / P3-124 | Area exposure, Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Information / adjudication |
| Vicious Jealousy | P3 / P3-125 | Area exposure, Save-result condition rider |
| Visions of Danger | P3 / P3-126 | Area exposure, Basic-save damage |
| Wall of Water | P3 / P3-128 | Area exposure, Counteract, Modifier / resistance |
| Ymeri's Mark | P3 / P3-129 | Area exposure, Ending or dismissal, Save-result condition rider, Basic-save damage, Native condition, Information / adjudication |
| Call of the Grave | P3 / P3-130 | Condition-dependent lifetime, Native condition, Attack and dependent result |
| Chromatic Ray | P3 / P3-130 | Condition-dependent lifetime, Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result |
| Divine Wrath | P3 / P3-130 | Condition-dependent lifetime, Save-result condition rider, Native condition |
| Friends to Foes | P3 / P3-130 | Condition-dependent lifetime, Save-result condition rider, Native condition |
| Frozen Fog | P3 / P3-130 | Condition-dependent lifetime, Sustain, Area exposure, Save-result condition rider, Basic-save damage, Native condition, Modifier / resistance |
| Missed Cue | P3 / P3-130 | Condition-dependent lifetime, Save-result condition rider, Native condition |
| Scramble Body | P3 / P3-130 | Condition-dependent lifetime, Save-result condition rider, Native condition |
| Vision of Death | P3 / P3-130 | Condition-dependent lifetime, Save-result condition rider, Native condition |
| With Friends like These | P3 / P3-130 | Condition-dependent lifetime, Save-result condition rider, Native condition |
| Calcification | P3 / P3-131 | Condition-dependent lifetime, Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition, Choice / casting variant, Modifier / resistance |
| Censure Falsehoods | P3 / P3-132 | Condition-dependent lifetime, Save-result condition rider, Native condition |
| Entrancing Eyes | P3 / P3-133 | Condition-dependent lifetime, Sustain, Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition |
| Focusing Hum | P3 / P3-134 | Condition-dependent lifetime, Sustain, Native condition |
| Horrifying Blood Loss | P3 / P3-135 | Condition-dependent lifetime, Save-result condition rider, Native condition |
| Lift Nature's Caul | P3 / P3-136 | Condition-dependent lifetime, Temporary immunity, Save-result condition rider, Native condition, Modifier / resistance |
| Mirror Malefactors | P3 / P3-137 | Condition-dependent lifetime, Sustain, Basic-save damage, Native condition |
| Overstuff | P3 / P3-138 | Condition-dependent lifetime, Save-result condition rider, Native condition, Modifier / resistance |
| Overwhelming Memory | P3 / P3-139 | Condition-dependent lifetime, Turn trigger or boundary, Save-result condition rider, Native condition |
| Phantasmal Killer | P3 / P3-140 | Condition-dependent lifetime, Turn trigger or boundary, Save-result condition rider, Native condition |
| Charitable Urge | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition |
| Confusion | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Ending or dismissal, Save-result condition rider, Native condition |
| Darkened Eyes | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Temporary immunity, Save-result condition rider, Native condition |
| Glacial Heart | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Temporary immunity, Save-result condition rider, Native condition |
| Lignify | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition, Modifier / resistance |
| Manifold Lives | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Temporary immunity, Save-result condition rider, Native condition |
| Medusa's Wrath | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result |
| Paralyze | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition |
| Petrify | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition |
| Pressure Zone | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Area exposure, Temporary immunity, Save-result condition rider, Native condition |
| Stasis | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition |
| Vitrifying Blast | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Modifier / resistance |
| Appeal to Authority | P3 / P3-142 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Modifier / resistance |
| Burning Blossoms | P3 / P3-142 | Recurring saving throw, Turn trigger or boundary, Area exposure, Temporary immunity, Save-result condition rider, Native condition |
| Claim Undead | P3 / P3-142 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition |
| Confusing Cry | P3 / P3-142 | Recurring saving throw, Turn trigger or boundary, Temporary immunity, Save-result condition rider, Native condition |
| Phantasmal Calamity | P3 / P3-142 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Basic-save damage, Native condition |
| Undermine Reality | P3 / P3-142 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider |
| Vibrant Pattern | P3 / P3-142 | Recurring saving throw, Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition |
| Waking Dream | P3 / P3-142 | Recurring saving throw, Sustain, Turn trigger or boundary, Ending or dismissal, Save-result condition rider, Native condition |
| Haunting Spirit | P3 / P3-143 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition |
| Orb of Twisting Fate | P3 / P3-143 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider |
| Possession | P3 / P3-143 | Recurring saving throw, Turn trigger or boundary, Area exposure, Ending or dismissal, Save-result condition rider, Native condition, Information / adjudication |
| Confusing Colors | P3 / P3-144 | Recurring saving throw, Area exposure, Save-result condition rider, Native condition |
| Hypnotize | P3 / P3-144 | Recurring saving throw, Area exposure, Save-result condition rider, Native condition |
| Divinity Leech | P3 / P3-145 | Recurring saving throw, Save-result condition rider, Native condition, Healing / recipient mode |
| Wave of Despair | P3 / P3-145 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition |
| Bane | P3 / P3-146 | Recurring saving throw, Sustain, Area exposure, Counteract, Modifier / resistance |
| Enthrall | P3 / P3-147 | Recurring saving throw, Sustain, Temporary immunity, Save-result condition rider, Native condition, Modifier / resistance |
| Inexhaustible Cynicism | P3 / P3-148 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Information / adjudication |
| Jealous Hex | P3 / P3-149 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition |
| Mind Games | P3 / P3-150 | Recurring saving throw, Sustain, Save-result condition rider, Native condition |
| Part the Mists to Paradise | P3 / P3-151 | Recurring saving throw, Ending or dismissal, Healing / recipient mode, Incarnate arrival/departure, Modifier / resistance |
| Puppet Strings | P3 / P3-153 | Recurring saving throw, Sustain, Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result |
| Charming Touch | P3 / P3-154 | Ending or dismissal, Save-result condition rider, Modifier / resistance |
| Crushing Ground | P3 / P3-154 | Ending or dismissal, Save-result condition rider, Native condition, Modifier / resistance |
| Cup of Dust | P3 / P3-154 | Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition |
| Fashionista | P3 / P3-154 | Ending or dismissal, Modifier / resistance |
| Feast of Ashes | P3 / P3-154 | Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition |
| Frozen Lungs | P3 / P3-154 | Ending or dismissal, Save-result condition rider |
| Musical Accompaniment | P3 / P3-154 | Ending or dismissal, Modifier / resistance |
| Sculpt Sound | P3 / P3-154 | Ending or dismissal, Save-result condition rider, Native condition |
| Shifting Form | P3 / P3-154 | Ending or dismissal, Granted movement speed, Modifier / resistance |
| Stick On | P3 / P3-154 | Ending or dismissal, Native condition |
| Tether | P3 / P3-154 | Ending or dismissal, Save-result condition rider, Native condition, Modifier / resistance |
| Glass Shield | P3 / P3-156 | Turn trigger or boundary, Ending or dismissal, Basic-save damage, Modifier / resistance |
| Protect Companion | P3 / P3-156 | Turn trigger or boundary, Ending or dismissal, Modifier / resistance |
| Shield | P3 / P3-156 | Turn trigger or boundary, Ending or dismissal, Modifier / resistance |
| Guidance | P3 / P3-157 | Temporary immunity, Ending or dismissal, Modifier / resistance |
| Wash Your Luck | P3 / P3-157 | Temporary immunity, Ending or dismissal |
| Anticipate Peril | P3 / P3-158 | Ending or dismissal, Modifier / resistance |
| Bullhorn | P3 / P3-159 | Ending or dismissal, Modifier / resistance |
| Nymph's Token | P3 / P3-159 | Ending or dismissal, Modifier / resistance |
| Biting Words | P3 / P3-160 | Ending or dismissal, Attack and dependent result |
| Camel Spit | P3 / P3-160 | Ending or dismissal, Persistent damage, Native condition, Attack and dependent result |
| Charm | P3 / P3-161 | Ending or dismissal, Save-result condition rider, Modifier / resistance |
| Curse of Death | P3 / P3-162 | Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Delegated affliction |
| Mycological Malady | P3 / P3-162 | Ending or dismissal, Save-result condition rider, Native condition, Delegated affliction |
| Snake Fangs | P3 / P3-163 | Ending or dismissal |
| Funeral Flames | P3 / P3-164 | Ending or dismissal, Persistent damage |
| Oaken Resilience | P3 / P3-164 | Ending or dismissal, Modifier / resistance |
| Illusory Disguise | P3 / P3-165 | Ending or dismissal, Choice / casting variant, Modifier / resistance |
| Imitate Fauna | P3 / P3-165 | Ending or dismissal, Information / adjudication, Modifier / resistance |
| Bridge of Vines | P3 / P3-168 | Ending or dismissal, Save-result condition rider, Native condition |
| Skyglass Prison | P3 / P3-168 | Turn trigger or boundary, Ending or dismissal, Save-result condition rider, Native condition |
| Aura of the Unremarkable | P3 / P3-169 | Ending or dismissal, Save-result condition rider, Information / adjudication, Modifier / resistance |
| Blister | P3 / P3-171 | Ending or dismissal, Save-result condition rider, Basic-save damage, Choice / casting variant |
| Chosen Gravity | P3 / P3-173 | Ending or dismissal, Modifier / resistance |
| Chrysopoetic Curse | P3 / P3-174 | Ending or dismissal, Save-result condition rider, Native condition |
| Confetti Cloud | P3 / P3-176 | Ending or dismissal, Modifier / resistance |
| Detonate Magic | P3 / P3-179 | Ending or dismissal, Basic-save damage, Counteract |
| Dutiful Challenge | P3 / P3-182 | Ending or dismissal, Modifier / resistance |
| Elemental Absorption | P3 / P3-184 | Ending or dismissal, Basic-save damage, Choice / casting variant, Modifier / resistance |
| Falsify Heat | P3 / P3-185 | Ending or dismissal, Choice / casting variant, Information / adjudication, Modifier / resistance |
| Favorable Review | P3 / P3-186 | Ending or dismissal, Save-result condition rider |
| Imprinting Hand | P3 / P3-193 | Ending or dismissal, Save-result condition rider, Healing / recipient mode |
| Life-Giving Form | P3 / P3-196 | Temporary immunity, Ending or dismissal, Healing / recipient mode, Modifier / resistance |
| Lock | P3 / P3-197 | Ending or dismissal, Modifier / resistance |
| Mirecloak | P3 / P3-199 | Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Information / adjudication, Modifier / resistance |
| One with the Land | P3 / P3-200 | Ending or dismissal, Attack and dependent result, Choice / casting variant, Information / adjudication |
| Personal Blizzard | P3 / P3-201 | Ending or dismissal, Save-result condition rider, Persistent damage |
| Personal Ocean | P3 / P3-202 | Ending or dismissal, Granted movement speed, Counteract, Modifier / resistance |
| Personal Runewell | P3 / P3-203 | Ending or dismissal, Basic-save damage, Modifier / resistance |
| Phantasmal Treasure | P3 / P3-204 | Turn trigger or boundary, Ending or dismissal, Save-result condition rider, Native condition |
| Purifying Veil | P3 / P3-206 | Ending or dismissal, Basic-save damage |
| Scrounger's Glee | P3 / P3-209 | Ending or dismissal, Save-result condition rider, Native condition, Healing / recipient mode |
| Shaken Confidence | P3 / P3-211 | Turn trigger or boundary, Ending or dismissal, Save-result condition rider |
| Stone Lance | P3 / P3-215 | Ending or dismissal, Persistent damage, Attack and dependent result, Modifier / resistance |
| Sudden Recollection | P3 / P3-216 | Ending or dismissal, Choice / casting variant, Information / adjudication |
| Suspended Retribution | P3 / P3-218 | Ending or dismissal, Basic-save damage, Attack and dependent result |
| Tree of Seasons | P3 / P3-221 | Ending or dismissal, Basic-save damage |
| Unfetter Eidolon | P3 / P3-222 | Ending or dismissal, Native condition, Modifier / resistance |
| Vindicator's Mark | P3 / P3-224 | Ending or dismissal, Attack and dependent result, Information / adjudication |
| Whirling Scarves | P3 / P3-226 | Turn trigger or boundary, Ending or dismissal, Modifier / resistance |
| Winning Streak | P3 / P3-227 | Ending or dismissal, Native condition |
| Word of Freedom | P3 / P3-228 | Ending or dismissal, Native condition |
| Word of Truth | P3 / P3-229 | Ending or dismissal, Modifier / resistance |
| Ancestral Winds | P3 / P3-231 | Sustain, Save-result condition rider, Native condition |
| Animus Mine | P3 / P3-231 | Sustain, Ending or dismissal, Save-result condition rider, Native condition |
| Breath of Drought | P3 / P3-231 | Sustain, Area exposure, Save-result condition rider, Native condition |
| Cinder Swarm | P3 / P3-231 | Sustain, Aura membership, Temporary immunity, Save-result condition rider, Basic-save damage, Persistent damage, Native condition |
| Consuming Darkness | P3 / P3-231 | Sustain, Area exposure, Save-result condition rider, Native condition, Modifier / resistance |
| Freezing Rain | P3 / P3-231 | Sustain, Save-result condition rider, Native condition |
| Invoke Spirits | P3 / P3-231 | Sustain, Save-result condition rider, Basic-save damage, Native condition |
| Living Terrain | P3 / P3-231 | Sustain, Turn trigger or boundary, Save-result condition rider, Native condition |
| Quench | P3 / P3-231 | Sustain, Basic-save damage, Counteract, Choice / casting variant |
| Steal Shadow | P3 / P3-231 | Sustain, Save-result condition rider, Basic-save damage, Native condition |
| Vibrant Vibrato | P3 / P3-231 | Sustain, Aura membership, Turn trigger or boundary, Area exposure, Save-result condition rider, Persistent damage, Native condition |
| Animated Assault | P3 / P3-232 | Sustain, Basic-save damage |
| Circle of Weakness | P3 / P3-232 | Sustain, Save-result condition rider, Native condition, Choice / casting variant, Modifier / resistance |
| Devouring Void | P3 / P3-232 | Sustain, Basic-save damage |
| Earth's Bile | P3 / P3-232 | Sustain, Persistent damage, Choice / casting variant |
| Ember Doppelgänger | P3 / P3-232 | Sustain, Basic-save damage, Native condition, Modifier / resistance |
| Fiendish Rift | P3 / P3-232 | Sustain, Save-result condition rider, Native condition |
| Grasping Earth | P3 / P3-232 | Sustain, Area exposure, Save-result condition rider, Native condition |
| Hymn of Healing | P3 / P3-232 | Sustain, Healing / recipient mode |
| Sanguine Mist | P3 / P3-232 | Sustain, Basic-save damage |
| Shroud of Flame | P3 / P3-232 | Sustain, Basic-save damage |
| Swarmsense | P3 / P3-232 | Sustain, Granted movement speed, Modifier / resistance |
| Unravel Existence | P3 / P3-232 | Sustain, Basic-save damage, Persistent damage, Native condition |
| Benediction | P3 / P3-233 | Sustain, Area exposure, Counteract, Modifier / resistance |
| Bless | P3 / P3-233 | Sustain, Area exposure, Counteract, Modifier / resistance |
| Hungry Depths | P3 / P3-233 | Sustain, Area exposure, Basic-save damage |
| Malediction | P3 / P3-233 | Sustain, Area exposure, Counteract, Modifier / resistance |
| Pied Piping | P3 / P3-233 | Sustain, Area exposure, Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition |
| Protective Wards | P3 / P3-233 | Sustain, Aura membership, Modifier / resistance |
| Reaper's Lantern | P3 / P3-233 | Sustain, Area exposure, Native condition, Healing / recipient mode |
| Bone Shield | P3 / P3-234 | Sustain, Modifier / resistance |
| Doom Mark | P3 / P3-234 | Sustain, Native condition, Attack and dependent result |
| For Love, For Lightning | P3 / P3-234 | Sustain, Basic-save damage |
| Metal Reverberation | P3 / P3-234 | Sustain, Basic-save damage |
| Overload Connection | P3 / P3-234 | Sustain, Basic-save damage, Information / adjudication |
| Spectral Blade | P3 / P3-234 | Sustain, Attack and dependent result |
| Spiritual Armament | P3 / P3-234 | Sustain, Attack and dependent result |
| Avenging Wildwood | P3 / P3-235 | Sustain, Attack and dependent result, Choice / casting variant |
| Malicious Shadow | P3 / P3-235 | Sustain, Area exposure, Attack and dependent result, Counteract, Choice / casting variant |
| Blood in the Water | P3 / P3-236 | Sustain, Basic-save damage, Persistent damage |
| Coiling Dance | P3 / P3-236 | Sustain, Native condition, Choice / casting variant |
| Figment | P3 / P3-236 | Sustain, Modifier / resistance |
| Dancing Fountain | P3 / P3-237 | Sustain, Turn trigger or boundary, Area exposure, Basic-save damage |
| Phantom Orchestra | P3 / P3-237 | Sustain, Basic-save damage |
| Spiritual Weapon | P3 / P3-237 | Sustain, Attack and dependent result |
| Infectious Comedy | P3 / P3-238 | Sustain, Save-result condition rider, Native condition |
| Mad Monkeys | P3 / P3-238 | Sustain, Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Choice / casting variant |
| Unfathomable Song | P3 / P3-238 | Sustain, Temporary immunity, Save-result condition rider, Native condition |
| Crown of Prophets | P3 / P3-239 | Sustain, Turn trigger or boundary, Basic-save damage |
| Discern Secrets | P3 / P3-239 | Sustain, Temporary immunity, Information / adjudication, Modifier / resistance |
| Wish Market | P3 / P3-239 | Sustain, Modifier / resistance |
| Beastmaster Trance | P3 / P3-240 | Sustain, Area exposure, Native condition, Information / adjudication |
| Eyes of the Dead | P3 / P3-240 | Sustain, Area exposure, Native condition, Information / adjudication |
| Leaden Steps | P3 / P3-243 | Sustain, Turn trigger or boundary, Save-result condition rider, Modifier / resistance |
| Lightning Lasso | P3 / P3-243 | Sustain, Turn trigger or boundary, Save-result condition rider, Native condition |
| Mantle of the Frozen Heart | P3 / P3-244 | Sustain, Area exposure, Granted movement speed, Modifier / resistance |
| Mantle of the Magma Heart | P3 / P3-244 | Sustain, Area exposure, Persistent damage, Native condition, Modifier / resistance |
| Impaling Briars | P3 / P3-245 | Sustain, Area exposure, Save-result condition rider, Native condition, Attack and dependent result, Modifier / resistance |
| Pernicious Poltergeist | P3 / P3-245 | Sustain, Native condition |
| Lightning Storm | P3 / P3-246 | Sustain, Basic-save damage |
| Poltergeist's Fury | P3 / P3-246 | Sustain, Basic-save damage |
| Control Sand | P3 / P3-247 | Sustain, Area exposure, Temporary immunity, Save-result condition rider, Basic-save damage, Native condition, Choice / casting variant |
| Scouring Sand | P3 / P3-247 | Sustain, Area exposure, Temporary immunity, Save-result condition rider, Native condition, Counteract |
| Spirit Object | P3 / P3-248 | Sustain, Area exposure, Ending or dismissal, Attack and dependent result |
| Tangling Creepers | P3 / P3-248 | Sustain, Area exposure, Native condition, Attack and dependent result, Modifier / resistance |
| Animal Vision | P3 / P3-249 | Sustain, Information / adjudication |
| Animate Rope | P3 / P3-250 | Sustain, Attack and dependent result, Modifier / resistance |
| Appearance of Wealth | P3 / P3-251 | Sustain, Area exposure, Native condition |
| Aqueous Orb | P3 / P3-252 | Sustain, Save-result condition rider, Counteract |
| Awaken Entropy | P3 / P3-253 | Sustain, Area exposure, Basic-save damage |
| Bound in Death | P3 / P3-255 | Sustain, Save-result condition rider |
| Call of the Quenching | P3 / P3-258 | Sustain, Area exposure, Basic-save damage, Granted movement speed, Modifier / resistance |
| Confront Selves | P3 / P3-260 | Sustain, Turn trigger or boundary, Basic-save damage, Native condition |
| Dancing Blade | P3 / P3-262 | Sustain, Attack and dependent result |
| Diadem of Divine Radiance | P3 / P3-264 | Sustain, Persistent damage, Native condition, Attack and dependent result, Counteract |
| Diamond Dust | P3 / P3-265 | Sustain, Aura membership, Area exposure, Ending or dismissal, Modifier / resistance |
| Divine Aura | P3 / P3-266 | Sustain, Aura membership, Temporary immunity, Native condition, Choice / casting variant, Modifier / resistance |
| Domora's Defense | P3 / P3-267 | Sustain, Modifier / resistance |
| Draconic Barrage | P3 / P3-268 | Sustain, Basic-save damage |
| Dragon Turret | P3 / P3-269 | Sustain, Area exposure, Basic-save damage |
| Duplicate Foe | P3 / P3-270 | Sustain, Healing / recipient mode |
| Fallen Soldier's Lament | P3 / P3-271 | Sustain, Save-result condition rider, Native condition |
| Floating Flame | P3 / P3-273 | Sustain, Area exposure, Basic-save damage |
| Garden of Healing | P3 / P3-274 | Sustain, Healing / recipient mode, Modifier / resistance |
| Gasping Marsh | P3 / P3-275 | Sustain, Area exposure, Temporary immunity, Save-result condition rider, Persistent damage, Native condition |
| Gift of the Anemos | P3 / P3-276 | Sustain, Aura membership, Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result |
| Glamorize | P3 / P3-277 | Sustain, Modifier / resistance |
| Grasping Vine | P3 / P3-278 | Sustain, Turn trigger or boundary, Save-result condition rider |
| Halcyon Mists | P3 / P3-279 | Sustain, Turn trigger or boundary, Persistent damage, Choice / casting variant |
| Implosion | P3 / P3-280 | Sustain, Choice / casting variant |
| Infectious Ennui | P3 / P3-281 | Sustain, Turn trigger or boundary, Temporary immunity, Save-result condition rider, Native condition, Choice / casting variant, Information / adjudication |
| Interstellar Void | P3 / P3-282 | Sustain, Basic-save damage, Native condition |
| Lashing Rope | P3 / P3-283 | Sustain, Turn trigger or boundary, Save-result condition rider, Attack and dependent result |
| Levitate | P3 / P3-284 | Sustain, Modifier / resistance |
| Light | P3 / P3-285 | Sustain, Ending or dismissal, Choice / casting variant |
| Magic's Vessel | P3 / P3-286 | Sustain, Turn trigger or boundary, Modifier / resistance |
| Magnetic Dominion | P3 / P3-287 | Sustain |
| Mind Probe | P3 / P3-289 | Sustain, Save-result condition rider, Information / adjudication, Modifier / resistance |
| Mind Reading | P3 / P3-290 | Sustain, Temporary immunity, Save-result condition rider, Information / adjudication |
| Movanic Glimmer | P3 / P3-293 | Sustain, Choice / casting variant, Modifier / resistance |
| Musical Shift | P3 / P3-294 | Sustain, Save-result condition rider, Persistent damage, Native condition, Modifier / resistance |
| Painted Scout | P3 / P3-295 | Sustain |
| Palm-Held Sun | P3 / P3-296 | Sustain, Aura membership, Native condition, Healing / recipient mode |
| Persistent Servant | P3 / P3-298 | Sustain, Native condition, Choice / casting variant |
| Phantasmal Protagonist | P3 / P3-300 | Sustain, Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result |
| Pillars of Sand | P3 / P3-302 | Sustain, Area exposure, Native condition |
| Pyrotechnics | P3 / P3-305 | Sustain, Turn trigger or boundary, Area exposure, Temporary immunity, Save-result condition rider, Native condition, Information / adjudication, Modifier / resistance |
| Rewrite Memory | P3 / P3-307 | Sustain, Area exposure |
| Sacred Nimbus | P3 / P3-308 | Sustain, Turn trigger or boundary, Modifier / resistance |
| Seize Identity | P3 / P3-311 | Sustain, Save-result condition rider, Basic-save damage, Native condition |
| Shielding Formation | P3 / P3-312 | Sustain, Area exposure, Temporary immunity, Modifier / resistance |
| Sign of Conviction | P3 / P3-314 | Sustain, Native condition, Attack and dependent result, Modifier / resistance |
| Song of Marching | P3 / P3-316 | Sustain, Area exposure, Temporary immunity, Modifier / resistance |
| Spellsurge | P3 / P3-317 | Sustain, Persistent damage, Native condition, Choice / casting variant, Modifier / resistance |
| Stars of Another Sky | P3 / P3-318 | Sustain, Area exposure, Temporary immunity, Save-result condition rider, Native condition |
| Swear Oath | P3 / P3-320 | Sustain, Modifier / resistance |
| Trade Death for Life | P3 / P3-322 | Sustain, Basic-save damage, Healing / recipient mode |
| Traveling Workshop | P3 / P3-323 | Sustain |
| Trickster's Mirrors | P3 / P3-324 | Sustain, Save-result condition rider, Basic-save damage |
| Unbreaking Wave Containment | P3 / P3-325 | Sustain, Basic-save damage, Native condition, Attack and dependent result |
| Vacuum | P3 / P3-326 | Sustain, Area exposure, Save-result condition rider, Native condition, Modifier / resistance |
| Whispers of a Dead Goddess | P3 / P3-328 | Sustain, Area exposure, Temporary immunity, Save-result condition rider, Native condition |
| Zenith Star | P3 / P3-329 | Sustain, Save-result condition rider, Native condition, Information / adjudication |
| Acid Splash | P4 / P4-001 | Persistent damage, Attack and dependent result |
| Blinding Foam | P4 / P4-001 | Persistent damage, Native condition, Attack and dependent result |
| Elemental Toss | P4 / P4-001 | Attack and dependent result |
| Flense | P4 / P4-001 | Persistent damage, Native condition, Attack and dependent result |
| Live Wire | P4 / P4-001 | Save-result condition rider, Persistent damage, Attack and dependent result |
| Moonbeam | P4 / P4-001 | Native condition, Attack and dependent result |
| Murder of Crows | P4 / P4-001 | Native condition, Attack and dependent result |
| Purifying Icicle | P4 / P4-001 | Attack and dependent result, Modifier / resistance |
| Ray of Frost | P4 / P4-001 | Attack and dependent result, Modifier / resistance |
| Snowball | P4 / P4-001 | Attack and dependent result, Modifier / resistance |
| Threefold Limb | P4 / P4-001 | Turn trigger or boundary, Attack and dependent result, Modifier / resistance |
| Warshard Shot | P4 / P4-001 | Save-result condition rider, Persistent damage, Attack and dependent result, Modifier / resistance |
| Acid Arrow | P4 / P4-002 | Persistent damage, Attack and dependent result |
| Glutton's Jaws | P4 / P4-002 | Turn trigger or boundary, Attack and dependent result |
| Hurtling Stone | P4 / P4-002 | Attack and dependent result |
| Inkshot | P4 / P4-002 | Native condition, Attack and dependent result |
| Scorching Blast | P4 / P4-002 | Persistent damage, Attack and dependent result |
| Shocking Grasp | P4 / P4-002 | Persistent damage, Attack and dependent result, Modifier / resistance |
| Soul Cutter | P4 / P4-002 | Save-result condition rider, Native condition, Attack and dependent result |
| Spiked Carapace | P4 / P4-002 | Persistent damage, Attack and dependent result, Modifier / resistance |
| Sticky Fire | P4 / P4-002 | Persistent damage, Native condition, Attack and dependent result |
| Widow’s Bite | P4 / P4-002 | Persistent damage, Native condition, Attack and dependent result |
| Withering Grasp | P4 / P4-002 | Persistent damage, Attack and dependent result |
| Admonishing Ray | P4 / P4-003 | Attack and dependent result |
| Boomerang Shot | P4 / P4-003 | Attack and dependent result |
| Divine Lance | P4 / P4-003 | Attack and dependent result |
| Flurry of Claws | P4 / P4-003 | Attack and dependent result |
| Ignition | P4 / P4-003 | Persistent damage, Attack and dependent result |
| Percussive Impact | P4 / P4-003 | Native condition, Attack and dependent result |
| Polar Ray | P4 / P4-003 | Native condition, Attack and dependent result |
| Slashing Gust | P4 / P4-003 | Persistent damage, Attack and dependent result |
| Sun Blade | P4 / P4-003 | Attack and dependent result |
| Tangle Vine | P4 / P4-003 | Native condition, Attack and dependent result, Modifier / resistance |
| Force Fling | P4 / P4-004 | Attack and dependent result |
| Fulminating Impact | P4 / P4-004 | Attack and dependent result |
| Pulverizing Wake | P4 / P4-004 | Basic-save damage, Attack and dependent result |
| Tentacular Innervation | P4 / P4-004 | Native condition, Attack and dependent result |
| Thunderous Strike | P4 / P4-004 | Save-result condition rider, Basic-save damage, Native condition, Attack and dependent result |
| Warding Aggression | P4 / P4-004 | Save-result condition rider, Attack and dependent result, Modifier / resistance |
| Brine Dragon Bile | P4 / P4-005 | Persistent damage, Attack and dependent result |
| Briny Bolt | P4 / P4-005 | Native condition, Attack and dependent result |
| Horizon Thunder Sphere | P4 / P4-005 | Save-result condition rider, Basic-save damage, Native condition, Attack and dependent result |
| Propelling Air Stream | P4 / P4-005 | Turn trigger or boundary, Granted movement speed, Attack and dependent result |
| Chilling Darkness | P4 / P4-006 | Attack and dependent result, Counteract |
| Holy Light | P4 / P4-006 | Attack and dependent result, Counteract |
| Moonlight Ray | P4 / P4-006 | Attack and dependent result, Counteract |
| Blood Feast | P4 / P4-007 | Persistent damage, Attack and dependent result |
| Needle Darts | P4 / P4-007 | Persistent damage, Attack and dependent result, Modifier / resistance |
| Splinter Volley | P4 / P4-007 | Persistent damage, Attack and dependent result |
| Ancestral Memories | P4 / P4-008 | Turn trigger or boundary, Attack and dependent result, Modifier / resistance |
| Vindicator's Judgment | P4 / P4-008 | Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result, Modifier / resistance |
| Blazing Blade | P4 / P4-009 | Persistent damage, Attack and dependent result |
| Deity's Strike | P4 / P4-009 | Basic-save damage, Attack and dependent result |
| Magnetic Acceleration | P4 / P4-010 | Attack and dependent result, Modifier / resistance |
| Phase Bolt | P4 / P4-010 | Attack and dependent result |
| Disintegrate | P4 / P4-011 | Basic-save damage, Attack and dependent result |
| Ray of Corruption | P4 / P4-011 | Save-result condition rider, Basic-save damage, Persistent damage, Attack and dependent result |
| Aqueous Blast | P4 / P4-013 | Native condition, Attack and dependent result |
| Barbed Spear | P4 / P4-014 | Native condition, Attack and dependent result |
| Belittling Boast | P4 / P4-015 | Native condition, Attack and dependent result, Modifier / resistance |
| Bonewall Bulwark | P4 / P4-017 | Turn trigger or boundary, Attack and dependent result |
| Booming Blast | P4 / P4-018 | Save-result condition rider, Native condition, Attack and dependent result |
| Bottle the Storm | P4 / P4-019 | Attack and dependent result, Modifier / resistance |
| Charged Javelin | P4 / P4-020 | Persistent damage, Attack and dependent result, Modifier / resistance |
| Draw Blood | P4 / P4-022 | Persistent damage, Healing / recipient mode, Attack and dependent result |
| Establish Ward | P4 / P4-024 | Native condition, Attack and dependent result |
| Exploding Earth | P4 / P4-025 | Native condition, Attack and dependent result |
| Helpful Reload | P4 / P4-029 | Attack and dependent result, Modifier / resistance |
| Inner Upheaval | P4 / P4-030 | Attack and dependent result, Modifier / resistance |
| Shielded Arm | P4 / P4-032 | Attack and dependent result, Modifier / resistance |
| Steal the Sky | P4 / P4-035 | Save-result condition rider, Native condition, Attack and dependent result |
| Thrall Charge | P4 / P4-036 | Attack and dependent result, Modifier / resistance |
| Touch of Death | P4 / P4-037 | Temporary immunity, Save-result condition rider, Native condition, Attack and dependent result |
| Tracking Mayflies | P4 / P4-038 | Native condition, Attack and dependent result |
| Victory Cry | P4 / P4-039 | Attack and dependent result, Modifier / resistance |
| Weaponize Secret | P4 / P4-042 | Save-result condition rider, Persistent damage, Attack and dependent result |
| Winter Bolt | P4 / P4-044 | Turn trigger or boundary, Attack and dependent result |
| Bounty of the Sky | P4 / P4-103 | Native condition, Healing / recipient mode, Delegated affliction |
| Healer's Blessing | P4 / P4-103 | Healing / recipient mode |
| Necromancer's Generosity | P4 / P4-103 | Healing / recipient mode, Modifier / resistance |
| Ravening Maw | P4 / P4-103 | Healing / recipient mode |
| Soothe | P4 / P4-103 | Healing / recipient mode, Modifier / resistance |
| Soothing Spring | P4 / P4-103 | Native condition, Healing / recipient mode |
| Blessing of Vigor | P4 / P4-104 | Healing / recipient mode |
| Life Boost | P4 / P4-104 | Healing / recipient mode |
| Malignant Sustenance | P4 / P4-104 | Healing / recipient mode |
| Mantle of Heaven's Slopes | P4 / P4-104 | Healing / recipient mode, Information / adjudication, Modifier / resistance |
| Mantle of the Unwavering Heart | P4 / P4-104 | Native condition, Healing / recipient mode |
| Song of the Soul | P4 / P4-104 | Healing / recipient mode, Choice / casting variant |
| Spiritual Renewal | P4 / P4-104 | Healing / recipient mode |
| Execute | P4 / P4-105 | Basic-save damage, Healing / recipient mode |
| Harm | P4 / P4-105 | Basic-save damage, Healing / recipient mode |
| Heal | P4 / P4-105 | Basic-save damage, Healing / recipient mode |
| Heartbolt | P4 / P4-105 | Basic-save damage, Healing / recipient mode |
| Soothing Mist | P4 / P4-105 | Basic-save damage, Persistent damage, Healing / recipient mode |
| Blood-Feasting Breath | P4 / P4-106 | Basic-save damage, Healing / recipient mode |
| Call The Blood | P4 / P4-106 | Native condition, Healing / recipient mode, Modifier / resistance |
| Devour Life | P4 / P4-106 | Basic-save damage, Healing / recipient mode, Modifier / resistance |
| Fearful Feast | P4 / P4-106 | Save-result condition rider, Native condition, Healing / recipient mode |
| Phoenix Ward | P4 / P4-106 | Healing / recipient mode, Modifier / resistance |
| Vicious Howl | P4 / P4-106 | Healing / recipient mode, Modifier / resistance |
| Lay on Hands | P4 / P4-107 | Basic-save damage, Healing / recipient mode, Modifier / resistance |
| Touch of the Void | P4 / P4-107 | Basic-save damage, Healing / recipient mode, Modifier / resistance |
| Consecrate Flesh | P4 / P4-109 | Healing / recipient mode, Modifier / resistance |
| Curse of Lost Time | P4 / P4-110 | Save-result condition rider, Basic-save damage, Native condition, Healing / recipient mode, Counteract, Delegated affliction |
| Divine Armageddon | P4 / P4-112 | Healing / recipient mode |
| Gentle Breeze | P4 / P4-113 | Healing / recipient mode, Modifier / resistance |
| Healing Plaster | P4 / P4-115 | Healing / recipient mode, Modifier / resistance |
| Life Tap | P4 / P4-118 | Save-result condition rider, Native condition, Healing / recipient mode |
| Rejuvenating Flames | P4 / P4-127 | Basic-save damage, Healing / recipient mode, Modifier / resistance |
| Shock to the System | P4 / P4-129 | Turn trigger or boundary, Native condition, Healing / recipient mode |
| Sound Body | P4 / P4-131 | Turn trigger or boundary, Native condition, Healing / recipient mode, Counteract |
| Unblinking Flame Aura | P4 / P4-132 | Healing / recipient mode, Modifier / resistance |
| Aerial Form | P5 / P5-001 | Ending or dismissal, Persistent damage, Native condition, Choice / casting variant, Creature transformation, Modifier / resistance |
| Angel Form | P5 / P5-001 | Ending or dismissal, Native condition, Creature transformation, Information / adjudication, Modifier / resistance |
| Animal Form | P5 / P5-001 | Ending or dismissal, Native condition, Choice / casting variant, Creature transformation |
| Cosmic Form | P5 / P5-001 | Ending or dismissal, Persistent damage, Native condition, Creature transformation |
| Daemon Form | P5 / P5-001 | Ending or dismissal, Native condition, Creature transformation, Information / adjudication, Modifier / resistance |
| Demon Form | P5 / P5-001 | Ending or dismissal, Native condition, Choice / casting variant, Creature transformation, Modifier / resistance |
| Devil Form | P5 / P5-001 | Ending or dismissal, Native condition, Creature transformation, Modifier / resistance |
| Dinosaur Form | P5 / P5-001 | Ending or dismissal, Persistent damage, Native condition, Choice / casting variant, Creature transformation |
| Dragon Form | P5 / P5-001 | Ending or dismissal, Granted movement speed, Native condition, Choice / casting variant, Creature transformation, Modifier / resistance |
| Insect Form | P5 / P5-001 | Ending or dismissal, Persistent damage, Native condition, Choice / casting variant, Creature transformation |
| Plant Form | P5 / P5-001 | Ending or dismissal, Native condition, Choice / casting variant, Creature transformation, Modifier / resistance |
| The Everfull Moon | P5 / P5-001 | Native condition, Creature transformation, Information / adjudication, Modifier / resistance |
| Element Embodied | P5 / P5-002 | Area exposure, Ending or dismissal, Basic-save damage, Persistent damage, Native condition, Healing / recipient mode, Choice / casting variant, Creature transformation, Terrain, Modifier / resistance |
| Monstrosity Form | P5 / P5-002 | Sustain, Aura membership, Turn trigger or boundary, Area exposure, Ending or dismissal, Basic-save damage, Persistent damage, Native condition, Creature transformation |
| Nature Incarnate | P5 / P5-002 | Area exposure, Ending or dismissal, Save-result condition rider, Native condition, Creature transformation, Modifier / resistance |
| Ooze Form | P5 / P5-002 | Ending or dismissal, Save-result condition rider, Native condition, Creature transformation, Information / adjudication, Modifier / resistance |
| Primal Herd | P5 / P5-002 | Area exposure, Ending or dismissal, Basic-save damage, Native condition, Creature transformation |
| Avatar | P5 / P5-003 | Ending or dismissal, Native condition, Creature transformation |
| Humanoid Form | P5 / P5-003 | Ending or dismissal, Modifier / resistance |
| Threefold Aspect | P5 / P5-003 | Sustain, Ending or dismissal, Choice / casting variant, Modifier / resistance |
| Ash Form | P5 / P5-004 | Healing / recipient mode, Creature transformation, Modifier / resistance |
| Sudden Swarm | P5 / P5-004 | Sustain, Basic-save damage, Native condition, Modifier / resistance |
| Swarm Form | P5 / P5-004 | Ending or dismissal, Save-result condition rider, Native condition, Modifier / resistance |
| Unusual Anatomy | P5 / P5-004 | Modifier / resistance |
| Untamed Form | P5 / P5-005 | Creature transformation, Modifier / resistance |
| Pest Form | P5 / P5-006 | Ending or dismissal, Granted movement speed, Creature transformation, Modifier / resistance |
| Apex Companion | P5 / P5-007 | Creature transformation, Modifier / resistance |
| Enlarge Companion | P5 / P5-007 |  |
| Bestial Curse | P5 / P5-008 | Save-result condition rider, Native condition, Creature transformation, Modifier / resistance |
| Cursed Metamorphosis | P5 / P5-008 | Save-result condition rider, Native condition |
| Elemental Form | P5 / P5-009 | Ending or dismissal, Persistent damage, Choice / casting variant, Creature transformation, Forced movement, Modifier / resistance |
| Fey Form | P5 / P5-009 | Ending or dismissal, Creature transformation, Modifier / resistance |
| Tempest Form | P5 / P5-010 | Granted movement speed, Choice / casting variant, Modifier / resistance |
| Vapor Form | P5 / P5-010 | Ending or dismissal, Granted movement speed, Creature transformation, Modifier / resistance |
| Aberrant Form | P5 / P5-011 | Ending or dismissal, Native condition, Creature transformation, Modifier / resistance |
| Amalgamizing Leap | P5 / P5-012 | Turn trigger or boundary, Save-result condition rider, Granted movement speed, Native condition, Choice / casting variant, Teleportation |
| Ancestral Form | P5 / P5-013 | Sustain, Granted movement speed, Creature transformation, Modifier / resistance |
| Corrosive Body | P5 / P5-014 | Ending or dismissal, Creature transformation |
| Devouring Dark Form | P5 / P5-015 | Sustain, Creature transformation |
| Elephant Form | P5 / P5-017 | Creature transformation |
| Enlarge | P5 / P5-018 | Native condition, Modifier / resistance |
| Ferrous Form | P5 / P5-019 | Ending or dismissal, Native condition, Healing / recipient mode, Modifier / resistance |
| Fiery Body | P5 / P5-020 | Modifier / resistance |
| Juvenile Companion | P5 / P5-021 | Modifier / resistance |
| Living Thunderbolt | P5 / P5-022 | Area exposure, Basic-save damage, Granted movement speed, Native condition, Creature transformation, Modifier / resistance |
| Patron's Protector | P5 / P5-025 | Sustain, Save-result condition rider, Basic-save damage, Forced movement, Modifier / resistance |
| Qi Form | P5 / P5-026 | Sustain, Aura membership, Area exposure, Granted movement speed, Counteract, Creature transformation, Modifier / resistance |
| Sacred Form | P5 / P5-027 | Ending or dismissal, Creature transformation, Modifier / resistance |
| Sand Form | P5 / P5-028 | Creature transformation, Modifier / resistance |
| Shrink | P5 / P5-029 |  |
| Spectral Advance | P5 / P5-031 | Movement action, Modifier / resistance |
| Summoner's Visage | P5 / P5-032 | Ending or dismissal, Modifier / resistance |
| Tiny Wings | P5 / P5-033 | Granted movement speed, Modifier / resistance |
| Conglomerate of Limbs | P6 / P6-001 | Save-result condition rider, Native condition, Attack and dependent result, Created entities |
| Living Graveyard | P6 / P6-001 | Native condition, Created entities |
| Recurring Nightmare | P6 / P6-001 | Sustain, Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Attack and dependent result, Created entities |
| Bind Heroic Spirit | P6 / P6-002 | Created entities, Modifier / resistance |
| Bloody Tendrils | P6 / P6-003 | Basic-save damage, Created entities |
| Blossoming Gore | P6 / P6-004 | Area exposure, Ending or dismissal, Save-result condition rider, Persistent damage, Native condition, Created entities |
| Dread Mosquito Storm | P6 / P6-006 | Area exposure, Save-result condition rider, Native condition, Created entities, Delegated affliction, Modifier / resistance |
| Holy Host | P6 / P6-011 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Healing / recipient mode, Choice / casting variant, Incarnate arrival/departure, Forced movement, Information / adjudication, Modifier / resistance |
| Incarnate Kaiju | P6 / P6-011 | Turn trigger or boundary, Area exposure, Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Forced movement, Modifier / resistance |
| Incarnate Wild Rose | P6 / P6-011 | Save-result condition rider, Persistent damage, Native condition, Incarnate arrival/departure |
| Pest Swarm | P6 / P6-011 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Terrain, Delegated affliction, Modifier / resistance |
| Unholy Army | P6 / P6-011 | Area exposure, Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Modifier / resistance |
| Clockwork Devotion | P6 / P6-012 | Save-result condition rider, Basic-save damage, Persistent damage, Incarnate arrival/departure |
| Skeleton Army | P6 / P6-012 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Incarnate arrival/departure |
| Incarnate Deific Herald | P6 / P6-013 | Save-result condition rider, Basic-save damage, Native condition, Healing / recipient mode, Counteract, Incarnate arrival/departure |
| Summon Elemental Herald | P6 / P6-013 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Terrain, Forced movement, Modifier / resistance |
| Beseech Arcanotheign | P6 / P6-014 | Save-result condition rider, Basic-save damage, Native condition, Healing / recipient mode, Incarnate arrival/departure |
| Call Fluxwraith | P6 / P6-015 | Condition-dependent lifetime, Turn trigger or boundary, Save-result condition rider, Native condition, Incarnate arrival/departure, Information / adjudication |
| Conquering Soldiers | P6 / P6-016 | Save-result condition rider, Native condition, Healing / recipient mode, Incarnate arrival/departure, Modifier / resistance |
| Final Fate of the Locust Host | P6 / P6-017 | Save-result condition rider, Basic-save damage, Persistent damage, Granted movement speed, Native condition, Incarnate arrival/departure |
| Garden of the Green Man's Growth | P6 / P6-018 | Save-result condition rider, Basic-save damage, Native condition, Incarnate arrival/departure, Terrain, Forced movement |
| Incarnate Ancient Specter | P6 / P6-019 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Incarnate arrival/departure |
| Incarnate Archmage | P6 / P6-020 | Native condition, Choice / casting variant, Incarnate arrival/departure |
| Incarnate Draconic Legion | P6 / P6-021 | Basic-save damage, Choice / casting variant, Incarnate arrival/departure |
| Incarnate Faerie Revelers | P6 / P6-022 | Save-result condition rider, Native condition, Incarnate arrival/departure |
| Incarnate Shadow Minuet | P6 / P6-023 | Area exposure, Save-result condition rider, Native condition, Incarnate arrival/departure |
| Incarnate Skeletal Giant | P6 / P6-024 | Save-result condition rider, Basic-save damage, Native condition, Incarnate arrival/departure |
| Incarnate Tempest of Shades | P6 / P6-025 | Condition-dependent lifetime, Save-result condition rider, Native condition, Incarnate arrival/departure |
| Jassim's Allegiance | P6 / P6-026 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Incarnate arrival/departure |
| Summon Ancient Fleshforged | P6 / P6-027 | Save-result condition rider, Basic-save damage, Native condition, Attack and dependent result, Choice / casting variant, Incarnate arrival/departure |
| Summon Healing Servitor | P6 / P6-028 | Basic-save damage, Healing / recipient mode, Incarnate arrival/departure |
| Summon Stampede | P6 / P6-031 | Area exposure, Save-result condition rider, Basic-save damage, Native condition, Counteract, Incarnate arrival/departure |
| Summon Warden of the Wild | P6 / P6-032 | Temporary immunity, Save-result condition rider, Basic-save damage, Native condition, Incarnate arrival/departure, Terrain, Forced movement |
| Airburst | P7 / P7-001 | Turn trigger or boundary, Save-result condition rider, Forced movement, Modifier / resistance |
| Begone | P7 / P7-001 | Save-result condition rider, Forced movement |
| Gale Blast | P7 / P7-001 | Save-result condition rider, Forced movement |
| Geyser | P7 / P7-001 | Save-result condition rider, Forced movement |
| Glacial Skewer | P7 / P7-001 | Native condition, Attack and dependent result, Forced movement |
| Kinetic Ram | P7 / P7-001 | Save-result condition rider, Native condition, Forced movement |
| Pummeling Rubble | P7 / P7-001 | Save-result condition rider, Forced movement |
| Pushing Gust | P7 / P7-001 | Save-result condition rider, Native condition, Forced movement |
| Qi Blast | P7 / P7-001 | Save-result condition rider, Forced movement |
| Repelling Pulse | P7 / P7-001 | Save-result condition rider, Native condition, Forced movement |
| Tornadic Gale | P7 / P7-001 | Save-result condition rider, Native condition, Forced movement |
| Unbreaking Wave Advance | P7 / P7-001 | Save-result condition rider, Forced movement |
| Buffeting Winds | P7 / P7-002 | Save-result condition rider, Basic-save damage, Forced movement |
| Gravitational Pull | P7 / P7-002 | Save-result condition rider, Native condition, Forced movement |
| Hydraulic Torrent | P7 / P7-002 | Save-result condition rider, Basic-save damage, Forced movement |
| Psychic Outburst | P7 / P7-002 | Save-result condition rider, Basic-save damage, Forced movement |
| Door to Beyond | P7 / P7-003 | Recurring saving throw, Turn trigger or boundary, Area exposure, Ending or dismissal, Save-result condition rider, Forced movement |
| Inevitable Destination | P7 / P7-003 | Turn trigger or boundary, Ending or dismissal, Save-result condition rider, Native condition, Forced movement, Modifier / resistance |
| Retrieving Hook | P7 / P7-003 | Save-result condition rider, Native condition, Forced movement |
| Shadow Strike | P7 / P7-003 | Attack and dependent result, Forced movement |
| Undertow | P7 / P7-003 | Area exposure, Save-result condition rider, Forced movement, Modifier / resistance |
| Blastback | P7 / P7-004 | Forced movement |
| Elemental Annihilation Wave | P7 / P7-004 | Save-result condition rider, Basic-save damage, Native condition, Forced movement |
| Heaving Earth | P7 / P7-004 | Basic-save damage, Native condition, Forced movement |
| Unfolding Wind Buffet | P7 / P7-004 | Save-result condition rider, Native condition, Forced movement |
| Gust of Wind | P7 / P7-005 | Area exposure, Save-result condition rider, Native condition, Forced movement |
| Hydraulic Push | P7 / P7-005 | Attack and dependent result, Forced movement |
| Unseasonable Squall | P7 / P7-005 | Area exposure, Save-result condition rider, Native condition, Forced movement |
| Turbulent Tide | P7 / P7-006 | Save-result condition rider, Attack and dependent result, Forced movement, Movement action |
| Arcane Explosion | P7 / P7-007 | Area exposure, Basic-save damage, Native condition, Forced movement, Modifier / resistance |
| Blessed Boundary | P7 / P7-008 | Turn trigger or boundary, Save-result condition rider, Forced movement |
| Boneshaker | P7 / P7-009 | Save-result condition rider, Native condition, Forced movement |
| Imaginary Weapon | P7 / P7-010 | Attack and dependent result, Forced movement |
| Life's Flowing River | P7 / P7-011 | Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Forced movement |
| Airlift | P7 / P7-012 | Movement action |
| Pyrefowl Rebuke | P7 / P7-012 | Turn trigger or boundary, Save-result condition rider, Basic-save damage, Native condition, Movement action |
| Agile Feet | P7 / P7-013 | Granted movement speed, Movement action, Modifier / resistance |
| Augmented Body | P7 / P7-013 | Ending or dismissal, Granted movement speed, Choice / casting variant, Movement action, Modifier / resistance |
| Blazing Dive | P7 / P7-014 | Basic-save damage, Movement action |
| Comet Charge | P7 / P7-014 | Persistent damage, Native condition, Attack and dependent result, Choice / casting variant, Movement action, Modifier / resistance |
| Flashy Disappearance | P7 / P7-015 | Movement action, Modifier / resistance |
| Flowing Strike | P7 / P7-015 | Attack and dependent result, Movement action |
| Agitate | P7 / P7-016 | Turn trigger or boundary, Save-result condition rider, Movement action |
| Earth and Sky | P7 / P7-019 | Ending or dismissal, Save-result condition rider, Movement action |
| Earthbreaker Stride | P7 / P7-020 | Ending or dismissal, Granted movement speed, Movement action |
| Forceful Hand | P7 / P7-021 | Sustain, Turn trigger or boundary, Basic-save damage, Attack and dependent result, Movement action, Modifier / resistance |
| Hippocampus Retreat | P7 / P7-022 | Attack and dependent result, Movement action, Modifier / resistance |
| Inside Ropes | P7 / P7-023 | Save-result condition rider, Movement action, Modifier / resistance |
| Loose Time's Arrow | P7 / P7-024 | Native condition, Movement action |
| Mirror's Misfortune | P7 / P7-026 | Ending or dismissal, Save-result condition rider, Movement action |
| Steel Fortifications | P7 / P7-028 | Persistent damage, Native condition, Movement action |
| Stormwind Flight | P7 / P7-029 | Movement action |
| The Four Hunters | P7 / P7-031 | Granted movement speed, Movement action, Modifier / resistance |
| Time Jump | P7 / P7-032 | Native condition, Movement action |
| Unbreaking Wave Vapor | P7 / P7-033 | Movement action, Modifier / resistance |
| Collective Transposition | P7 / P7-041 | Teleportation |
| Sudden Transposition | P7 / P7-041 | Save-result condition rider, Native condition, Teleportation |
| Warping Pull | P7 / P7-041 | Teleportation, Modifier / resistance |
| Momentary Recovery | P7 / P7-042 | Turn trigger or boundary, Native condition, Incarnate arrival/departure, Teleportation |
| Echo Jump | P7 / P7-043 | Teleportation |
| Rapid Retreat | P7 / P7-043 | Area exposure, Teleportation, Modifier / resistance |
| Disruptive Transfer | P7 / P7-045 | Native condition, Teleportation |
| Dimensional Drop | P7 / P7-050 | Save-result condition rider |
| Dimensional Excision | P7 / P7-051 | Persistent damage, Modifier / resistance |
| Dive and Breach | P7 / P7-052 | Area exposure, Movement action |
| Flicker | P7 / P7-057 | Sustain, Turn trigger or boundary, Teleportation, Modifier / resistance |
| Forest of Gates | P7 / P7-058 | Save-result condition rider, Native condition, Healing / recipient mode, Choice / casting variant, Incarnate arrival/departure |
| Infiltrator's Tunnel | P7 / P7-060 | Teleportation |
| Maze of Locked Doors | P7 / P7-064 | Save-result condition rider, Counteract, Teleportation |
| Proximal Shift | P7 / P7-065 | Basic-save damage, Native condition, Teleportation, Terrain |
| Trade Items | P7 / P7-071 | Modifier / resistance |
| Unexpected Transposition | P7 / P7-073 | Temporary immunity |
| Cave Fangs | P7 / P7-074 | Ending or dismissal, Basic-save damage, Terrain |
| Coral Eruption | P7 / P7-074 | Area exposure, Save-result condition rider, Basic-save damage, Persistent damage, Terrain |
| Elemental Breath | P7 / P7-074 | Save-result condition rider, Basic-save damage, Native condition, Choice / casting variant, Terrain, Forced movement |
| Mushroom Patch | P7 / P7-074 | Save-result condition rider, Native condition, Terrain |
| Scatter Scree | P7 / P7-074 | Basic-save damage, Terrain |
| Trim the Blight | P7 / P7-074 | Save-result condition rider, Native condition, Terrain |
| Untwisting Iron Roots | P7 / P7-074 | Basic-save damage, Native condition, Terrain |
| Corrosive Muck | P7 / P7-075 | Area exposure, Save-result condition rider, Basic-save damage, Persistent damage, Terrain |
| Entangling Flora | P7 / P7-075 | Area exposure, Save-result condition rider, Native condition, Terrain, Modifier / resistance |
| Horizon's Veil | P7 / P7-075 | Area exposure, Ending or dismissal, Native condition, Terrain, Modifier / resistance |
| Morass of Ages | P7 / P7-075 | Sustain, Area exposure, Save-result condition rider, Native condition, Terrain |
| Oneiric Mire | P7 / P7-075 | Recurring saving throw, Area exposure, Save-result condition rider, Native condition, Terrain, Modifier / resistance |
| Rime Slick | P7 / P7-075 | Save-result condition rider, Basic-save damage, Native condition, Terrain |
| Sea of Thought | P7 / P7-075 | Area exposure, Save-result condition rider, Native condition, Terrain, Modifier / resistance |
| Storm Lord | P7 / P7-075 | Sustain, Area exposure, Basic-save damage, Native condition, Terrain, Modifier / resistance |
| Swampcall | P7 / P7-075 | Turn trigger or boundary, Save-result condition rider, Native condition, Terrain, Modifier / resistance |
| Web | P7 / P7-075 | Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Terrain, Modifier / resistance |
| Flame Vortex | P7 / P7-076 | Sustain, Area exposure, Basic-save damage, Terrain |
| Ice Storm | P7 / P7-076 | Turn trigger or boundary, Area exposure, Basic-save damage, Terrain |
| Rouse Skeletons | P7 / P7-076 | Sustain, Basic-save damage, Terrain |
| Storm of Vengeance | P7 / P7-076 | Sustain, Temporary immunity, Basic-save damage, Native condition, Choice / casting variant, Terrain, Modifier / resistance |
| Tear the Veil | P7 / P7-076 | Sustain, Area exposure, Save-result condition rider, Native condition, Terrain, Forced movement |
| Wrathful Storm | P7 / P7-076 | Sustain, Basic-save damage, Choice / casting variant, Terrain, Modifier / resistance |
| Conjured Clockwork | P7 / P7-077 | Sustain, Area exposure, Basic-save damage, Terrain |
| Etheric Shards | P7 / P7-077 | Basic-save damage, Terrain |
| Rose's Thorns | P7 / P7-077 | Sustain, Area exposure, Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Terrain |
| Weapon Tide | P7 / P7-077 | Area exposure, Basic-save damage, Terrain |
| Wildfire | P7 / P7-077 | Sustain, Area exposure, Persistent damage, Terrain |
| Bramble Bush | P7 / P7-078 | Turn trigger or boundary, Area exposure, Basic-save damage, Terrain |
| Howling Blizzard | P7 / P7-078 | Turn trigger or boundary, Basic-save damage, Terrain |
| Planar Collision | P7 / P7-078 | Area exposure, Save-result condition rider, Basic-save damage, Choice / casting variant, Terrain, Forced movement |
| Swamp of Sloth | P7 / P7-078 | Area exposure, Basic-save damage, Terrain |
| Whirlpool | P7 / P7-079 | Sustain, Area exposure, Save-result condition rider, Terrain |
| Whirlwind | P7 / P7-079 | Sustain, Area exposure, Ending or dismissal, Save-result condition rider, Granted movement speed, Terrain |
| Zombie Horde | P7 / P7-079 | Sustain, Turn trigger or boundary, Area exposure, Ending or dismissal, Basic-save damage, Terrain |
| Undertaker | P7 / P7-080 | Turn trigger or boundary, Save-result condition rider, Native condition, Terrain, Modifier / resistance |
| Antlion Trap | P7 / P7-082 | Area exposure, Save-result condition rider, Native condition, Terrain |
| Crystallized Vapors | P7 / P7-084 | Sustain, Attack and dependent result, Terrain |
| Cyclone Rondo | P7 / P7-085 | Sustain, Area exposure, Basic-save damage, Native condition, Terrain |
| Earthquake | P7 / P7-086 | Turn trigger or boundary, Save-result condition rider, Basic-save damage, Native condition, Terrain, Modifier / resistance |
| Elemental Confluence | P7 / P7-087 | Sustain, Save-result condition rider, Basic-save damage, Persistent damage, Attack and dependent result, Terrain, Modifier / resistance |
| Elemental Gift | P7 / P7-088 | Turn trigger or boundary, Persistent damage, Granted movement speed, Native condition, Choice / casting variant, Terrain, Modifier / resistance |
| Field of Razors | P7 / P7-089 | Ending or dismissal, Persistent damage, Terrain |
| Garden of Stone | P7 / P7-090 | Basic-save damage, Terrain |
| Gluttonous Growth | P7 / P7-091 | Sustain, Turn trigger or boundary, Save-result condition rider, Native condition, Terrain |
| Heart's Desire | P7 / P7-092 | Save-result condition rider, Native condition, Terrain, Modifier / resistance |
| Helpful Wood Spirits | P7 / P7-093 | Sustain, Native condition, Choice / casting variant, Terrain, Information / adjudication |
| Iron Rain | P7 / P7-094 | Persistent damage, Terrain |
| Magnetic Repulsion | P7 / P7-095 | Native condition, Terrain, Modifier / resistance |
| Pierce the Sky | P7 / P7-096 | Area exposure, Save-result condition rider, Native condition, Attack and dependent result, Terrain |
| Rainbow Fumarole | P7 / P7-098 | Area exposure, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Terrain |
| Ranage's Circle | P7 / P7-099 | Area exposure, Save-result condition rider, Native condition, Terrain |
| Repulsion | P7 / P7-100 | Aura membership, Area exposure, Terrain |
| River Carving Mountains | P7 / P7-101 | Sustain, Turn trigger or boundary, Granted movement speed, Terrain, Movement action, Modifier / resistance |
| Sawtooth Terrain | P7 / P7-102 | Area exposure, Save-result condition rider, Persistent damage, Healing / recipient mode, Terrain, Modifier / resistance |
| Shifting Sand | P7 / P7-103 | Sustain, Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Terrain, Modifier / resistance |
| Shipwreck | P7 / P7-104 | Save-result condition rider, Terrain |
| Strange Geometry | P7 / P7-106 | Area exposure, Terrain |
| Tanglecurse | P7 / P7-108 | Area exposure, Save-result condition rider, Native condition, Terrain |
| Telekinetic Bombardment | P7 / P7-109 | Save-result condition rider, Native condition, Terrain |
| Transmute Rock And Mud | P7 / P7-110 | Save-result condition rider, Basic-save damage, Native condition, Choice / casting variant, Terrain, Movement action |
| Unbreaking Wave Barrier | P7 / P7-111 | Sustain, Area exposure, Save-result condition rider, Native condition, Terrain, Forced movement, Modifier / resistance |
| Upheaval | P7 / P7-112 | Save-result condition rider, Native condition, Terrain |
| Volcanic Eruption | P7 / P7-114 | Save-result condition rider, Native condition, Terrain, Modifier / resistance |
| Wall of Ice | P7 / P7-115 | Wall / barrier, Modifier / resistance |
| Wall of Radiance | P7 / P7-115 | Basic-save damage, Native condition, Wall / barrier |
| Blade Barrier | P7 / P7-116 | Area exposure, Save-result condition rider, Basic-save damage, Wall / barrier |
| Chromatic Wall | P7 / P7-116 | Save-result condition rider, Native condition, Counteract, Wall / barrier, Information / adjudication, Modifier / resistance |
| Prismatic Wall | P7 / P7-119 | Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Counteract, Wall / barrier |
| Sea Surge | P7 / P7-120 | Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Wall / barrier, Forced movement |
| Wall of Flesh | P7 / P7-121 | Area exposure, Save-result condition rider, Native condition, Healing / recipient mode, Attack and dependent result, Choice / casting variant, Wall / barrier, Modifier / resistance |
| Wall of Wind | P7 / P7-122 | Save-result condition rider, Wall / barrier, Forced movement, Modifier / resistance |
| Inveigle | P8 / P8-002 | Save-result condition rider, Native condition, Modifier / resistance |
| Oblivious Expulsion | P8 / P8-002 | Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Information / adjudication |
| Unbearable Cacophony | P8 / P8-003 | Save-result condition rider, Basic-save damage, Modifier / resistance |
| Void Harvest | P8 / P8-003 | Sustain, Area exposure, Save-result condition rider, Native condition, Modifier / resistance |
| Fortifying Brew | P8 / P8-004 | Save-result condition rider, Native condition, Counteract, Delegated affliction, Modifier / resistance |
| Winter's Breath | P8 / P8-004 | Save-result condition rider, Native condition, Modifier / resistance |
| Astral Projection | P8 / P8-005 | Save-result condition rider, Native condition, Modifier / resistance |
| Awaken Portal | P8 / P8-007 | Save-result condition rider, Native condition |
| Call Spirit | P8 / P8-009 | Save-result condition rider, Modifier / resistance |
| Freedom | P8 / P8-011 | Save-result condition rider, Native condition, Modifier / resistance |
| Garden of Death | P8 / P8-012 | Save-result condition rider, Modifier / resistance |
| Geas | P8 / P8-013 | Save-result condition rider, Native condition, Counteract, Delegated affliction, Modifier / resistance |
| Imprisonment | P8 / P8-014 | Save-result condition rider, Modifier / resistance |
| Labyrinthine Prison | P8 / P8-015 | Area exposure, Save-result condition rider, Native condition |
| Mosquito Blight | P8 / P8-019 | Area exposure, Save-result condition rider, Native condition, Delegated affliction, Modifier / resistance |
| Oil-Slicked Walls | P8 / P8-020 | Save-result condition rider, Native condition |
| Perfection of Essence | P8 / P8-021 | Save-result condition rider, Native condition, Delegated affliction |
| Plague Shot | P8 / P8-022 | Area exposure, Save-result condition rider, Native condition, Delegated affliction |
| Portrait of Spite | P8 / P8-023 | Save-result condition rider, Native condition, Delegated affliction |
| Purify Tanglebriar | P8 / P8-024 | Save-result condition rider, Terrain, Information / adjudication, Modifier / resistance |
| Raga of Remembrance | P8 / P8-025 | Condition-dependent lifetime, Area exposure, Save-result condition rider, Native condition, Modifier / resistance |
| Reinforced Rations | P8 / P8-026 | Sustain, Save-result condition rider, Native condition |
| Rest Eternal | P8 / P8-027 | Save-result condition rider, Native condition, Counteract, Information / adjudication |
| Rite of Cleansing Flame | P8 / P8-028 | Save-result condition rider, Native condition, Modifier / resistance |
| Rite of the Red Star | P8 / P8-029 | Area exposure, Save-result condition rider, Native condition |
| Rune Trap | P8 / P8-030 | Area exposure, Save-result condition rider, Modifier / resistance |
| Sleepless Season | P8 / P8-033 | Save-result condition rider, Native condition, Delegated affliction |
| Sweetest Solstice | P8 / P8-034 | Save-result condition rider, Native condition, Modifier / resistance |
| Terminate Bloodline | P8 / P8-036 | Recurring saving throw, Save-result condition rider, Native condition, Counteract, Delegated affliction |
| Transmigrate | P8 / P8-037 | Area exposure, Save-result condition rider, Modifier / resistance |
| Wild Feast | P8 / P8-038 | Save-result condition rider, Modifier / resistance |

