# Phase 4: Immediate resolution and choices

240 primary worklist entries; 981 entries with this phase signal including cross-phase dependencies. Assignments are planning candidates, not verified semantic classifications.

Descriptions are grouped first by rule family, then by normalized word/bigram similarity. Each cohort has at most 12 entries. Similarity is a discovery aid; check the full source and differing values/branches before sharing implementation or evidence.

## Rule-family index

| Rule family | Spells | Not enabled | Wording cohorts |
| --- | --- | --- | --- |
| Attack and dependent result | 96 | 4 | 44 |
| Choice / casting variant | 20 | 2 | 19 |
| Counteract | 22 | 0 | 12 |
| Information / adjudication | 32 | 0 | 27 |
| Healing / recipient mode | 60 | 5 | 30 |
| immediate-other | 7 | 0 | 7 |
| Granted movement speed | 3 | 0 | 3 |


## P4-001 — Attack and dependent result: Blazing Blade

**2 spells; 1 not enabled.** Suggested source-reading anchor: Blazing Blade. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** When you do, make a spell attack roll.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Blazing Blade](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/blazing-blade.json) | 2 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Deity's Strike](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/deitys-strike.json) | 7 | Not enabled | 2 | 0.38 | reflex; basic; duration outcome/text; target 1 creature (see text) |


## P4-002 — Attack and dependent result: Ray of Corruption

**2 spells; 1 not enabled.** Suggested source-reading anchor: Ray of Corruption. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Basic-save damage, Attack and dependent result

**Anchor wording:** Make a spell attack against the target.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ray of Corruption](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/ray-of-corruption.json) | 7 | Not enabled | 2, 3 | 1.00 | fortitude; basic; duration outcome/text; target one creature or object |
| [Disintegrate](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/disintegrate.json) | 6 | Enabled route | 2 | 0.31 | fortitude; basic; duration outcome/text; target 1 creature, unattended object, or force construct |


## P4-003 — Attack and dependent result: Touch of Death

**1 spells; 1 not enabled.** Suggested source-reading anchor: Touch of Death. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Temporary immunity, Save-result condition rider, Native condition, Attack and dependent result

**Anchor wording:** ake a melee unarmed Strike.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Touch of Death](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/touch-of-death.json) | 8 | Not enabled | 2, 3 | 1.00 | fortitude; non-basic/no save; duration 1 month; target source/area/text |


## P4-004 — Attack and dependent result: Weapon of Judgment

**1 spells; 1 not enabled.** Suggested source-reading anchor: Weapon of Judgment. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Turn trigger or boundary, Attack and dependent result, Choice / casting variant

**Anchor wording:** Strikes with the weapon are melee weapon attacks, but they use your spell attack modifier.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Weapon of Judgment](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/weapon-of-judgment.json) | 9 | Not enabled | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |


## P4-005 — Attack and dependent result: Ray of Frost

**12 spells; 0 not enabled.** Suggested source-reading anchor: Ray of Frost. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** Make a spell attack roll.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ray of Frost](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/ray-of-frost.json) | 1 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Snowball](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/snowball.json) | 1 | Enabled route | 2 | 0.60 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Purifying Icicle](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/purifying-icicle.json) | 1 | Enabled route | 2 | 0.48 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Threefold Limb](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/threefold-limb.json) | 1 | Enabled route | 2, 3 | 0.40 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Warshard Shot](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/warshard-shot.json) | 5 | Enabled route | 2, 3 | 0.33 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Moonbeam](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/moonbeam.json) | 1 | Enabled route | 2, 3 | 0.30 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Elemental Toss](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/elemental-toss.json) | 1 | Enabled route | 2 | 0.23 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Murder of Crows](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/murder-of-crows.json) | 2 | Enabled route | 2, 3 | 0.22 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Acid Splash](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/acid-splash.json) | 1 | Enabled route | 2, 3 | 0.19 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Live Wire](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/live-wire.json) | 1 | Enabled route | 2, 3 | 0.19 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Flense](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/flense.json) | 1 | Enabled route | 2, 3 | 0.18 | no primary save; non-basic/no save; duration outcome/text; target 1 creature or corpse |
| [Blinding Foam](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/blinding-foam.json) | 5 | Enabled route | 2, 3 | 0.18 | no primary save; non-basic/no save; duration 1 minute; target 1 creature |


## P4-006 — Attack and dependent result: Sticky Fire

**12 spells; 0 not enabled.** Suggested source-reading anchor: Sticky Fire. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** Make a spell attack roll against the target's AC, dealing 1d8 fire damage and 1d8 persistent fire damage on a hit.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sticky Fire](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/sticky-fire.json) | 2 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Widow’s Bite](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/widows-bite.json) | 3 | Enabled route | 2, 3 | 0.34 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Scorching Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/scorching-blast.json) | 1 | Enabled route | 2, 3 | 0.27 | no primary save; non-basic/no save; duration until the end of your turn; target source/area/text |
| [Spiked Carapace](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/spiked-carapace.json) | 5 | Enabled route | 2, 3 | 0.26 | no primary save; non-basic/no save; duration 1 round; target 1 creature |
| [Withering Grasp](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/withering-grasp.json) | 1 | Enabled route | 2, 3 | 0.22 | no primary save; non-basic/no save; duration outcome/text; target 1 creature or object |
| [Hurtling Stone](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/hurtling-stone.json) | 1 | Enabled route | 2 | 0.21 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Glutton's Jaws](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/gluttons-jaws.json) | 1 | Enabled route | 2, 3 | 0.19 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Gouging Claw](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/gouging-claw.json) | 1 | Enabled route | 3 | 0.19 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Acid Arrow](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/acid-arrow.json) | 2 | Enabled route | 2, 3 | 0.17 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Shocking Grasp](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/shocking-grasp.json) | 1 | Enabled route | 2, 3 | 0.17 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Soul Cutter](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/soul-cutter.json) | 3 | Enabled route | 2 | 0.16 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Inkshot](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/inkshot.json) | 1 | Enabled route | 2, 3 | 0.15 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-007 — Attack and dependent result: Telekinetic Projectile

**12 spells; 0 not enabled.** Suggested source-reading anchor: Telekinetic Projectile. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** Make a spell attack roll against the target.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Telekinetic Projectile](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/telekinetic-projectile.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Boomerang Shot](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/boomerang-shot.json) | 5 | Enabled route | 2 | 0.84 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Admonishing Ray](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/admonishing-ray.json) | 1 | Enabled route | 2 | 0.79 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Sun Blade](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/sun-blade.json) | 2 | Enabled route | 2 | 0.79 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Flurry of Claws](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/flurry-of-claws.json) | 1 | Enabled route | 2 | 0.73 | no primary save; non-basic/no save; duration outcome/text; target 2 creatures no more than 10 feet from each other |
| [Polar Ray](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/polar-ray.json) | 8 | Enabled route | 2 | 0.67 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Blazing Bolt](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/blazing-bolt.json) | 2 | Enabled route | — | 0.64 | no primary save; non-basic/no save; duration outcome/text; target 1 or more creatures |
| [Slashing Gust](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/slashing-gust.json) | 1 | Enabled route | 2, 3 | 0.47 | no primary save; non-basic/no save; duration outcome/text; target 1 or 2 creatures |
| [Ignition](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/ignition.json) | 1 | Enabled route | 2, 3 | 0.46 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Percussive Impact](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/percussive-impact.json) | 3 | Enabled route | 2, 3 | 0.45 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Divine Lance](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/divine-lance.json) | 1 | Enabled route | 2 | 0.40 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Tangle Vine](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/tangle-vine.json) | 1 | Enabled route | 2, 3 | 0.40 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-008 — Attack and dependent result: Fulminating Impact

**8 spells; 0 not enabled.** Suggested source-reading anchor: Fulminating Impact. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** Make a melee Strike.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fulminating Impact](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/fulminating-impact.json) | 4 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Shielding Strike](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/shielding-strike.json) | 1 | Enabled route | — | 0.80 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Spinning Staff](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/spinning-staff.json) | 1 | Enabled route | — | 0.35 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Pulverizing Wake](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/pulverizing-wake.json) | 5 | Enabled route | 2 | 0.29 | fortitude; basic; duration outcome/text; target 1 creature within reach |
| [Thunderous Strike](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/thunderous-strike.json) | 1 | Enabled route | 2 | 0.27 | fortitude; basic; duration outcome/text; target source/area/text |
| [Force Fling](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/force-fling.json) | 1 | Enabled route | 2 | 0.26 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Warding Aggression](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/warding-aggression.json) | 3 | Enabled route | 2, 3 | 0.23 | no primary save; non-basic/no save; duration up to 1 minute; target source/area/text |
| [Tentacular Innervation](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/tentacular-innervation.json) | 6 | Enabled route | 2, 3 | 0.21 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-009 — Attack and dependent result: Propelling Air Stream

**4 spells; 0 not enabled.** Suggested source-reading anchor: Propelling Air Stream. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** Make a ranged spell attack against a target's AC.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Propelling Air Stream](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/propelling-air-stream.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target 1 creature |
| [Briny Bolt](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/briny-bolt.json) | 1 | Enabled route | 2, 3 | 0.19 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Horizon Thunder Sphere](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/horizon-thunder-sphere.json) | 1 | Enabled route | 2 | 0.18 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Brine Dragon Bile](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/brine-dragon-bile.json) | 2 | Enabled route | 2, 3 | 0.17 | no primary save; non-basic/no save; duration outcome/text; target the creature that took damage |


## P4-010 — Attack and dependent result: Moonlight Ray

**3 spells; 0 not enabled.** Suggested source-reading anchor: Moonlight Ray. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result, Counteract

**Anchor wording:** Make a ranged spell attack.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Moonlight Ray](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/moonlight-ray.json) | 3 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Holy Light](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/holy-light.json) | 3 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Chilling Darkness](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/chilling-darkness.json) | 3 | Enabled route | 2 | 0.68 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-011 — Attack and dependent result: Splinter Volley

**3 spells; 0 not enabled.** Suggested source-reading anchor: Splinter Volley. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Persistent damage, Attack and dependent result

**Anchor wording:** Make a spell attack roll against a single creature.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Splinter Volley](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/splinter-volley.json) | 2 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 or 2 creatures |
| [Blood Feast](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/blood-feast.json) | 5 | Enabled route | 2, 3 | 0.24 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Needle Darts](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/needle-darts.json) | 1 | Enabled route | 2, 3 | 0.24 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-012 — Attack and dependent result: Ancestral Memories

**2 spells; 0 not enabled.** Suggested source-reading anchor: Ancestral Memories. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Turn trigger or boundary, Attack and dependent result, Modifier / resistance

**Anchor wording:** You gain either a +1 status bonus to the next spell attack roll you attempt before the end of your turn or an enemy within 60 feet takes a –1 status penalty to the next saving throw they attempt against a spell you cast before the end of your turn..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ancestral Memories](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/ancestral-memories.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Vindicator's Judgment](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/vindicators-judgment.json) | 5 | Enabled route | 2, 3 | 0.15 | fortitude; non-basic/no save; duration 1 minute; target your hunted prey |


## P4-013 — Attack and dependent result: Magnetic Acceleration

**2 spells; 0 not enabled.** Suggested source-reading anchor: Magnetic Acceleration. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** Make a ranged spell attack roll; if the target is wearing metal armor or is made of metal, you gain a +1 circumstance bonus to your attack roll with magnetic acceleration .

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Magnetic Acceleration](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/magnetic-acceleration.json) | 3 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature or object |
| [Phase Bolt](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/phase-bolt.json) | 1 | Enabled route | 2 | 0.15 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-014 — Attack and dependent result: Telekinetic Maneuver

**2 spells; 0 not enabled.** Suggested source-reading anchor: Telekinetic Maneuver. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** You can attempt to Disarm, Shove, Reposition, or Trip the target using a spell attack roll instead of an Athletics check..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Telekinetic Maneuver](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/telekinetic-maneuver.json) | 2 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Magnetic Attraction](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/magnetic-attraction.json) | 2 | Note only (resolved) | — | 0.28 | no primary save; non-basic/no save; duration outcome/text; target up to 10 metal objects with a total Bulk of 1 or less |


## P4-015 — Attack and dependent result: Aqueous Blast

**1 spells; 0 not enabled.** Suggested source-reading anchor: Aqueous Blast. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Native condition, Attack and dependent result

**Anchor wording:** When you do so, attempt a ranged spell attack roll.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Aqueous Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/aqueous-blast.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration until the end of your turn; target source/area/text |


## P4-016 — Attack and dependent result: Barbed Spear

**1 spells; 0 not enabled.** Suggested source-reading anchor: Barbed Spear. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Native condition, Attack and dependent result

**Anchor wording:** Make a ranged spell attack roll, dealing 1d8 piercing damage on a success and double damage on a critical success.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Barbed Spear](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/barbed-spear.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration varies; target 1 creature |


## P4-017 — Attack and dependent result: Belittling Boast

**1 spells; 0 not enabled.** Suggested source-reading anchor: Belittling Boast. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Native condition, Attack and dependent result, Modifier / resistance

**Anchor wording:** Select one of the following to boast about: melee attack rolls, ranged attack rolls, spell attack rolls, or a single skill.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Belittling Boast](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/belittling-boast.json) | 5 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-018 — Attack and dependent result: Blazing Armory

**1 spells; 0 not enabled.** Suggested source-reading anchor: Blazing Armory. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result, Choice / casting variant

**Anchor wording:** Any creature other than you or the target that attempts to touch, make a Strike with, or Disarm the weapon takes 1d6[fire] damage each time..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Blazing Armory](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/blazing-armory.json) | 2 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 5 minutes; target 1 willing creature |


## P4-019 — Attack and dependent result: Bonewall Bulwark

**1 spells; 0 not enabled.** Suggested source-reading anchor: Bonewall Bulwark. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Turn trigger or boundary, Attack and dependent result

**Anchor wording:** At the beginning of your turn, you may have the limbs attack a single creature you're aware of within 5 feet of the wall using your spell attack modifier and dealing 3d10 bludgeoning damage.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Bonewall Bulwark](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/bonewall-bulwark.json) | 3 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-020 — Attack and dependent result: Booming Blast

**1 spells; 0 not enabled.** Suggested source-reading anchor: Booming Blast. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Save-result condition rider, Native condition, Attack and dependent result

**Anchor wording:** Make a ranged firearm Strike.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Booming Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/booming-blast.json) | 1 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-021 — Attack and dependent result: Bottle the Storm

**1 spells; 0 not enabled.** Suggested source-reading anchor: Bottle the Storm. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result, Modifier / resistance

**Anchor wording:** If you successfully prevent damage in this way, at any time during the spell's duration, you can spend a single action, which has the attack trait, to expend the charge and make a spell attack against the AC of a target within 60 feet.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Bottle the Storm](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/bottle-the-storm.json) | 4 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-022 — Attack and dependent result: Charged Javelin

**1 spells; 0 not enabled.** Suggested source-reading anchor: Charged Javelin. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Persistent damage, Attack and dependent result, Modifier / resistance

**Anchor wording:** Make a spell attack against the target's AC.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Charged Javelin](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/charged-javelin.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-023 — Attack and dependent result: Companion's Shadow

**1 spells; 0 not enabled.** Suggested source-reading anchor: Companion's Shadow. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** The first time your companion Strikes each round, their shadow can also make an unarmed Strike against a different creature within range using the same multiple attack penalty as the original attack.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Companion's Shadow](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/companions-shadow.json) | 3 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target your companion |


## P4-024 — Attack and dependent result: Draw Blood

**1 spells; 0 not enabled.** Suggested source-reading anchor: Draw Blood. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Persistent damage, Healing / recipient mode, Attack and dependent result

**Anchor wording:** Make a melee spell attack against a target.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Draw Blood](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/draw-blood.json) | 2 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 living creature |


## P4-025 — Attack and dependent result: Elemental Counter

**1 spells; 0 not enabled.** Suggested source-reading anchor: Elemental Counter. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result, Counteract

**Anchor wording:** rigger You or a creature within 60 feet rolls a saving throw against a spell with the earth, fire, metal, plant, water, or wood trait, or are targeted by a spell attack with such a trait..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Elemental Counter](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/elemental-counter.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-026 — Attack and dependent result: Establish Ward

**1 spells; 0 not enabled.** Suggested source-reading anchor: Establish Ward. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Native condition, Attack and dependent result

**Anchor wording:** These are melee Strikes that use your spell attack modifier, can target any creature within the ward, and deal 3d8 bludgeoning, piercing, or slashing damage..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Establish Ward](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/establish-ward.json) | 5 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-027 — Attack and dependent result: Exploding Earth

**1 spells; 0 not enabled.** Suggested source-reading anchor: Exploding Earth. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Native condition, Attack and dependent result

**Anchor wording:** Attempt a spell attack against the target's AC.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Exploding Earth](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/exploding-earth.json) | 2 | Enabled route | 2 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |


## P4-028 — Attack and dependent result: Ghostly Carrier

**1 spells; 0 not enabled.** Suggested source-reading anchor: Ghostly Carrier. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** If the carrier must attempt a spell attack roll, it uses your normal bonuses.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ghostly Carrier](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/ghostly-carrier.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-029 — Attack and dependent result: Halcyon Infusion

**1 spells; 0 not enabled.** Suggested source-reading anchor: Halcyon Infusion. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result, Choice / casting variant

**Anchor wording:** If they are untrained in the appropriate magical tradition, their spell attack bonus is 2 + their level + their highest mental ability modifier, and their spell DC is 12 + their level + their highest mental ability modifier..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Halcyon Infusion](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/halcyon-infusion.json) | 6 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration until your next daily preparations; target one willing creature of lower level than you |


## P4-030 — Attack and dependent result: Hand of the Apprentice

**1 spells; 0 not enabled.** Suggested source-reading anchor: Hand of the Apprentice. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** You hurl a held melee weapon with which you are trained at the target, making a spell attack roll.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Hand of the Apprentice](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/hand-of-the-apprentice.json) | 1 | Partial Effect | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-031 — Attack and dependent result: Helpful Reload

**1 spells; 0 not enabled.** Suggested source-reading anchor: Helpful Reload. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result, Modifier / resistance

**Anchor wording:** rigger One of your allies makes a ranged Strike with a weapon with a reload of 1 or less.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Helpful Reload](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/helpful-reload.json) | 2 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target the triggering creature |


## P4-032 — Attack and dependent result: Inner Upheaval

**1 spells; 0 not enabled.** Suggested source-reading anchor: Inner Upheaval. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result, Modifier / resistance

**Anchor wording:** Make an unarmed Strike or Flurry of Blows (this doesn't change the limit on using only one flourish per turn).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Inner Upheaval](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/inner-upheaval.json) | 1 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-033 — Attack and dependent result: Omnidirectional Scan

**1 spells; 0 not enabled.** Suggested source-reading anchor: Omnidirectional Scan. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Save-result condition rider, Attack and dependent result

**Anchor wording:** If you take this Aid reaction, you use your spell attack modifier and proficiency rank on your check to Aid.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Omnidirectional Scan](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/omnidirectional-scan.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration until the start of your next turn; target 1 ally and 1 enemy |


## P4-034 — Attack and dependent result: Shielded Arm

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shielded Arm. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result, Modifier / resistance

**Anchor wording:** This spell doesn't modify the target's unarmed attacks and can't be used to make a shield bash Strike.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shielded Arm](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/shielded-arm.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute or until expended; target 1 willing creature |


## P4-035 — Attack and dependent result: Shooting Star

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shooting Star. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Turn trigger or boundary, Attack and dependent result

**Anchor wording:** Make a ranged Strike, ignoring the target's Concealment and reducing the target's cover by one degree for only this Strike (greater to standard, standard to lesser, and lesser to none).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shooting Star](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/shooting-star.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-036 — Attack and dependent result: Sky Laughs at Waves

**1 spells; 0 not enabled.** Suggested source-reading anchor: Sky Laughs at Waves. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result

**Anchor wording:** Fly up to your Speed, then make a Strike with your sword against an adjacent creature at the end of your movement.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sky Laughs at Waves](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/sky-laughs-at-waves.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-037 — Attack and dependent result: Steal the Sky

**1 spells; 0 not enabled.** Suggested source-reading anchor: Steal the Sky. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Save-result condition rider, Native condition, Attack and dependent result

**Anchor wording:** rigger You make a successful unarmed Strike against a flying creature..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Steal the Sky](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/steal-the-sky.json) | 5 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target the creature you hit |


## P4-038 — Attack and dependent result: Thrall Charge

**1 spells; 0 not enabled.** Suggested source-reading anchor: Thrall Charge. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result, Modifier / resistance

**Anchor wording:** You command the target thrall to Stride and then make a Strike that deals an additional 1d6 damage.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Thrall Charge](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/thrall-charge.json) | 1 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 of your thralls |


## P4-039 — Attack and dependent result: Tracking Mayflies

**1 spells; 0 not enabled.** Suggested source-reading anchor: Tracking Mayflies. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Native condition, Attack and dependent result

**Anchor wording:** Make a ranged Strike.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Tracking Mayflies](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/tracking-mayflies.json) | 3 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-040 — Attack and dependent result: Victory Cry

**1 spells; 0 not enabled.** Suggested source-reading anchor: Victory Cry. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Attack and dependent result, Modifier / resistance

**Anchor wording:** The weapon used to make the Strike deals an additional 1d6 sonic damage (not doubled due to the critical hit), and the ally can immediately attempt to Shove the creature struck, even if the ally's hands are full.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Victory Cry](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/victory-cry.json) | 1 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target the triggering ally |


## P4-041 — Attack and dependent result: Vital Seed

**1 spells; 0 not enabled.** Suggested source-reading anchor: Vital Seed. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Basic-save damage, Attack and dependent result

**Anchor wording:** Make a ranged spell attack to embed a seed of energy into your target.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Vital Seed](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/vital-seed.json) | 4 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-042 — Attack and dependent result: Weaponize Secret

**1 spells; 0 not enabled.** Suggested source-reading anchor: Weaponize Secret. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Save-result condition rider, Persistent damage, Attack and dependent result

**Anchor wording:** If that creature attempts a Strike or spell attack against you while you hold their secret, you can discharge the rune as a reaction to deal 7d6[mental] damage to the creature..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Weaponize Secret](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/weaponize-secret.json) | 4 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration 1 minute or until discharged; target up to 3 creatures |


## P4-043 — Attack and dependent result: Wings of the Valkyrie

**1 spells; 0 not enabled.** Suggested source-reading anchor: Wings of the Valkyrie. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Granted movement speed, Attack and dependent result

**Anchor wording:** You can use these wings to attempt to Shove a creature; you don't need a free hand to do so, and you can roll using your spell attack modifier instead of your Athletics skill for the check.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wings of the Valkyrie](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/wings-of-the-valkyrie.json) | 3 | Partial Effect | 3 | 1.00 | no primary save; non-basic/no save; duration 3 rounds; target source/area/text |


## P4-044 — Attack and dependent result: Winter Bolt

**1 spells; 0 not enabled.** Suggested source-reading anchor: Winter Bolt. This is not a verified-test designation.

**Test contract:** Native attack/MAP; hit/critical/miss; conditional save sequencing; independent targets; locked completed steps.

**Shared signals:** Turn trigger or boundary, Attack and dependent result

**Anchor wording:** Make a spell attack against the target's AC.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Winter Bolt](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/winter-bolt.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-045 — Choice / casting variant: Shambling Horror

**1 spells; 1 not enabled.** Suggested source-reading anchor: Shambling Horror. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant, Information / adjudication

**Anchor wording:** Choose a skeleton or zombie stat block of the same size as the original creature and of a level no higher than the creature's original level.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shambling Horror](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/shambling-horror.json) | 6 | Not enabled | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target 1 corpse of a Gargantuan or smaller creature that has a level no greater than your level -4 and has died since the last sunrise |


## P4-046 — Choice / casting variant: Unrelenting Observation

**1 spells; 1 not enabled.** Suggested source-reading anchor: Unrelenting Observation. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** Choose one target creature or object in the area to be tracked.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unrelenting Observation](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/unrelenting-observation.json) | 8 | Not enabled | 3 | 1.00 | no primary save; non-basic/no save; duration varies; target 1 creature or object tracked and up to 5 other willing creatures |


## P4-047 — Choice / casting variant: Access Lore

**2 spells; 0 not enabled.** Suggested source-reading anchor: Access Lore. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** Choose one Lore skill.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Access Lore](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/access-lore.json) | 3 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Share Lore](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/share-lore.json) | 1 | Enabled route | 3 | 0.64 | no primary save; non-basic/no save; duration 10 minutes; target up to 3 creatures |


## P4-048 — Choice / casting variant: Clad In Metal

**1 spells; 0 not enabled.** Suggested source-reading anchor: Clad In Metal. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** You can instead choose an uncommon or rare metal if you have access to it or the GM has given you access to it..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Clad In Metal](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/clad-in-metal.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 metal object of 5 Bulk or less that's unattended or attended by a willing creature |


## P4-049 — Choice / casting variant: Claim Curse

**1 spells; 0 not enabled.** Suggested source-reading anchor: Claim Curse. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** Choose a curse affecting the target that you don't already have.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Claim Curse](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/claim-curse.json) | 3 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 5 minutes; target 1 creature affected by a curse |


## P4-050 — Choice / casting variant: Contingency

**1 spells; 0 not enabled.** Suggested source-reading anchor: Contingency. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** During the casting, choose a trigger under which the spell will be cast, using the same restrictions as for the trigger of a Ready action.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Contingency](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/contingency.json) | 7 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration until the next time you make your daily preparations; target source/area/text |


## P4-051 — Choice / casting variant: Crusade

**1 spells; 0 not enabled.** Suggested source-reading anchor: Crusade. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Turn trigger or boundary, Choice / casting variant

**Anchor wording:** They choose their own actions, but they favor direct action over inaction or indirect action..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Crusade](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/crusade.json) | 9 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target up to 4 creatures |


## P4-052 — Choice / casting variant: Elemental Sense

**1 spells; 0 not enabled.** Suggested source-reading anchor: Elemental Sense. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant, Information / adjudication

**Anchor wording:** Choose one of the options below.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Elemental Sense](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/elemental-sense.json) | 4 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P4-053 — Choice / casting variant: Embed Message

**1 spells; 0 not enabled.** Suggested source-reading anchor: Embed Message. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant, Information / adjudication

**Anchor wording:** You can choose a language you know for the text and speech, and can choose what the voice sounds like.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Embed Message](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/embed-message.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration unlimited; target 1 object or willing creature |


## P4-054 — Choice / casting variant: Engrave Memory

**1 spells; 0 not enabled.** Suggested source-reading anchor: Engrave Memory. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant, Information / adjudication

**Anchor wording:** When you Cast this Spell, choose a command word.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Engrave Memory](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/engrave-memory.json) | 5 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration unlimited; target 1 stone of at least 1 Bulk |


## P4-055 — Choice / casting variant: Force Barrage

**1 spells; 0 not enabled.** Suggested source-reading anchor: Force Barrage. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** You choose the target for each shard individually.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Force Barrage](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/force-barrage.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-056 — Choice / casting variant: Heroic Feat

**1 spells; 0 not enabled.** Suggested source-reading anchor: Heroic Feat. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** If you Cast this Spell using 2 actions, the granted action must be a single action, and if you Cast this Spell using 3 actions, you can instead choose a feat that grants a 2-action activity..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Heroic Feat](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/heroic-feat.json) | 6 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-057 — Choice / casting variant: Know the Way

**1 spells; 0 not enabled.** Suggested source-reading anchor: Know the Way. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant, Information / adjudication

**Anchor wording:** You immediately know which direction is north (if it exists at your current location), and you can choose a location you were at within the last 24 hours and learn what direction it lies..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Know the Way](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/know-the-way.json) | 1 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-058 — Choice / casting variant: Read Omens

**1 spells; 0 not enabled.** Suggested source-reading anchor: Read Omens. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant, Information / adjudication

**Anchor wording:** Choose a particular goal or activity you plan to engage in within 1 week, or an event you expect might happen within 1 week.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Read Omens](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/read-omens.json) | 4 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-059 — Choice / casting variant: Secret Page

**1 spells; 0 not enabled.** Suggested source-reading anchor: Secret Page. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** You must choose the replacement text and the password, if any, when you Cast the Spell..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Secret Page](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/secret-page.json) | 3 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration unlimited; target 1 page up to 3 square feet in size |


## P4-060 — Choice / casting variant: Transcribe Moment

**1 spells; 0 not enabled.** Suggested source-reading anchor: Transcribe Moment. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant, Information / adjudication

**Anchor wording:** If you Cast the Spell again while already at the maximum number of scrolls, choose one of the current scrolls to lose its magic, then create the new one..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Transcribe Moment](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/transcribe-moment.json) | 4 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-061 — Choice / casting variant: Translate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Translate. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** If the target can hear multiple languages and knows that, it can choose which language to understand; otherwise, choose one of the languages randomly..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Translate](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/translate.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target 1 creature |


## P4-062 — Choice / casting variant: Truespeech

**1 spells; 0 not enabled.** Suggested source-reading anchor: Truespeech. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** When in a mixed group of creatures, each time the target speaks, it can choose a creature and speak in a language that creature understands, even if the target doesn't know what language that is..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Truespeech](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/truespeech.json) | 5 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target 1 creature |


## P4-063 — Choice / casting variant: Wanderer's Guide

**1 spells; 0 not enabled.** Suggested source-reading anchor: Wanderer's Guide. This is not a verified-test designation.

**Test contract:** Every mutually exclusive option and action/rank variant; cancellation; legal recipients; no double resource spending.

**Shared signals:** Choice / casting variant

**Anchor wording:** When you Cast this Spell, choose a destination; you receive an inspired route to that destination, allowing you and allies who travel overland with you to reduce the movement penalty from difficult terrain by half for the duration, as long as you don't deviate from the inspired route.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wanderer's Guide](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/wanderers-guide.json) | 3 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration until your next daily preparations; target source/area/text |


## P4-064 — Counteract: Dispel Magic

**9 spells; 0 not enabled.** Suggested source-reading anchor: Dispel Magic. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract

**Anchor wording:** Attempt a counteract check against the target.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dispel Magic](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/dispel-magic.json) | 2 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 spell effect or unattended magic item |
| [Empty Inside](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/empty-inside.json) | 1 | Enabled route | — | 0.50 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Purging Toxins](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/purging-toxins.json) | 3 | Enabled route | 3 | 0.32 | no primary save; non-basic/no save; duration outcome/text; target 1 willing creature |
| [Putrefy Food and Drink](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/putrefy-food-and-drink.json) | 1 | Note only (resolved) | — | 0.32 | no primary save; non-basic/no save; duration outcome/text; target 1 cubic foot of clean food or water |
| [Return To Essence](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/return-to-essence.json) | 7 | Enabled route | — | 0.24 | no primary save; non-basic/no save; duration outcome/text; target one magically sealed or warded doorway or chest |
| [Umbral Graft](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/umbral-graft.json) | 4 | Enabled route | 3 | 0.21 | no primary save; non-basic/no save; duration 3 rounds; target source/area/text |
| [Extract Poison](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/extract-poison.json) | 2 | Enabled route | 3 | 0.19 | no primary save; non-basic/no save; duration outcome/text; target 1 poison on or in an object |
| [Unblinking Flame Revelation](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/unblinking-flame-revelation.json) | 3 | Enabled route | 3 | 0.18 | no primary save; non-basic/no save; duration 2 rounds; target the creature you hit |
| [Shadow Siphon](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/shadow-siphon.json) | 5 | Enabled route | — | 0.17 | no primary save; non-basic/no save; duration outcome/text; target the triggering spell |


## P4-065 — Counteract: Spell Riposte

**3 spells; 0 not enabled.** Suggested source-reading anchor: Spell Riposte. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract

**Anchor wording:** You attempt to counteract the triggering spell.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spell Riposte](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/spell-riposte.json) | 7 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Disjunction](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/disjunction.json) | 9 | Enabled route | — | 0.53 | no primary save; non-basic/no save; duration outcome/text; target 1 magic item |
| [Rigid Form](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/rigid-form.json) | 4 | Enabled route | 3 | 0.18 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-066 — Counteract: Bracing Tendrils

**1 spells; 0 not enabled.** Suggested source-reading anchor: Bracing Tendrils. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract

**Anchor wording:** If a creature wouldn't normally need a check to move you, it must succeed at an appropriate check (usually an Athletics check for physical movement) against your spell DC or you are unmoved; if an effect wouldn't normally need a check to move you, it must counteract bracing tendrils or you are unmov

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Bracing Tendrils](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/bracing-tendrils.json) | 3 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-067 — Counteract: Cleanse Affliction

**1 spells; 0 not enabled.** Suggested source-reading anchor: Cleanse Affliction. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract, Choice / casting variant, Delegated affliction

**Anchor wording:** Although the reduction can't occur again, heightened versions of this spell attempt to counteract with each casting..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cleanse Affliction](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/cleanse-affliction.json) | 2 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 willing creature |


## P4-068 — Counteract: Enhance Victuals

**1 spells; 0 not enabled.** Suggested source-reading anchor: Enhance Victuals. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract

**Anchor wording:** Prior to the transformation, the spell attempts to counteract any poisons in the food or water.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Enhance Victuals](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/enhance-victuals.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target up to 1 gallon of non-magical water or up to 5 pounds of food |


## P4-069 — Counteract: Nullify

**1 spells; 0 not enabled.** Suggested source-reading anchor: Nullify. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract

**Anchor wording:** You automatically counteract the spell, but the feedback brings you unavoidable harm.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Nullify](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/nullify.json) | 10 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target the triggering spell |


## P4-070 — Counteract: Planar Seal

**1 spells; 0 not enabled.** Suggested source-reading anchor: Planar Seal. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract

**Anchor wording:** ou create a visible magical barrier that attempts to counteract teleportation effects and planar travel into or out of the area, including items that allow access to extradimensional spaces.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Planar Seal](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/planar-seal.json) | 7 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration until your next daily preparations; target source/area/text |


## P4-071 — Counteract: Seize Soul

**1 spells; 0 not enabled.** Suggested source-reading anchor: Seize Soul. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract

**Anchor wording:** Destroying (not just breaking) an item or counteracting seize soul releases the soul to the afterlife..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Seize Soul](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/seize-soul.json) | 9 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration unlimited; target 1 creature that died within the last minute |


## P4-072 — Counteract: Spell Immunity

**1 spells; 0 not enabled.** Suggested source-reading anchor: Spell Immunity. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract, Choice / casting variant

**Anchor wording:** Spell immunity attempts to counteract that spell whenever spell immunity's target is the target of the named spell or in that spell's area.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spell Immunity](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/spell-immunity.json) | 4 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration until the next time you make your daily preparations; target 1 creature |


## P4-073 — Counteract: Spell Turning

**1 spells; 0 not enabled.** Suggested source-reading anchor: Spell Turning. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract

**Anchor wording:** This uses the rules for counteracting the spell, but if the spell is successfully counteracted, the effect is turned back on the caster.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spell Turning](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/spell-turning.json) | 7 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P4-074 — Counteract: Truesight

**1 spells; 0 not enabled.** Suggested source-reading anchor: Truesight. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract

**Anchor wording:** The GM rolls a secret counteract check against any illusion, morph or polymorph effect in the area, but only for the purpose of determining whether you see through it (for instance, if the check succeeds against a polymorph spell, you can see the creature's true form, but you don't end the polymorph

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Truesight](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/truesight.json) | 6 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P4-075 — Counteract: Veil of Privacy

**1 spells; 0 not enabled.** Suggested source-reading anchor: Veil of Privacy. This is not a verified-test designation.

**Test contract:** Counteract rank/DC; effect identity; degree thresholds; exact effect removal; unsupported targets disclosed.

**Shared signals:** Counteract, Information / adjudication

**Anchor wording:** Veil of privacy attempts to counteract all detection, revelation, and scrying effects used against the target or the target's gear throughout the duration, counting cantrips as 1st-rank spells for this purpose.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Veil of Privacy](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/veil-of-privacy.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 8 hours; target 1 creature or object |


## P4-076 — Information / adjudication: Dream Message

**3 spells; 0 not enabled.** Suggested source-reading anchor: Dream Message. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** ou send a message to your target's dream.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dream Message](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/dream-message.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration until your next daily preparations; target 1 creature you know by name and have met in person |
| [Timely Reminder](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/timely-reminder.json) | 2 | Note only (resolved) | 3 | 0.42 | no primary save; non-basic/no save; duration 1 year; target source/area/text |
| [Sending](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/sending.json) | 5 | Enabled route | — | 0.17 | no primary save; non-basic/no save; duration outcome/text; target 1 creature you know well |


## P4-077 — Information / adjudication: Forgotten Lines

**2 spells; 0 not enabled.** Suggested source-reading anchor: Forgotten Lines. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** You learn one piece of information that was removed from the target text after its creation.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Forgotten Lines](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/forgotten-lines.json) | 4 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration varies; target 1 text or remnants thereof |
| [Shadow Spy](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/shadow-spy.json) | 3 | Note only (resolved) | 3 | 0.15 | no primary save; non-basic/no save; duration until the next time you make your daily preparations; target source/area/text |


## P4-078 — Information / adjudication: Telepathy

**2 spells; 0 not enabled.** Suggested source-reading anchor: Telepathy. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** ou can communicate telepathically with creatures within 30 feet.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Telepathy](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/telepathy.json) | 4 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |
| [Telepathic Bond](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/telepathic-bond.json) | 5 | Note only (resolved) | 3 | 0.33 | no primary save; non-basic/no save; duration 8 hours; target you and up to 4 willing creatures touched |


## P4-079 — Information / adjudication: Tremor Signs

**2 spells; 0 not enabled.** Suggested source-reading anchor: Tremor Signs. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** If they respond, their response is delivered to you through tremors you feel, as with the original message.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Tremor Signs](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/tremor-signs.json) | 1 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Message](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/message.json) | 1 | Enabled route | 3 | 0.46 | no primary save; non-basic/no save; duration see below; target 1 creature |


## P4-080 — Information / adjudication: Animal Messenger

**1 spells; 0 not enabled.** Suggested source-reading anchor: Animal Messenger. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** The spell ends after the message is delivered or after 24 hours, whichever comes first..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Animal Messenger](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/animal-messenger.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration see text; target source/area/text |


## P4-081 — Information / adjudication: Approximate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Approximate. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** For example, you could look at a pile of 180 copper coins, and you would learn that it held about 200 coins, but you couldn't determine there were exactly 180 coins..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Approximate](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/approximate.json) | 1 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-082 — Information / adjudication: Blind Eye

**1 spells; 0 not enabled.** Suggested source-reading anchor: Blind Eye. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** If you cast blind eye on a magical item that can be activated to scry (such as a Crystal Ball or Hag Eye), the item can't be activated for scrying effects.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Blind Eye](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/blind-eye.json) | 5 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration until the next time you make your daily preparations; target 1 object |


## P4-083 — Information / adjudication: Cinder Scribe

**1 spells; 0 not enabled.** Suggested source-reading anchor: Cinder Scribe. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** onjuring a quill of magical flame, you take an object and write a message onto it that disappears to the naked eye almost as soon as you finish writing it.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cinder Scribe](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/cinder-scribe.json) | 1 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 24 hours; target one object (see below) |


## P4-084 — Information / adjudication: Detect Magic

**1 spells; 0 not enabled.** Suggested source-reading anchor: Detect Magic. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** You receive no information beyond the presence or absence of magic.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Detect Magic](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/detect-magic.json) | 1 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-085 — Information / adjudication: Detect Metal

**1 spells; 0 not enabled.** Suggested source-reading anchor: Detect Metal. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** You detect metal hidden by illusions (such as Invisibility) only if the illusion has a lower rank than your detect metal spell.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Detect Metal](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/detect-metal.json) | 1 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-086 — Information / adjudication: Detect Poison

**1 spells; 0 not enabled.** Suggested source-reading anchor: Detect Poison. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** ou detect whether a creature is venomous or poisonous, or if an object is poison or has been poisoned.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Detect Poison](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/detect-poison.json) | 1 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 object or creature |


## P4-087 — Information / adjudication: Detect Scrying

**1 spells; 0 not enabled.** Suggested source-reading anchor: Detect Scrying. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** y reading trace auras, you detect the presence of scrying effects in the area.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Detect Scrying](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/detect-scrying.json) | 4 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P4-088 — Information / adjudication: Empathic Link

**1 spells; 0 not enabled.** Suggested source-reading anchor: Empathic Link. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** You and the target can communicate empathetically, sharing emotions, at a distance of up to 1 mile..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Empathic Link](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/empathic-link.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target 1 willing creature |


## P4-089 — Information / adjudication: Fact Check

**1 spells; 0 not enabled.** Suggested source-reading anchor: Fact Check. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** You use your arcane knowledge to double-check the information learned.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fact Check](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/fact-check.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-090 — Information / adjudication: Far Sight

**1 spells; 0 not enabled.** Suggested source-reading anchor: Far Sight. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** This spell doesn't affect the range of other visual senses you might have, so if you have a visual sense that extends to only 60 feet, you still can't use it to see things beyond that range, even if they would appear closer with this spell..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Far Sight](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/far-sight.json) | 3 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P4-091 — Information / adjudication: Ghostly Tragedy

**1 spells; 0 not enabled.** Suggested source-reading anchor: Ghostly Tragedy. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** Any creature that observed the ghostly recreation, including you, can attempt checks to investigate the event to discover new clues and information..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ghostly Tragedy](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/ghostly-tragedy.json) | 4 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P4-092 — Information / adjudication: Heatvision

**1 spells; 0 not enabled.** Suggested source-reading anchor: Heatvision. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** he target visually senses the heat energy emitted by the creatures and objects around it, gaining infrared vision at a range of 60 feet as a precise sense.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Heatvision](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/heatvision.json) | 3 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target 1 willing creature |


## P4-093 — Information / adjudication: Hypercognition

**1 spells; 0 not enabled.** Suggested source-reading anchor: Hypercognition. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** ou rapidly catalog and collate information relevant to your current situation.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Hypercognition](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/hypercognition.json) | 3 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-094 — Information / adjudication: Imprint Message

**1 spells; 0 not enabled.** Suggested source-reading anchor: Imprint Message. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** ou project psychic vibrations onto the target object, imprinting it with a short message or emotional theme of your design.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Imprint Message](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/imprint-message.json) | 1 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 object |


## P4-095 — Information / adjudication: Invisible Item

**1 spells; 0 not enabled.** Suggested source-reading anchor: Invisible Item. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** Making a weapon invisible typically doesn't give any advantage to the attack, except that an invisible thrown weapon or piece of ammunition can be used for an attack without necessarily giving information about the attacker's hiding place unless the weapon returns to the attacker..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Invisible Item](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/invisible-item.json) | 1 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target 1 object |


## P4-096 — Information / adjudication: Know the Enemy

**1 spells; 0 not enabled.** Suggested source-reading anchor: Know the Enemy. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** You quickly remind yourself of useful information.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Know the Enemy](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/know-the-enemy.json) | 4 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-097 — Information / adjudication: Mindlink

**1 spells; 0 not enabled.** Suggested source-reading anchor: Mindlink. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** ou link your mind to the target's mind and mentally impart to that target an amount of information in an instant that could otherwise be communicated in 10 minutes..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mindlink](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/mindlink.json) | 1 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 willing creature |


## P4-098 — Information / adjudication: Object Reading

**1 spells; 0 not enabled.** Suggested source-reading anchor: Object Reading. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** ou place a hand on an object to learn a piece of information about an emotional event that occurred involving the object within the past week, determined by the GM.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Object Reading](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/object-reading.json) | 1 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 object |


## P4-099 — Information / adjudication: Pinpoint

**1 spells; 0 not enabled.** Suggested source-reading anchor: Pinpoint. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** ou learn the name of the target's exact location (including the building, community, and country) and plane of existence.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Pinpoint](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/pinpoint.json) | 8 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature or object |


## P4-100 — Information / adjudication: Read Fate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Read Fate. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Temporary immunity, Information / adjudication

**Anchor wording:** ou attempt to learn more about the target's fate in the short term, usually within the next day for most prosaic creatures, or the next hour or less for someone likely to have multiple rapid experiences, such as someone actively adventuring..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Read Fate](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/read-fate.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature other than you |


## P4-101 — Information / adjudication: Umbral Mindtheft

**1 spells; 0 not enabled.** Suggested source-reading anchor: Umbral Mindtheft. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** Determine the Lore skill at random from among those known by the target; on a critical success, you learn what Lore skills the creature is proficient in and can select the skill rather than choosing at random.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Umbral Mindtheft](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/umbral-mindtheft.json) | 2 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 3 rounds; target source/area/text |


## P4-102 — Information / adjudication: Voice on the Breeze

**1 spells; 0 not enabled.** Suggested source-reading anchor: Voice on the Breeze. This is not a verified-test designation.

**Test contract:** Separate deterministic targeting/range from information or narrative adjudication; do not invent hidden information.

**Shared signals:** Information / adjudication

**Anchor wording:** ou whisper a secret message or sound into the wind, which carries it to a designated spot.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Voice on the Breeze](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/voice-on-the-breeze.json) | 2 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-103 — Healing / recipient mode: Rebuke Death

**12 spells; 1 not enabled.** Suggested source-reading anchor: Rebuke Death. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** Each target regains 3d6 Hit Points.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Rebuke Death](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/rebuke-death.json) | 4 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 living creature per action spent to Cast this Spell |
| [Necromancer's Generosity](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/necromancers-generosity.json) | 1 | Enabled route | 2, 3 | 0.45 | no primary save; non-basic/no save; duration 1 minute; target 1 undead minion you control |
| [Ravening Maw](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/ravening-maw.json) | 5 | Enabled route | 2, 3 | 0.39 | will; non-basic/no save; duration 3 rounds; target one living creature |
| [Healer's Blessing](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/healers-blessing.json) | 1 | Enabled route | 2, 3 | 0.35 | no primary save; non-basic/no save; duration 1 minute; target 1 willing living creature |
| [Soothe](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/soothe.json) | 1 | Enabled route | 2, 3 | 0.29 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |
| [Let Not the Fallen Rest](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/let-not-the-fallen-rest.json) | 5 | Enabled route | — | 0.23 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Life Pact](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/life-pact.json) | 3 | Enabled route | 3 | 0.21 | no primary save; non-basic/no save; duration 10 minutes; target up to 6 willing creatures |
| [Soothing Spring](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/soothing-spring.json) | 4 | Enabled route | 2, 3 | 0.18 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |
| [Bounty of the Sky](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/bounty-of-the-sky.json) | 6 | Not enabled | 2, 3 | 0.18 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Fated Healing](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/fated-healing.json) | 1 | Enabled route | 3 | 0.17 | no primary save; non-basic/no save; duration 5 rounds; target 2 creatures who are hostile toward each other |
| [Heal Animal](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/heal-animal.json) | 1 | Enabled route | — | 0.17 | no primary save; non-basic/no save; duration outcome/text; target 1 willing living animal |
| [Cornucopia](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/cornucopia.json) | 1 | Enabled route | 3 | 0.17 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P4-104 — Healing / recipient mode: Spiritual Renewal

**8 spells; 1 not enabled.** Suggested source-reading anchor: Spiritual Renewal. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** The target gains fast healing 8..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spiritual Renewal](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/spiritual-renewal.json) | 4 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 4 rounds; target 1 living creature |
| [Blessing of Vigor](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/blessing-of-vigor.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 3 rounds; target you or 1 ally |
| [Life Boost](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/life-boost.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 4 rounds; target 1 creature |
| [Malignant Sustenance](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/malignant-sustenance.json) | 4 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 willing undead creature |
| [Lifelink Surge](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/lifelink-surge.json) | 2 | Enabled route | 3 | 0.65 | no primary save; non-basic/no save; duration 4 rounds; target source/area/text |
| [Song of the Soul](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/song-of-the-soul.json) | 1 | Enabled route | 2, 3 | 0.33 | no primary save; non-basic/no save; duration 1 minute; target 1 of your thralls |
| [Mantle of the Unwavering Heart](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/mantle-of-the-unwavering-heart.json) | 5 | Enabled route | 2, 3 | 0.20 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Mantle of Heaven's Slopes](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/mantle-of-heavens-slopes.json) | 6 | Not enabled | 2, 3 | 0.19 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-105 — Healing / recipient mode: Heal

**7 spells; 1 not enabled.** Suggested source-reading anchor: Heal. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** If the target is a willing living creature, you restore 1d8 Hit Points.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Heal](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/heal.json) | 1 | Enabled route | 2 | 1.00 | fortitude; basic; duration outcome/text; target 1 willing living creature or 1 undead |
| [Harm](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/harm.json) | 1 | Enabled route | 2 | 0.69 | fortitude; basic; duration outcome/text; target 1 living creature or 1 willing undead creature |
| [Heartbolt](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/heartbolt.json) | 6 | Not enabled | 2 | 0.59 | fortitude; basic; duration outcome/text; target 1 willing living creature or 1 undead creature |
| [Heal Companion](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/heal-companion.json) | 1 | Enabled route | — | 0.28 | no primary save; non-basic/no save; duration outcome/text; target your animal companion |
| [Soothing Mist](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/soothing-mist.json) | 2 | Enabled route | 2, 3 | 0.20 | fortitude; basic; duration outcome/text; target 1 willing living creature or 1 undead creature |
| [Execute](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/execute.json) | 7 | Enabled route | 2 | 0.19 | fortitude; basic; duration outcome/text; target 1 creature |
| [Breath of Life](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/breath-of-life.json) | 5 | Enabled route | — | 0.18 | no primary save; non-basic/no save; duration outcome/text; target the triggering creature |


## P4-106 — Healing / recipient mode: Moment of Renewal

**1 spells; 1 not enabled.** Suggested source-reading anchor: Moment of Renewal. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Temporary immunity, Healing / recipient mode

**Anchor wording:** The targets regain Hit Points and recover from conditions as if they had taken 24 hours of rest, but they do not make their daily preparations again or gain any benefits of rest other than healing.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Moment of Renewal](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/moment-of-renewal.json) | 8 | Not enabled | 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target up to 6 creatures |


## P4-107 — Healing / recipient mode: Shock to the System

**1 spells; 1 not enabled.** Suggested source-reading anchor: Shock to the System. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Turn trigger or boundary, Native condition, Healing / recipient mode

**Anchor wording:** Regardless of whether the creature came back to life or was already alive, it regains 8d8 Hit Points, and the bolt wakes it up if it was Unconscious.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shock to the System](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/shock-to-the-system.json) | 7 | Not enabled | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 living creature or 1 corpse that died within the last round |


## P4-108 — Healing / recipient mode: Devour Life

**6 spells; 0 not enabled.** Suggested source-reading anchor: Devour Life. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** You regain Hit Points equal to half the void damage the target takes (after applying resistance and the like).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Devour Life](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/devour-life.json) | 8 | Enabled route | 2 | 1.00 | fortitude; basic; duration outcome/text; target 1 living creature |
| [Fearful Feast](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/fearful-feast.json) | 4 | Enabled route | 2, 3 | 0.41 | will; non-basic/no save; duration varies; target the triggering creature |
| [Call The Blood](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/call-the-blood.json) | 4 | Enabled route | 2 | 0.39 | fortitude; basic; duration outcome/text; target 1 living creature |
| [Blood-Feasting Breath](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/blood-feasting-breath.json) | 5 | Enabled route | 2 | 0.23 | fortitude; basic; duration outcome/text; target source/area/text |
| [Vicious Howl](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/vicious-howl.json) | 4 | Enabled route | 2, 3 | 0.18 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Phoenix Ward](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/phoenix-ward.json) | 4 | Enabled route | 2, 3 | 0.16 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-109 — Healing / recipient mode: Touch of the Void

**2 spells; 0 not enabled.** Suggested source-reading anchor: Touch of the Void. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Basic-save damage, Healing / recipient mode, Modifier / resistance

**Anchor wording:** ou infuse the target with void energy, healing undead or damaging a living creature..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Touch of the Void](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/touch-of-the-void.json) | 1 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 willing undead creature or 1 living creature |
| [Lay on Hands](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/lay-on-hands.json) | 1 | Enabled route | 2 | 0.39 | no primary save; non-basic/no save; duration outcome/text; target 1 willing living creature or 1 undead creature |


## P4-110 — Healing / recipient mode: Capital Dividend

**1 spells; 0 not enabled.** Suggested source-reading anchor: Capital Dividend. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** For the next minute, any time you would regain Hit Points from a healing effect, this magic amplifies the effect, and you regain an additional 8 Hit Points..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Capital Dividend](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/capital-dividend.json) | 4 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-111 — Healing / recipient mode: Consecrate Flesh

**1 spells; 0 not enabled.** Suggested source-reading anchor: Consecrate Flesh. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode, Modifier / resistance

**Anchor wording:** Your healing spells that restore Hit Points restore an additional (max(1,floor(@item.rank/3)))d4[healing] Hit Points when you initially cast them; as normal, if your healing spell restores Hit Points more than once, grants fast healing, or the like, the additional Hit Points still only apply once..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Consecrate Flesh](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/consecrate-flesh.json) | 3 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target self |


## P4-112 — Healing / recipient mode: Curse of Lost Time

**1 spells; 0 not enabled.** Suggested source-reading anchor: Curse of Lost Time. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Save-result condition rider, Basic-save damage, Native condition, Healing / recipient mode, Counteract, Delegated affliction

**Anchor wording:** Until the curse ends, the item becomes shoddy and can't be Repaired, and the curse attempts to counteract any spell that would restore the object's Hit Points.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Curse of Lost Time](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/curse-of-lost-time.json) | 3 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration varies; target 1 Large or smaller object, construct, or living creature |


## P4-113 — Healing / recipient mode: Delay Affliction

**1 spells; 0 not enabled.** Suggested source-reading anchor: Delay Affliction. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Temporary immunity, Healing / recipient mode, Counteract, Delegated affliction

**Anchor wording:** ith a surge of healing energy, you push back against an affliction threatening the target and grant a small amount of healing.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Delay Affliction](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/delay-affliction.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-114 — Healing / recipient mode: Divine Armageddon

**1 spells; 0 not enabled.** Suggested source-reading anchor: Divine Armageddon. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** A creature harmed by vitality damage, such as one with void healing, takes vitality damage instead of void damage from this spell..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Divine Armageddon](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/divine-armageddon.json) | 8 | Enabled route | 2 | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |


## P4-115 — Healing / recipient mode: Gentle Breeze

**1 spells; 0 not enabled.** Suggested source-reading anchor: Gentle Breeze. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode, Modifier / resistance

**Anchor wording:** Any living creature in the area also gets a +2 status bonus to saving throws against afflictions and, if it remains within the area for the full duration, regains 10 Hit Points.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Gentle Breeze](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/gentle-breeze.json) | 2 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 10 Minutes; target source/area/text |


## P4-116 — Healing / recipient mode: Harmonize Self

**1 spells; 0 not enabled.** Suggested source-reading anchor: Harmonize Self. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode, Counteract, Delegated affliction

**Anchor wording:** You regain 8 Hit Points..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Harmonize Self](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/harmonize-self.json) | 2 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-117 — Healing / recipient mode: Healing Plaster

**1 spells; 0 not enabled.** Suggested source-reading anchor: Healing Plaster. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode, Modifier / resistance

**Anchor wording:** ou purify some dirt or mud into a pliable, claylike plaster that can aid in clotting and healing.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Healing Plaster](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/healing-plaster.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target a handful of dirt or mud |


## P4-118 — Healing / recipient mode: Hero's Defiance

**1 spells; 0 not enabled.** Suggested source-reading anchor: Hero's Defiance. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** You shout in defiance and are filled with a burst of healing.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Hero's Defiance](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/heros-defiance.json) | 10 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-119 — Healing / recipient mode: Life Siphon

**1 spells; 0 not enabled.** Suggested source-reading anchor: Life Siphon. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** You use some of the spell's magic to heal yourself, regaining 1d8 Hit Points per rank of the spell..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Life Siphon](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/life-siphon.json) | 4 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-120 — Healing / recipient mode: Life Tap

**1 spells; 0 not enabled.** Suggested source-reading anchor: Life Tap. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Save-result condition rider, Native condition, Healing / recipient mode

**Anchor wording:** You or an ally of your choice within 30 feet of the thrall regains Hit Points equal to double the amount the creature lost.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Life Tap](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/life-tap.json) | 1 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 of your thralls |


## P4-121 — Healing / recipient mode: Lively Flight

**1 spells; 0 not enabled.** Suggested source-reading anchor: Lively Flight. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** ealing energy spirals toward your target, taking shape around them like majestic wings of vital energy.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Lively Flight](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/lively-flight.json) | 3 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 willing living creature |


## P4-122 — Healing / recipient mode: Luminous Stardust Healing

**1 spells; 0 not enabled.** Suggested source-reading anchor: Luminous Stardust Healing. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode, Counteract

**Anchor wording:** The target regains 16 Hit Points.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Luminous Stardust Healing](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/luminous-stardust-healing.json) | 2 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-123 — Healing / recipient mode: Mending

**1 spells; 0 not enabled.** Suggested source-reading anchor: Mending. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** You restore 5 Hit Points per spell rank to the target, potentially removing the Broken condition if this repairs it past the item's Broken Threshold.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mending](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/mending.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target non-magical object of light Bulk or less |


## P4-124 — Healing / recipient mode: Moth's Supper

**1 spells; 0 not enabled.** Suggested source-reading anchor: Moth's Supper. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode, Information / adjudication

**Anchor wording:** You heal 2d4 Hit Points every 10 minutes..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Moth's Supper](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/moths-supper.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P4-125 — Healing / recipient mode: Mystic Beacon

**1 spells; 0 not enabled.** Suggested source-reading anchor: Mystic Beacon. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Turn trigger or boundary, Healing / recipient mode

**Anchor wording:** he next damaging or healing spell the target casts before the start of your next turn deals damage or restores Hit Points as if the spell were heightened 1 rank higher than its actual rank.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mystic Beacon](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/mystic-beacon.json) | 4 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration until the start of your next turn; target 1 willing creature |


## P4-126 — Healing / recipient mode: Nature's Bounty

**1 spells; 0 not enabled.** Suggested source-reading anchor: Nature's Bounty. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** A creature can consume the food with an Interact action to regain 3d10+12 Hit Points and be nourished as if it had eaten a meal.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Nature's Bounty](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/natures-bounty.json) | 4 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P4-127 — Healing / recipient mode: Regenerate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Regenerate. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Turn trigger or boundary, Healing / recipient mode

**Anchor wording:** n infusion of vital energy grants a creature continuous healing.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Regenerate](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/regenerate.json) | 7 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 willing living creature |


## P4-128 — Healing / recipient mode: Rejuvenating Flames

**1 spells; 0 not enabled.** Suggested source-reading anchor: Rejuvenating Flames. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Basic-save damage, Healing / recipient mode, Modifier / resistance

**Anchor wording:** You restore (@item.level)d4[healing] HP to all allies in the area, and those allies gain a +1 status bonus to Fortitude saves for 1 minute.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Rejuvenating Flames](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/rejuvenating-flames.json) | 1 | Enabled route | 2 | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P4-129 — Healing / recipient mode: Shall not Falter, Shall not Rout

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shall not Falter, Shall not Rout. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode

**Anchor wording:** This healing can't raise your current HP above half of your maximum HP..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shall not Falter, Shall not Rout](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/shall-not-falter-shall-not-rout.json) | 5 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-130 — Healing / recipient mode: Soothing Ballad

**1 spells; 0 not enabled.** Suggested source-reading anchor: Soothing Ballad. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode, Counteract, Choice / casting variant

**Anchor wording:** The spell restores 7d8 Hit Points to the targets..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Soothing Ballad](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/soothing-ballad.json) | 7 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target you and up to 9 allies |


## P4-131 — Healing / recipient mode: Sound Body

**1 spells; 0 not enabled.** Suggested source-reading anchor: Sound Body. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Turn trigger or boundary, Native condition, Healing / recipient mode, Counteract

**Anchor wording:** ou send a surge of healing energy to restore the target's body.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sound Body](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/sound-body.json) | 2 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 willing creature |


## P4-132 — Healing / recipient mode: Unblinking Flame Aura

**1 spells; 0 not enabled.** Suggested source-reading anchor: Unblinking Flame Aura. This is not a verified-test designation.

**Test contract:** Living/undead and other recipient predicates; action/rank variants; temporary versus restored HP; damage/healing mode.

**Shared signals:** Healing / recipient mode, Modifier / resistance

**Anchor wording:** You recover (3*@item.level)[healing]{15 Hit Points}.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unblinking Flame Aura](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/unblinking-flame-aura.json) | 5 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-133 — Immediate Other: Electrified Crystal Ward

**1 spells; 0 not enabled.** Suggested source-reading anchor: Electrified Crystal Ward. This is not a verified-test designation.

**Test contract:** Identify deterministic effect, recipients and choices; separate adjudication; missing mechanics remain explicit.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You create an Electric Latch Rune hazard on the target, creating a special crystalline lock on the object. You can also substitute your spell DC for any of the hazard's listed DCs. You can have only one such hazard active at a time, and if 

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Electrified Crystal Ward](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/electrified-crystal-ward.json) | 3 | Note only (resolved) | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 hinge or latch |


## P4-134 — Immediate Other: Force Bolt

**1 spells; 0 not enabled.** Suggested source-reading anchor: Force Bolt. This is not a verified-test designation.

**Test contract:** Identify deterministic effect, recipients and choices; separate adjudication; missing mechanics remain explicit.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You fire an arrow-shaped bolt of force, one of the most common and reliable forms of battle magic. It automatically hits and deals 1d4+1 force damage to the target.. Heightened (+2) The damage increases by 1d4+1..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Force Bolt](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/force-bolt.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-135 — Immediate Other: Force Fang

**1 spells; 0 not enabled.** Suggested source-reading anchor: Force Fang. This is not a verified-test designation.

**Test contract:** Identify deterministic effect, recipients and choices; separate adjudication; missing mechanics remain explicit.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You briefly transform your attack into pure force energy to bypass your opponent's defenses. You magically shift your weapon or unarmed attack into a spike of pure force that deals 1d4+1 force damage to a target within your melee reach. If 

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Force Fang](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/force-fang.json) | 1 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P4-136 — Immediate Other: Nettleskin

**1 spells; 0 not enabled.** Suggested source-reading anchor: Nettleskin. This is not a verified-test designation.

**Test contract:** Identify deterministic effect, recipients and choices; separate adjudication; missing mechanics remain explicit.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Thorns sprout from your body; they pass through and don't damage any clothing or armor you wear.. Adjacent creatures that hit you with a melee or unarmed attack take 1d4 piercing damage as the nettles jab them and break off. Each time a cre

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Nettleskin](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/nettleskin.json) | 1 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target self |


## P4-137 — Immediate Other: Power Word Kill

**1 spells; 0 not enabled.** Suggested source-reading anchor: Power Word Kill. This is not a verified-test designation.

**Test contract:** Identify deterministic effect, recipients and choices; separate adjudication; missing mechanics remain explicit.

**Shared signals:** Temporary immunity

**Anchor wording:** Once targeted, the target is then temporarily immune for 10 minutes.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Power Word Kill](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/power-word-kill.json) | 9 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration varies; target 1 creature |


## P4-138 — Immediate Other: Shatter

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shatter. This is not a verified-test designation.

**Test contract:** Identify deterministic effect, recipients and choices; separate adjudication; missing mechanics remain explicit.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** A high-frequency sonic attack shatters a nearby object. You deal 2d10 sonic damage to the object, ignoring the object's Hardness if it is 4 or lower.. Heightened (+1) The damage increases by 1d10, and the Hardness the spell ignores increase

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shatter](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/shatter.json) | 2 | Enabled route | — | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 unattended object |


## P4-139 — Immediate Other: Warning Stripes

**1 spells; 0 not enabled.** Suggested source-reading anchor: Warning Stripes. This is not a verified-test designation.

**Test contract:** Identify deterministic effect, recipients and choices; separate adjudication; missing mechanics remain explicit.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** Your skin becomes painted with vivid stripes or bright aposematic swirls, warning other creatures of its toxic qualities. Any creature that touches you or hits you with an unarmed melee attack takes 2d8 poison damage. If you have an animal 

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Warning Stripes](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/warning-stripes.json) | 3 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P4-140 — Granted movement speed: Feet to Fins

**1 spells; 0 not enabled.** Suggested source-reading anchor: Feet to Fins. This is not a verified-test designation.

**Test contract:** Native speed mode/value; heightened speeds; restrictions; duration; overlap; effect ending does not move the token.

**Shared signals:** Granted movement speed

**Anchor wording:** The target gains a swim Speed equal to its normal land Speed, but its land Speed becomes 5 feet..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Feet to Fins](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/feet-to-fins.json) | 3 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target 1 willing creature |


## P4-141 — Granted movement speed: Magic Warrior Aspect

**1 spells; 0 not enabled.** Suggested source-reading anchor: Magic Warrior Aspect. This is not a verified-test designation.

**Test contract:** Native speed mode/value; heightened speeds; restrictions; duration; overlap; effect ending does not move the token.

**Shared signals:** Granted movement speed

**Anchor wording:** You morph slightly into that creature, gaining the Speeds and senses you would gain from using Animal Form to turn into the type of animal your mask represents; these special Speeds can't be increased by status bonuses or item bonuses..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Magic Warrior Aspect](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/magic-warrior-aspect.json) | 2 | Note only (resolved) | 3 | 1.00 | no primary save; non-basic/no save; duration 5 minutes; target source/area/text |


## P4-142 — Granted movement speed: Wind Jump

**1 spells; 0 not enabled.** Suggested source-reading anchor: Wind Jump. This is not a verified-test designation.

**Test contract:** Native speed mode/value; heightened speeds; restrictions; duration; overlap; effect ending does not move the token.

**Shared signals:** Turn trigger or boundary, Granted movement speed

**Anchor wording:** ou gain a fly Speed equal to your Speed.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wind Jump](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/wind-jump.json) | 5 | Enabled route | 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## Cross-phase dependency list

These spells are owned by another primary worklist; reuse their listed batch instead of implementing them twice.

| Spell | Primary phase / batch | Matched signals |
| --- | --- | --- |
| Cordyceps Command | P2 / P2-003 | Save-result condition rider, Native condition, Choice / casting variant, Delegated affliction |
| Ectoplasmic Expulsion | P2 / P2-004 | Native condition, Counteract, Delegated affliction, Modifier / resistance |
| Sudden Blight | P2 / P2-012 | Basic-save damage, Counteract, Modifier / resistance |
| Brain Drain | P2 / P2-018 | Basic-save damage, Choice / casting variant |
| Hallowed Ground | P2 / P2-028 | Basic-save damage, Counteract, Modifier / resistance |
| Ibex's Harvest | P2 / P2-029 | Basic-save damage, Choice / casting variant |
| Lament | P2 / P2-032 | Basic-save damage, Counteract |
| Swallow Light | P2 / P2-039 | Basic-save damage, Counteract, Choice / casting variant |
| Phantasmagoria | P2 / P2-042 | Turn trigger or boundary, Save-result condition rider, Native condition, Information / adjudication |
| Unsettling Perspective | P2 / P2-042 | Save-result condition rider, Native condition, Information / adjudication |
| Temporary Possession | P2 / P2-043 | Turn trigger or boundary, Save-result condition rider, Native condition, Choice / casting variant |
| Astral Labyrinth | P2 / P2-046 | Save-result condition rider, Native condition, Counteract, Choice / casting variant, Incarnate arrival/departure |
| Dread Secret | P2 / P2-047 | Turn trigger or boundary, Save-result condition rider, Native condition, Choice / casting variant, Information / adjudication, Modifier / resistance |
| Shining Starlight Attack | P2 / P2-054 | Turn trigger or boundary, Save-result condition rider, Native condition |
| Veil of Spirits | P2 / P2-054 | Turn trigger or boundary, Save-result condition rider, Native condition, Information / adjudication, Modifier / resistance |
| Dreamer's Call | P2 / P2-056 | Save-result condition rider, Native condition, Choice / casting variant |
| Eclipse Burst | P2 / P2-058 | Save-result condition rider, Native condition, Counteract |
| Moonburst | P2 / P2-058 | Save-result condition rider, Native condition, Counteract |
| Sunburst | P2 / P2-058 | Save-result condition rider, Native condition, Counteract |
| Clear Mind | P2 / P2-059 | Turn trigger or boundary, Native condition, Counteract |
| Sure Footing | P2 / P2-059 | Turn trigger or boundary, Native condition, Counteract |
| Symphony of the Unfettered Heart | P2 / P2-059 | Native condition, Counteract |
| Unspeakable Shadow | P2 / P2-066 | Save-result condition rider, Native condition, Choice / casting variant |
| Unfettered Movement | P2 / P2-067 | Granted movement speed, Native condition, Modifier / resistance |
| Annunciation of the Outer Gate | P2 / P2-069 | Save-result condition rider, Native condition, Information / adjudication |
| Cast into Time | P2 / P2-073 | Turn trigger or boundary, Save-result condition rider, Native condition, Information / adjudication |
| Channel Arrogance | P2 / P2-074 | Save-result condition rider, Native condition, Information / adjudication |
| Cleansing Flames | P2 / P2-076 | Native condition, Counteract, Modifier / resistance |
| Eject Soul | P2 / P2-082 | Save-result condition rider, Native condition, Choice / casting variant |
| Foresight | P2 / P2-085 | Native condition, Choice / casting variant, Information / adjudication, Modifier / resistance |
| Rapid Adaptation | P2 / P2-098 | Granted movement speed, Native condition, Information / adjudication, Modifier / resistance |
| Revealing Light | P2 / P2-100 | Save-result condition rider, Native condition, Choice / casting variant |
| Shock and Awe | P2 / P2-103 | Save-result condition rider, Native condition, Information / adjudication |
| Spiritual Anamnesis | P2 / P2-106 | Save-result condition rider, Native condition, Information / adjudication |
| Unsettling Knowledge | P2 / P2-108 | Save-result condition rider, Native condition, Choice / casting variant |
| Variable Gravity | P2 / P2-109 | Native condition, Choice / casting variant, Modifier / resistance |
| Pain of Ages | P2 / P2-117 | Save-result condition rider, Native condition, Information / adjudication |
| Parch | P2 / P2-118 | Save-result condition rider, Native condition, Choice / casting variant, Modifier / resistance |
| Radiant Beam | P2 / P2-120 | Save-result condition rider, Native condition, Counteract |
| Redistribute Potential | P2 / P2-121 | Turn trigger or boundary, Basic-save damage, Native condition, Choice / casting variant |
| Fabricated Truth | P2 / P2-127 | Save-result condition rider, Counteract, Choice / casting variant |
| Glossolalia | P2 / P2-131 | Save-result condition rider, Information / adjudication |
| Infectious Melody | P2 / P2-131 | Save-result condition rider, Information / adjudication, Modifier / resistance |
| Planar Tether | P2 / P2-131 | Save-result condition rider, Counteract |
| Seal Fate | P2 / P2-131 | Turn trigger or boundary, Save-result condition rider, Choice / casting variant, Modifier / resistance |
| Catch Your Name | P2 / P2-139 | Information / adjudication |
| Clouded Focus | P2 / P2-141 | Save-result condition rider, Choice / casting variant, Modifier / resistance |
| Ephemeral Hazards | P2 / P2-147 | Turn trigger or boundary, Save-result condition rider, Choice / casting variant |
| Excise Lexicon | P2 / P2-148 | Save-result condition rider, Choice / casting variant |
| Fate's Travels | P2 / P2-149 | Information / adjudication |
| Mark of Blood | P2 / P2-155 | Save-result condition rider, Information / adjudication |
| Mental Map | P2 / P2-156 | Save-result condition rider, Information / adjudication, Modifier / resistance |
| Penumbral Shroud | P2 / P2-161 | Information / adjudication, Modifier / resistance |
| Primal Chorus | P2 / P2-164 | Information / adjudication, Modifier / resistance |
| Shadow Blast | P2 / P2-165 | Basic-save damage, Choice / casting variant |
| Talking Corpse | P2 / P2-166 | Save-result condition rider, Information / adjudication, Modifier / resistance |
| The Parrot's Whisper | P2 / P2-167 | Turn trigger or boundary, Save-result condition rider, Information / adjudication, Modifier / resistance |
| Trickster's Twin | P2 / P2-170 | Save-result condition rider, Choice / casting variant, Information / adjudication |
| Verminous Lure | P2 / P2-172 | Information / adjudication |
| Primal Summons | P2 / P2-175 | Granted movement speed, Choice / casting variant, Modifier / resistance |
| Theogeny | P2 / P2-176 | Save-result condition rider, Granted movement speed, Modifier / resistance |
| Athletic Rush | P2 / P2-177 | Granted movement speed, Modifier / resistance |
| Elemental Motion | P2 / P2-177 | Granted movement speed, Modifier / resistance |
| Fleet Step | P2 / P2-177 | Granted movement speed, Modifier / resistance |
| Ghost Rush | P2 / P2-177 | Granted movement speed, Modifier / resistance |
| Tailwind | P2 / P2-177 | Granted movement speed, Modifier / resistance |
| Triple Time | P2 / P2-177 | Granted movement speed, Modifier / resistance |
| Valiant Anthem | P2 / P2-177 | Granted movement speed, Modifier / resistance |
| Warp Step | P2 / P2-177 | Turn trigger or boundary, Granted movement speed, Modifier / resistance |
| Reflective Scales | P2 / P2-178 | Basic-save damage, Choice / casting variant, Modifier / resistance |
| Resist Energy | P2 / P2-178 | Choice / casting variant, Modifier / resistance |
| Thermal Remedy | P2 / P2-178 | Choice / casting variant, Modifier / resistance |
| Blessing of Defiance | P2 / P2-179 | Granted movement speed, Choice / casting variant, Modifier / resistance |
| Spirit of the Beast | P2 / P2-179 | Information / adjudication, Modifier / resistance |
| Anointed Ground | P2 / P2-181 | Choice / casting variant, Modifier / resistance |
| Adapt Self | P2 / P2-182 | Granted movement speed, Choice / casting variant |
| Angelic Wings | P2 / P2-182 | Granted movement speed |
| Animal Feature | P2 / P2-182 | Granted movement speed |
| Fly | P2 / P2-182 | Granted movement speed |
| Gecko Grip | P2 / P2-182 | Granted movement speed |
| Traveler's Transit | P2 / P2-182 | Granted movement speed |
| Illusory Shroud | P2 / P2-183 | Information / adjudication, Modifier / resistance |
| Beseech the Sphinx | P2 / P2-184 | Choice / casting variant, Modifier / resistance |
| Soothing Words | P2 / P2-184 | Counteract, Modifier / resistance |
| Prismatic Shield | P2 / P2-185 | Counteract, Modifier / resistance |
| Evolution Surge | P2 / P2-188 | Turn trigger or boundary, Granted movement speed, Choice / casting variant, Information / adjudication, Modifier / resistance |
| Keen Smell | P2 / P2-190 | Information / adjudication |
| Tremorsense | P2 / P2-190 | Information / adjudication |
| Fireproof | P2 / P2-191 | Counteract, Modifier / resistance |
| Mantle of the Melting Heart | P2 / P2-191 | Counteract, Modifier / resistance |
| Mimic Undead | P2 / P2-192 | Counteract, Information / adjudication, Modifier / resistance |
| Pulse of Civilization | P2 / P2-192 | Information / adjudication, Modifier / resistance |
| Pocket Library | P2 / P2-193 | Save-result condition rider, Choice / casting variant, Information / adjudication, Modifier / resistance |
| Community Restoration | P2 / P2-200 | Choice / casting variant |
| Divine Vessel | P2 / P2-203 | Choice / casting variant, Modifier / resistance |
| Elemental Sheath | P2 / P2-205 | Choice / casting variant, Modifier / resistance |
| Elemental Tempest | P2 / P2-206 | Choice / casting variant, Modifier / resistance |
| Fire Shield | P2 / P2-209 | Modifier / resistance |
| Hidden Mind | P2 / P2-214 | Counteract, Information / adjudication, Modifier / resistance |
| Loremaster's Etude | P2 / P2-220 | Information / adjudication |
| Read Aura | P2 / P2-228 | Information / adjudication, Modifier / resistance |
| Read the Air | P2 / P2-229 | Information / adjudication, Modifier / resistance |
| Reed Whistle | P2 / P2-230 | Information / adjudication, Modifier / resistance |
| Rewrite Possibility | P2 / P2-232 | Information / adjudication, Modifier / resistance |
| Root Reading | P2 / P2-233 | Turn trigger or boundary, Information / adjudication, Modifier / resistance |
| Speaking Sky | P2 / P2-237 | Information / adjudication |
| Spirit Sense | P2 / P2-238 | Information / adjudication, Modifier / resistance |
| Spiritual Attunement | P2 / P2-239 | Choice / casting variant, Modifier / resistance |
| Time Sense | P2 / P2-242 | Information / adjudication, Modifier / resistance |
| Transcribe Conflict | P2 / P2-243 | Choice / casting variant, Information / adjudication, Modifier / resistance |
| Uncover Device | P2 / P2-244 | Information / adjudication, Modifier / resistance |
| Weapon Trance | P2 / P2-247 | Information / adjudication |
| Wind Whispers | P2 / P2-248 | Save-result condition rider, Choice / casting variant, Information / adjudication, Modifier / resistance |
| Unblinking Flame Emblem | P2 / P2-252 | Persistent damage, Native condition, Information / adjudication, Modifier / resistance |
| Mutilate | P2 / P2-253 | Save-result condition rider, Persistent damage, Choice / casting variant |
| Armor of Thorn and Claw | P2 / P2-254 | Persistent damage, Native condition |
| Scintillating Safeguard | P2 / P2-255 | Persistent damage, Choice / casting variant, Modifier / resistance |
| Implement of Destruction | P2 / P2-263 | Save-result condition rider, Persistent damage, Native condition, Information / adjudication |
| Pyroclastic Truth | P2 / P2-265 | Persistent damage, Native condition, Information / adjudication |
| Untamed Shift | P2 / P2-268 | Persistent damage, Granted movement speed, Choice / casting variant, Modifier / resistance |
| Celestial Brand | P2 / P2-271 | Temporary immunity, Modifier / resistance |
| Contagious Idea | P2 / P2-271 | Temporary immunity, Save-result condition rider, Native condition, Choice / casting variant |
| Warp Mind | P2 / P2-271 | Temporary immunity, Save-result condition rider, Native condition, Counteract |
| Shadow Zombie | P2 / P2-273 | Temporary immunity, Save-result condition rider, Granted movement speed, Modifier / resistance |
| Telepathic Demand | P2 / P2-273 | Temporary immunity, Information / adjudication |
| Vision of Weakness | P2 / P2-274 | Turn trigger or boundary, Temporary immunity, Information / adjudication, Modifier / resistance |
| Shift Blame | P2 / P2-281 | Temporary immunity, Choice / casting variant, Information / adjudication |
| Gray Shadow | P3 / P3-003 | Creature creation |
| Revival | P3 / P3-004 | Healing / recipient mode |
| Scrying | P3 / P3-005 | Temporary immunity, Save-result condition rider, Choice / casting variant |
| Burglar's Blind | P3 / P3-008 |  |
| Light of Revelation | P3 / P3-013 | Aura membership, Information / adjudication, Modifier / resistance |
| Information Overload | P3 / P3-014 | Save-result condition rider, Native condition, Information / adjudication |
| Angelic Halo | P3 / P3-018 | Aura membership, Healing / recipient mode, Modifier / resistance |
| Antimagic Field | P3 / P3-019 |  |
| Carrion Mire | P3 / P3-022 | Native condition, Healing / recipient mode, Counteract |
| Clawsong | P3 / P3-023 |  |
| Cloak of Light | P3 / P3-024 | Basic-save damage, Healing / recipient mode |
| Cloak of Shadow | P3 / P3-025 | Aura membership, Counteract |
| Clone Companion | P3 / P3-026 |  |
| Defended by Spirits | P3 / P3-027 | Information / adjudication |
| Destructive Aura | P3 / P3-028 |  |
| Detect Creator | P3 / P3-029 | Information / adjudication |
| Ectoplasmic Interstice | P3 / P3-031 |  |
| Elemental Betrayal | P3 / P3-032 | Choice / casting variant, Modifier / resistance |
| Embodiment of Battle | P3 / P3-033 | Attack and dependent result, Modifier / resistance |
| Fallow Field | P3 / P3-034 | Temporary immunity, Save-result condition rider, Healing / recipient mode |
| Foresee the Path | P3 / P3-035 | Temporary immunity, Attack and dependent result, Modifier / resistance |
| Ghost Sound | P3 / P3-036 |  |
| Glimpse the Truth | P3 / P3-038 | Aura membership, Counteract |
| Helpful Scribe | P3 / P3-040 |  |
| Locate | P3 / P3-042 | Information / adjudication |
| Lure Dream | P3 / P3-043 |  |
| Pack Attack | P3 / P3-046 |  |
| Pave Ground | P3 / P3-048 | Counteract |
| Positive Attunement | P3 / P3-049 | Turn trigger or boundary, Save-result condition rider, Healing / recipient mode |
| Quantic Dampening | P3 / P3-050 | Basic-save damage |
| Retrocognition | P3 / P3-052 |  |
| Shared Invisibility | P3 / P3-054 |  |
| Sonata Span | P3 / P3-057 |  |
| Spellmaster's Ward | P3 / P3-058 |  |
| Stonesense | P3 / P3-060 | Information / adjudication |
| String of Fate | P3 / P3-061 | Save-result condition rider |
| Synchronize Steps | P3 / P3-064 |  |
| Timely Tutor | P3 / P3-065 | Information / adjudication |
| Unblinking Flame Ignition | P3 / P3-067 | Aura membership, Area exposure, Granted movement speed, Native condition |
| Unravel Knowledge | P3 / P3-068 | Save-result condition rider, Choice / casting variant, Modifier / resistance |
| Vital Luminance | P3 / P3-069 | Aura membership, Turn trigger or boundary, Ending or dismissal |
| Bralani Referendum | P3 / P3-071 | Area exposure, Ending or dismissal, Basic-save damage, Native condition, Choice / casting variant |
| Shadow Army | P3 / P3-071 | Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Choice / casting variant |
| Shadow Raid | P3 / P3-072 | Area exposure, Basic-save damage, Choice / casting variant |
| Black Tentacles | P3 / P3-073 | Area exposure, Ending or dismissal, Attack and dependent result |
| Ravenous Darkness | P3 / P3-073 | Area exposure, Ending or dismissal, Attack and dependent result, Modifier / resistance |
| Darkness | P3 / P3-074 | Area exposure |
| Veil of Broken Reality | P3 / P3-080 | Area exposure, Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Information / adjudication |
| Burning Trail | P3 / P3-081 | Area exposure |
| Field of Life | P3 / P3-081 | Area exposure, Healing / recipient mode |
| Life's Fresh Bloom | P3 / P3-081 | Turn trigger or boundary, Area exposure, Granted movement speed, Native condition, Modifier / resistance |
| Tree of Life and Death | P3 / P3-081 | Area exposure, Basic-save damage, Healing / recipient mode |
| Ash Cloud | P3 / P3-082 | Area exposure, Save-result condition rider, Native condition, Information / adjudication |
| Flammable Fumes | P3 / P3-082 | Turn trigger or boundary, Area exposure, Basic-save damage, Information / adjudication |
| Fire Ray | P3 / P3-084 | Area exposure, Save-result condition rider, Attack and dependent result |
| Rend Magic | P3 / P3-084 | Area exposure, Attack and dependent result |
| Dance of Darkness | P3 / P3-086 | Area exposure |
| Prismatic Sphere | P3 / P3-086 | Area exposure |
| Liminal Doorway | P3 / P3-087 | Area exposure |
| Rope Trick | P3 / P3-087 | Area exposure |
| Air Bubble | P3 / P3-089 | Area exposure |
| Alarm | P3 / P3-090 | Area exposure |
| Dim the Light | P3 / P3-094 | Turn trigger or boundary, Area exposure |
| Dinosaur Fort | P3 / P3-095 | Area exposure |
| Disintegrating Puddle | P3 / P3-096 | Area exposure, Attack and dependent result |
| Dispelling Globe | P3 / P3-097 | Area exposure, Counteract |
| Dividing Trench | P3 / P3-098 | Area exposure |
| Dust Storm | P3 / P3-100 | Area exposure |
| Explosive Dust | P3 / P3-102 | Area exposure, Ending or dismissal |
| Font of Serenity | P3 / P3-103 | Area exposure, Temporary immunity, Counteract, Modifier / resistance |
| Hallucination | P3 / P3-107 | Area exposure, Save-result condition rider, Information / adjudication, Modifier / resistance |
| Healing Well | P3 / P3-108 | Area exposure, Ending or dismissal, Healing / recipient mode |
| Home Among Mulberry Leaves | P3 / P3-109 | Turn trigger or boundary, Area exposure, Native condition, Attack and dependent result |
| Inner Radiance Torrent | P3 / P3-111 | Area exposure, Save-result condition rider, Basic-save damage, Native condition, Counteract |
| Marvelous Mount | P3 / P3-114 | Area exposure |
| Overflowing Sorrow | P3 / P3-115 | Area exposure, Save-result condition rider, Counteract, Modifier / resistance |
| Planar Palace | P3 / P3-116 | Area exposure |
| Safeguard Secret | P3 / P3-117 | Area exposure, Choice / casting variant, Information / adjudication, Modifier / resistance |
| Shields of the Spirit | P3 / P3-118 | Turn trigger or boundary, Area exposure, Modifier / resistance |
| Silver's Refrain | P3 / P3-119 | Area exposure, Counteract |
| Synchronize | P3 / P3-122 | Area exposure, Ending or dismissal |
| Temporary Glyph | P3 / P3-123 | Area exposure |
| Vital Beacon | P3 / P3-127 | Area exposure, Ending or dismissal, Healing / recipient mode |
| Wall of Water | P3 / P3-128 | Area exposure, Counteract, Modifier / resistance |
| Ymeri's Mark | P3 / P3-129 | Area exposure, Ending or dismissal, Save-result condition rider, Basic-save damage, Native condition, Information / adjudication |
| Calcification | P3 / P3-130 | Condition-dependent lifetime, Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition, Choice / casting variant, Modifier / resistance |
| Call of the Grave | P3 / P3-131 | Condition-dependent lifetime, Native condition, Attack and dependent result |
| Chromatic Ray | P3 / P3-131 | Condition-dependent lifetime, Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result |
| Medusa's Wrath | P3 / P3-141 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result |
| Possession | P3 / P3-143 | Recurring saving throw, Turn trigger or boundary, Area exposure, Ending or dismissal, Save-result condition rider, Native condition, Information / adjudication |
| Divinity Leech | P3 / P3-144 | Recurring saving throw, Save-result condition rider, Native condition, Healing / recipient mode |
| Puppet Strings | P3 / P3-145 | Recurring saving throw, Sustain, Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result |
| Bane | P3 / P3-147 | Recurring saving throw, Sustain, Area exposure, Counteract, Modifier / resistance |
| Inexhaustible Cynicism | P3 / P3-149 | Recurring saving throw, Turn trigger or boundary, Save-result condition rider, Information / adjudication |
| Part the Mists to Paradise | P3 / P3-152 | Recurring saving throw, Ending or dismissal, Healing / recipient mode, Incarnate arrival/departure, Modifier / resistance |
| Perfected Mind | P3 / P3-153 | Recurring saving throw |
| Aura of the Unremarkable | P3 / P3-154 | Ending or dismissal, Save-result condition rider, Information / adjudication, Modifier / resistance |
| One with the Land | P3 / P3-156 | Ending or dismissal, Attack and dependent result, Choice / casting variant, Information / adjudication |
| Reflected Beauty | P3 / P3-158 | Ending or dismissal, Choice / casting variant |
| Shifting Form | P3 / P3-158 | Ending or dismissal, Granted movement speed, Modifier / resistance |
| Bridge of Graves | P3 / P3-159 | Ending or dismissal |
| Dismantle | P3 / P3-159 | Ending or dismissal |
| Dome of Tranquility | P3 / P3-159 | Ending or dismissal |
| Floating Harness | P3 / P3-159 | Ending or dismissal |
| Helpful Steps | P3 / P3-159 | Ending or dismissal |
| Imaginary Lockbox | P3 / P3-159 | Ending or dismissal |
| Inertia Lock | P3 / P3-159 | Ending or dismissal |
| Moonlight Bridge | P3 / P3-159 | Ending or dismissal |
| Murderous Vine | P3 / P3-159 | Ending or dismissal, Attack and dependent result |
| Sun's Fury | P3 / P3-159 | Ending or dismissal |
| Thief of Fortune | P3 / P3-159 | Ending or dismissal, Counteract |
| Watchdog | P3 / P3-159 | Ending or dismissal |
| Life Connection | P3 / P3-160 | Ending or dismissal, Information / adjudication |
| Summoner's Precaution | P3 / P3-160 | Ending or dismissal |
| It is Written | P3 / P3-161 | Temporary immunity, Ending or dismissal |
| Perseis's Precautions | P3 / P3-162 | Temporary immunity, Ending or dismissal |
| Biting Words | P3 / P3-164 | Ending or dismissal, Attack and dependent result |
| Camel Spit | P3 / P3-164 | Ending or dismissal, Persistent damage, Native condition, Attack and dependent result |
| Drop Dead | P3 / P3-165 | Ending or dismissal |
| Delay Consequence | P3 / P3-167 | Ending or dismissal |
| Illusory Disguise | P3 / P3-169 | Ending or dismissal, Choice / casting variant, Modifier / resistance |
| Imitate Fauna | P3 / P3-169 | Ending or dismissal, Information / adjudication, Modifier / resistance |
| Bottomless Stomach | P3 / P3-170 | Ending or dismissal |
| Nothing Up My Sleeve | P3 / P3-170 | Ending or dismissal |
| Invisibility | P3 / P3-171 | Ending or dismissal |
| Sanctuary | P3 / P3-171 | Ending or dismissal, Save-result condition rider |
| Bilocation | P3 / P3-173 | Ending or dismissal |
| Blister | P3 / P3-174 | Ending or dismissal, Save-result condition rider, Basic-save damage, Choice / casting variant |
| Blood Duplicate | P3 / P3-175 | Ending or dismissal, Information / adjudication |
| Cleanse Air | P3 / P3-177 | Ending or dismissal |
| Cradle Aloft | P3 / P3-179 | Ending or dismissal |
| Cryostasis | P3 / P3-180 | Ending or dismissal, Persistent damage |
| Detonate Magic | P3 / P3-181 | Ending or dismissal, Basic-save damage, Counteract |
| Disguise Magic | P3 / P3-182 | Ending or dismissal, Information / adjudication |
| Dream Council | P3 / P3-183 | Ending or dismissal, Information / adjudication |
| Electrostatic Glider | P3 / P3-185 | Turn trigger or boundary, Ending or dismissal |
| Elemental Absorption | P3 / P3-186 | Ending or dismissal, Basic-save damage, Choice / casting variant, Modifier / resistance |
| Falsify Heat | P3 / P3-187 | Ending or dismissal, Choice / casting variant, Information / adjudication, Modifier / resistance |
| Fold Metal | P3 / P3-189 | Ending or dismissal |
| Fungal Hyphae | P3 / P3-190 | Ending or dismissal, Information / adjudication |
| Ghostly Transcription | P3 / P3-191 | Ending or dismissal, Information / adjudication |
| Glowing Trail | P3 / P3-192 | Ending or dismissal, Information / adjudication |
| Grave Impressions | P3 / P3-193 | Ending or dismissal, Information / adjudication |
| Hologram Cage | P3 / P3-194 | Ending or dismissal |
| Imprinting Hand | P3 / P3-195 | Ending or dismissal, Save-result condition rider, Healing / recipient mode |
| Instant Parade | P3 / P3-196 | Ending or dismissal |
| Life Link | P3 / P3-197 | Ending or dismissal, Healing / recipient mode |
| Life-Giving Form | P3 / P3-198 | Temporary immunity, Ending or dismissal, Healing / recipient mode, Modifier / resistance |
| Message Rune | P3 / P3-200 | Ending or dismissal, Information / adjudication |
| Mirecloak | P3 / P3-201 | Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Information / adjudication, Modifier / resistance |
| Personal Ocean | P3 / P3-203 | Ending or dismissal, Granted movement speed, Counteract, Modifier / resistance |
| Prying Survey | P3 / P3-206 | Ending or dismissal |
| Ravenous Portal | P3 / P3-208 | Ending or dismissal |
| Runic Impression | P3 / P3-209 | Ending or dismissal, Choice / casting variant |
| Scrounger's Glee | P3 / P3-210 | Ending or dismissal, Save-result condition rider, Native condition, Healing / recipient mode |
| Secret Chest | P3 / P3-211 | Ending or dismissal |
| Sheltering Wings | P3 / P3-213 | Turn trigger or boundary, Ending or dismissal |
| Spirit Link | P3 / P3-214 | Turn trigger or boundary, Ending or dismissal, Healing / recipient mode |
| Spy's Mark | P3 / P3-215 | Ending or dismissal, Information / adjudication |
| Stone Lance | P3 / P3-216 | Ending or dismissal, Persistent damage, Attack and dependent result, Modifier / resistance |
| Sudden Recollection | P3 / P3-217 | Ending or dismissal, Choice / casting variant, Information / adjudication |
| Summon Instrument | P3 / P3-218 | Ending or dismissal |
| Suspended Retribution | P3 / P3-219 | Ending or dismissal, Basic-save damage, Attack and dependent result |
| Time Beacon | P3 / P3-220 | Turn trigger or boundary, Ending or dismissal, Counteract |
| Time Pocket | P3 / P3-221 | Ending or dismissal |
| Vanish Weapon | P3 / P3-223 | Ending or dismissal, Attack and dependent result |
| Vindicator's Mark | P3 / P3-224 | Ending or dismissal, Attack and dependent result, Information / adjudication |
| Web of Eyes | P3 / P3-225 | Turn trigger or boundary, Ending or dismissal |
| Zero Gravity | P3 / P3-230 | Turn trigger or boundary, Ending or dismissal |
| Distortion Lens | P3 / P3-231 | Sustain |
| Quench | P3 / P3-231 | Sustain, Basic-save damage, Counteract, Choice / casting variant |
| Benediction | P3 / P3-232 | Sustain, Area exposure, Counteract, Modifier / resistance |
| Bless | P3 / P3-232 | Sustain, Area exposure, Counteract, Modifier / resistance |
| Malediction | P3 / P3-232 | Sustain, Area exposure, Counteract, Modifier / resistance |
| Reaper's Lantern | P3 / P3-232 | Sustain, Area exposure, Native condition, Healing / recipient mode |
| Doom Mark | P3 / P3-233 | Sustain, Native condition, Attack and dependent result |
| Overload Connection | P3 / P3-233 | Sustain, Basic-save damage, Information / adjudication |
| Spectral Blade | P3 / P3-233 | Sustain, Attack and dependent result |
| Spiritual Armament | P3 / P3-233 | Sustain, Attack and dependent result |
| Spiritual Weapon | P3 / P3-234 | Sustain, Attack and dependent result |
| Mad Monkeys | P3 / P3-235 | Sustain, Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Choice / casting variant |
| Impaling Briars | P3 / P3-236 | Sustain, Area exposure, Save-result condition rider, Native condition, Attack and dependent result, Modifier / resistance |
| Control Sand | P3 / P3-237 | Sustain, Area exposure, Temporary immunity, Save-result condition rider, Basic-save damage, Native condition, Choice / casting variant |
| Scouring Sand | P3 / P3-237 | Sustain, Area exposure, Temporary immunity, Save-result condition rider, Native condition, Counteract |
| Spirit Object | P3 / P3-238 | Sustain, Area exposure, Ending or dismissal, Attack and dependent result |
| Tangling Creepers | P3 / P3-238 | Sustain, Area exposure, Native condition, Attack and dependent result, Modifier / resistance |
| Call of the Quenching | P3 / P3-240 | Sustain, Area exposure, Basic-save damage, Granted movement speed, Modifier / resistance |
| Duplicate Foe | P3 / P3-242 | Sustain, Healing / recipient mode |
| Mimic Spell | P3 / P3-244 | Sustain, Turn trigger or boundary, Attack and dependent result, Counteract, Choice / casting variant, Information / adjudication |
| Unbreaking Wave Containment | P3 / P3-248 | Sustain, Basic-save damage, Native condition, Attack and dependent result |
| Circle of Weakness | P3 / P3-250 | Sustain, Save-result condition rider, Native condition, Choice / casting variant, Modifier / resistance |
| Earth's Bile | P3 / P3-250 | Sustain, Persistent damage, Choice / casting variant |
| Hymn of Healing | P3 / P3-250 | Sustain, Healing / recipient mode |
| Swarmsense | P3 / P3-250 | Sustain, Granted movement speed, Modifier / resistance |
| Avenging Wildwood | P3 / P3-251 | Sustain, Attack and dependent result, Choice / casting variant |
| Illusory Creature | P3 / P3-251 | Sustain, Attack and dependent result |
| Malicious Shadow | P3 / P3-251 | Sustain, Area exposure, Attack and dependent result, Counteract, Choice / casting variant |
| Spiritual Guardian | P3 / P3-251 | Sustain, Attack and dependent result |
| Coiling Dance | P3 / P3-252 | Sustain, Native condition, Choice / casting variant |
| Discern Secrets | P3 / P3-253 | Sustain, Temporary immunity, Information / adjudication, Modifier / resistance |
| Beastmaster Trance | P3 / P3-254 | Sustain, Area exposure, Native condition, Information / adjudication |
| Eyes of the Dead | P3 / P3-254 | Sustain, Area exposure, Native condition, Information / adjudication |
| Familiar's Face | P3 / P3-255 | Sustain |
| Replicate | P3 / P3-255 | Sustain |
| Friendly Push | P3 / P3-256 | Sustain, Choice / casting variant |
| Telekinetic Haul | P3 / P3-256 | Sustain |
| Mantle of the Frozen Heart | P3 / P3-258 | Sustain, Area exposure, Granted movement speed, Modifier / resistance |
| Animal Vision | P3 / P3-260 | Sustain, Information / adjudication |
| Animate Rope | P3 / P3-261 | Sustain, Attack and dependent result, Modifier / resistance |
| Aqueous Orb | P3 / P3-263 | Sustain, Save-result condition rider, Counteract |
| Bee-Man's Summons | P3 / P3-265 | Sustain, Information / adjudication |
| Buzzing Servants | P3 / P3-266 | Sustain, Choice / casting variant, Creature creation |
| Cackle | P3 / P3-267 | Sustain |
| Carryall | P3 / P3-268 | Sustain, Ending or dismissal |
| Cozy Cabin | P3 / P3-270 | Sustain, Area exposure, Ending or dismissal |
| Dancing Blade | P3 / P3-271 | Sustain, Attack and dependent result |
| Dancing Shield | P3 / P3-272 | Sustain |
| Diadem of Divine Radiance | P3 / P3-273 | Sustain, Persistent damage, Native condition, Attack and dependent result, Counteract |
| Divine Aura | P3 / P3-275 | Sustain, Aura membership, Temporary immunity, Native condition, Choice / casting variant, Modifier / resistance |
| False Vision | P3 / P3-279 | Sustain, Information / adjudication |
| Garden of Healing | P3 / P3-281 | Sustain, Healing / recipient mode, Modifier / resistance |
| Gift of the Anemos | P3 / P3-283 | Sustain, Aura membership, Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result |
| Halcyon Mists | P3 / P3-286 | Sustain, Turn trigger or boundary, Persistent damage, Choice / casting variant |
| Implosion | P3 / P3-287 | Sustain, Choice / casting variant |
| Infectious Ennui | P3 / P3-288 | Sustain, Turn trigger or boundary, Temporary immunity, Save-result condition rider, Native condition, Choice / casting variant, Information / adjudication |
| Lashing Rope | P3 / P3-290 | Sustain, Turn trigger or boundary, Save-result condition rider, Attack and dependent result |
| Light | P3 / P3-292 | Sustain, Ending or dismissal, Choice / casting variant |
| Mind Probe | P3 / P3-294 | Sustain, Save-result condition rider, Information / adjudication, Modifier / resistance |
| Mind Reading | P3 / P3-295 | Sustain, Temporary immunity, Save-result condition rider, Information / adjudication |
| Mislead | P3 / P3-296 | Sustain |
| Misty Memory | P3 / P3-297 | Sustain, Counteract |
| Movanic Glimmer | P3 / P3-298 | Sustain, Choice / casting variant, Modifier / resistance |
| Palm-Held Sun | P3 / P3-300 | Sustain, Aura membership, Native condition, Healing / recipient mode |
| Perceive the Threads of Fate | P3 / P3-301 | Sustain, Area exposure, Ending or dismissal |
| Persistent Servant | P3 / P3-302 | Sustain, Native condition, Choice / casting variant |
| Pet Cache | P3 / P3-303 | Sustain, Area exposure, Ending or dismissal |
| Phantasmal Protagonist | P3 / P3-304 | Sustain, Turn trigger or boundary, Save-result condition rider, Native condition, Attack and dependent result |
| Phantom Crowd | P3 / P3-305 | Sustain |
| Prestidigitation | P3 / P3-307 | Sustain, Choice / casting variant |
| Project Image | P3 / P3-308 | Sustain, Ending or dismissal |
| Pyrotechnics | P3 / P3-309 | Sustain, Turn trigger or boundary, Area exposure, Temporary immunity, Save-result condition rider, Native condition, Information / adjudication, Modifier / resistance |
| Rewinding Step | P3 / P3-310 | Sustain |
| Scouting Eye | P3 / P3-313 | Sustain |
| Scrying Ripples | P3 / P3-314 | Sustain, Information / adjudication |
| Shift Perspective | P3 / P3-316 | Sustain, Ending or dismissal |
| Sign of Conviction | P3 / P3-317 | Sustain, Native condition, Attack and dependent result, Modifier / resistance |
| Sliding Blocks | P3 / P3-318 | Sustain |
| Spellsurge | P3 / P3-320 | Sustain, Persistent damage, Native condition, Choice / casting variant, Modifier / resistance |
| Store Time | P3 / P3-321 | Sustain, Turn trigger or boundary |
| Telekinetic Hand | P3 / P3-323 | Sustain, Ending or dismissal |
| Trade Death for Life | P3 / P3-324 | Sustain, Basic-save damage, Healing / recipient mode |
| Web of Influence | P3 / P3-327 | Sustain, Information / adjudication |
| Zenith Star | P3 / P3-329 | Sustain, Save-result condition rider, Native condition, Information / adjudication |
| Sacred Covenant | P3 / P3-330 |  |
| True Target | P3 / P3-331 |  |
| Deep Breath | P3 / P3-332 |  |
| Invisibility Cloak | P3 / P3-332 |  |
| Shroud of the Mantis | P3 / P3-332 |  |
| Water Breathing | P3 / P3-332 |  |
| Water Walk | P3 / P3-332 |  |
| Speak With Magic | P3 / P3-333 |  |
| Speak With Water | P3 / P3-333 |  |
| Speak with Animals | P3 / P3-333 |  |
| Speak with Plants | P3 / P3-333 |  |
| Speak with Stones | P3 / P3-333 |  |
| Clairaudience | P3 / P3-334 |  |
| Clairvoyance | P3 / P3-334 |  |
| Know Location | P3 / P3-334 |  |
| Rune of Observation | P3 / P3-334 |  |
| Fatal Aria | P3 / P3-335 | Temporary immunity |
| House of Imaginary Walls | P3 / P3-335 | Temporary immunity |
| Befitting Attire | P3 / P3-336 |  |
| Mirage | P3 / P3-336 |  |
| Air Walk | P3 / P3-337 |  |
| Arms of Nature | P3 / P3-338 |  |
| Artistic Recollection | P3 / P3-339 |  |
| Blackfinger's Blades | P3 / P3-340 |  |
| Blur | P3 / P3-341 |  |
| Bone Flense | P3 / P3-342 | Persistent damage |
| Boots on the Ground | P3 / P3-343 |  |
| Breadcrumbs | P3 / P3-344 |  |
| Buoyant Bubbles | P3 / P3-345 |  |
| Cauterize Wounds | P3 / P3-346 | Persistent damage |
| Cloud Current | P3 / P3-347 |  |
| Cloud Dragon's Cloak | P3 / P3-348 |  |
| Conjured Conveyance | P3 / P3-349 |  |
| Create Earthen Facsimile | P3 / P3-350 |  |
| Darkvision | P3 / P3-351 |  |
| Death's Call | P3 / P3-352 |  |
| Deceiver's Cloak | P3 / P3-353 |  |
| Disappearance | P3 / P3-354 |  |
| Divine Dragon's Watch | P3 / P3-355 |  |
| Diviner's Sight | P3 / P3-356 |  |
| Dreaming Potential | P3 / P3-357 |  |
| Echoing Weapon | P3 / P3-358 | Turn trigger or boundary |
| Empty Pack | P3 / P3-359 |  |
| Enhance Senses | P3 / P3-360 |  |
| Environmental Endurance | P3 / P3-361 |  |
| Ephemeral Tracking | P3 / P3-362 |  |
| Everlight | P3 / P3-363 |  |
| Extradimensional Cover | P3 / P3-364 |  |
| Faerie Fire | P3 / P3-365 |  |
| Fated Confrontation | P3 / P3-366 | Persistent damage |
| Fey Glamour | P3 / P3-367 |  |
| Filter Air | P3 / P3-368 |  |
| Flame Wisp | P3 / P3-369 |  |
| Gentle Landing | P3 / P3-370 |  |
| Ghostly Weapon | P3 / P3-371 |  |
| Guiding Star | P3 / P3-372 |  |
| Hunter's Vision | P3 / P3-373 |  |
| Illusory Scene | P3 / P3-374 |  |
| Indestructibility | P3 / P3-375 |  |
| Instant Armor | P3 / P3-376 |  |
| Instant Pottery | P3 / P3-377 |  |
| Interdisciplinary Incantation | P3 / P3-378 | Turn trigger or boundary |
| Interposing Earth | P3 / P3-379 |  |
| Invent Code | P3 / P3-380 |  |
| Item Facade | P3 / P3-381 |  |
| Join Pasts | P3 / P3-382 |  |
| Lucky Break | P3 / P3-383 | Temporary immunity, Save-result condition rider |
| Mirror Image | P3 / P3-384 | Save-result condition rider |
| Mist | P3 / P3-385 |  |
| Mist Sight | P3 / P3-386 |  |
| Mud Pit | P3 / P3-387 |  |
| Negate Aroma | P3 / P3-388 |  |
| Oathkeeper's Insignia | P3 / P3-389 |  |
| Ocular Overload | P3 / P3-390 |  |
| Peaceful Rest | P3 / P3-391 |  |
| Portrait of the Artist | P3 / P3-392 |  |
| Procyal Philosophy | P3 / P3-393 |  |
| Proliferating Eyes | P3 / P3-394 |  |
| Protector Tree | P3 / P3-395 |  |
| Qi Rush | P3 / P3-396 | Turn trigger or boundary |
| Quick Sort | P3 / P3-397 |  |
| Recall Legacy | P3 / P3-398 |  |
| Redact | P3 / P3-399 |  |
| Resplendent Mansion | P3 / P3-400 |  |
| Restyle | P3 / P3-401 |  |
| Reverse Gravity | P3 / P3-402 |  |
| Ritual Obstruction | P3 / P3-403 |  |
| Seashell of Stolen Sound | P3 / P3-404 |  |
| Share Life | P3 / P3-405 |  |
| Show the Way | P3 / P3-406 |  |
| Siege Weapon's Blessing | P3 / P3-407 |  |
| Sigil | P3 / P3-408 |  |
| Sky Sight | P3 / P3-409 |  |
| Soothing Blossoms | P3 / P3-410 | Turn trigger or boundary, Persistent damage, Delegated affliction |
| Spirit Veil | P3 / P3-411 |  |
| Status | P3 / P3-412 |  |
| Temporal Twin | P3 / P3-413 | Turn trigger or boundary, Temporary immunity |
| Temporary Tool | P3 / P3-414 |  |
| Tentacular Limbs | P3 / P3-415 |  |
| Tracing Bond | P3 / P3-416 |  |
| Travel by Turtle | P3 / P3-417 |  |
| Trickster's Feathers | P3 / P3-418 |  |
| Umbral Extraction | P3 / P3-419 |  |
| Unfettered Pack | P3 / P3-420 |  |
| Uplifting Overture | P3 / P3-421 |  |
| Ventriloquism | P3 / P3-422 |  |
| Vibrant Thorns | P3 / P3-423 | Turn trigger or boundary |
| Wall of Metal | P3 / P3-424 |  |
| Wall of Shrubs | P3 / P3-425 |  |
| Warped Terrain | P3 / P3-426 |  |
| Whispering Quiet | P3 / P3-427 |  |
| Wisdom of the Winds | P3 / P3-428 | Incarnate arrival/departure |
| Word of Revision | P3 / P3-429 | Temporary immunity, Save-result condition rider |
| Wordsmith | P3 / P3-430 |  |
| Element Embodied | P5 / P5-001 | Area exposure, Ending or dismissal, Basic-save damage, Persistent damage, Native condition, Healing / recipient mode, Choice / casting variant, Creature transformation, Terrain, Modifier / resistance |
| Ooze Form | P5 / P5-001 | Ending or dismissal, Save-result condition rider, Native condition, Creature transformation, Information / adjudication, Modifier / resistance |
| One with Plants | P5 / P5-002 | Ending or dismissal |
| One with Stone | P5 / P5-002 | Ending or dismissal |
| Threefold Aspect | P5 / P5-002 | Sustain, Ending or dismissal, Choice / casting variant, Modifier / resistance |
| Amalgamizing Leap | P5 / P5-004 | Turn trigger or boundary, Save-result condition rider, Granted movement speed, Native condition, Choice / casting variant, Teleportation |
| Corrosive Body | P5 / P5-005 | Ending or dismissal, Creature transformation |
| Metamorphosis | P5 / P5-006 | Sustain, Area exposure, Creature transformation |
| Qi Form | P5 / P5-008 | Sustain, Aura membership, Area exposure, Granted movement speed, Counteract, Creature transformation, Modifier / resistance |
| Aerial Form | P5 / P5-009 | Ending or dismissal, Persistent damage, Native condition, Choice / casting variant, Creature transformation, Modifier / resistance |
| Angel Form | P5 / P5-009 | Ending or dismissal, Native condition, Creature transformation, Information / adjudication, Modifier / resistance |
| Animal Form | P5 / P5-009 | Ending or dismissal, Native condition, Choice / casting variant, Creature transformation |
| Daemon Form | P5 / P5-009 | Ending or dismissal, Native condition, Creature transformation, Information / adjudication, Modifier / resistance |
| Demon Form | P5 / P5-009 | Ending or dismissal, Native condition, Choice / casting variant, Creature transformation, Modifier / resistance |
| Dinosaur Form | P5 / P5-009 | Ending or dismissal, Persistent damage, Native condition, Choice / casting variant, Creature transformation |
| Dragon Form | P5 / P5-009 | Ending or dismissal, Granted movement speed, Native condition, Choice / casting variant, Creature transformation, Modifier / resistance |
| Insect Form | P5 / P5-009 | Ending or dismissal, Persistent damage, Native condition, Choice / casting variant, Creature transformation |
| Plant Form | P5 / P5-009 | Ending or dismissal, Native condition, Choice / casting variant, Creature transformation, Modifier / resistance |
| The Everfull Moon | P5 / P5-009 | Native condition, Creature transformation, Information / adjudication, Modifier / resistance |
| Ash Form | P5 / P5-010 | Healing / recipient mode, Creature transformation, Modifier / resistance |
| Sudden Swarm | P5 / P5-010 | Sustain, Basic-save damage, Native condition, Modifier / resistance |
| Unusual Anatomy | P5 / P5-010 | Modifier / resistance |
| Darkened Forest Form | P5 / P5-011 | Sustain, Creature transformation |
| Mantis Form | P5 / P5-011 |  |
| Familiar Form | P5 / P5-012 | Creature transformation |
| Magic Warrior Transformation | P5 / P5-012 | Creature transformation |
| Pest Form | P5 / P5-012 | Ending or dismissal, Granted movement speed, Creature transformation, Modifier / resistance |
| Elemental Form | P5 / P5-014 | Ending or dismissal, Persistent damage, Choice / casting variant, Creature transformation, Forced movement, Modifier / resistance |
| Tempest Form | P5 / P5-015 | Granted movement speed, Choice / casting variant, Modifier / resistance |
| Vapor Form | P5 / P5-015 | Ending or dismissal, Granted movement speed, Creature transformation, Modifier / resistance |
| Ancestral Form | P5 / P5-017 | Sustain, Granted movement speed, Creature transformation, Modifier / resistance |
| Disperse into Air | P5 / P5-019 | Creature transformation |
| Ferrous Form | P5 / P5-022 | Ending or dismissal, Native condition, Healing / recipient mode, Modifier / resistance |
| Living Thunderbolt | P5 / P5-025 | Area exposure, Basic-save damage, Granted movement speed, Native condition, Creature transformation, Modifier / resistance |
| Migration | P5 / P5-026 | Sustain, Granted movement speed |
| Shrink Item | P5 / P5-030 | Ending or dismissal |
| Tiny Wings | P5 / P5-033 | Granted movement speed, Modifier / resistance |
| Reanimate Foe | P6 / P6-002 | Save-result condition rider, Healing / recipient mode, Created entities |
| Conglomerate of Limbs | P6 / P6-003 | Save-result condition rider, Native condition, Attack and dependent result, Created entities |
| Recurring Nightmare | P6 / P6-003 | Sustain, Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Attack and dependent result, Created entities |
| Create Thrall | P6 / P6-007 | Created entities |
| Horde of Underlings | P6 / P6-008 | Sustain, Created entities |
| Perfected Thrall | P6 / P6-009 | Created entities |
| Skeletal Lancers | P6 / P6-010 | Attack and dependent result, Created entities |
| Holy Host | P6 / P6-011 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Healing / recipient mode, Choice / casting variant, Incarnate arrival/departure, Forced movement, Information / adjudication, Modifier / resistance |
| Incarnate Kaiju | P6 / P6-011 | Turn trigger or boundary, Area exposure, Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Forced movement, Modifier / resistance |
| Pest Swarm | P6 / P6-011 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Terrain, Delegated affliction, Modifier / resistance |
| Unholy Army | P6 / P6-011 | Area exposure, Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Modifier / resistance |
| Incarnate Deific Herald | P6 / P6-012 | Save-result condition rider, Basic-save damage, Native condition, Healing / recipient mode, Counteract, Incarnate arrival/departure |
| Summon Elemental Herald | P6 / P6-012 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Terrain, Forced movement, Modifier / resistance |
| Beseech Arcanotheign | P6 / P6-013 | Save-result condition rider, Basic-save damage, Native condition, Healing / recipient mode, Incarnate arrival/departure |
| Call Fluxwraith | P6 / P6-014 | Condition-dependent lifetime, Turn trigger or boundary, Save-result condition rider, Native condition, Incarnate arrival/departure, Information / adjudication |
| Conquering Soldiers | P6 / P6-015 | Save-result condition rider, Native condition, Healing / recipient mode, Incarnate arrival/departure, Modifier / resistance |
| Final Fate of the Locust Host | P6 / P6-016 | Save-result condition rider, Basic-save damage, Persistent damage, Granted movement speed, Native condition, Incarnate arrival/departure |
| Incarnate Ancient Specter | P6 / P6-018 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Incarnate arrival/departure |
| Incarnate Archmage | P6 / P6-019 | Native condition, Choice / casting variant, Incarnate arrival/departure |
| Incarnate Draconic Legion | P6 / P6-020 | Basic-save damage, Choice / casting variant, Incarnate arrival/departure |
| Summon Ancient Fleshforged | P6 / P6-022 | Save-result condition rider, Basic-save damage, Native condition, Attack and dependent result, Choice / casting variant, Incarnate arrival/departure |
| Summon Irii | P6 / P6-023 | Turn trigger or boundary, Incarnate arrival/departure |
| Summon Oliphaunt of Jandelay | P6 / P6-024 | Basic-save damage, Incarnate arrival/departure, Forced movement |
| Summon Healing Servitor | P6 / P6-031 | Basic-save damage, Healing / recipient mode, Incarnate arrival/departure |
| Summon Stampede | P6 / P6-032 | Area exposure, Save-result condition rider, Basic-save damage, Native condition, Counteract, Incarnate arrival/departure |
| Summon Animal | P6 / P6-033 | Creature creation |
| Summon Celestial | P6 / P6-033 | Creature creation |
| Summon Construct | P6 / P6-033 | Creature creation |
| Summon Dragon | P6 / P6-033 | Creature creation |
| Summon Elemental | P6 / P6-033 | Creature creation |
| Summon Entity | P6 / P6-033 | Creature creation |
| Summon Fey | P6 / P6-033 | Creature creation |
| Summon Fiend | P6 / P6-033 | Creature creation |
| Summon Giant | P6 / P6-033 | Creature creation |
| Summon Monitor | P6 / P6-033 | Creature creation |
| Summon Plant or Fungus | P6 / P6-033 | Creature creation |
| Summon Undead | P6 / P6-033 | Creature creation |
| Summon Anarch | P6 / P6-034 | Creature creation |
| Summon Axiom | P6 / P6-034 | Creature creation |
| Summon Lesser Servitor | P6 / P6-034 | Creature creation |
| Phantasmal Minion | P6 / P6-035 | Created entities |
| Glacial Skewer | P7 / P7-004 | Native condition, Attack and dependent result, Forced movement |
| Banishing Touch | P7 / P7-005 | Attack and dependent result, Forced movement |
| Shadow Strike | P7 / P7-006 | Attack and dependent result, Forced movement |
| Hydraulic Push | P7 / P7-007 | Attack and dependent result, Forced movement |
| Fractious Echo | P7 / P7-008 | Attack and dependent result, Forced movement |
| Turbulent Tide | P7 / P7-008 | Save-result condition rider, Attack and dependent result, Forced movement, Movement action |
| Imaginary Weapon | P7 / P7-010 | Attack and dependent result, Forced movement |
| Comet Charge | P7 / P7-012 | Persistent damage, Native condition, Attack and dependent result, Choice / casting variant, Movement action, Modifier / resistance |
| Zephyr Slip | P7 / P7-014 | Area exposure, Movement action |
| Agile Feet | P7 / P7-015 | Granted movement speed, Movement action, Modifier / resistance |
| Augmented Body | P7 / P7-015 | Ending or dismissal, Granted movement speed, Choice / casting variant, Movement action, Modifier / resistance |
| Flowing Strike | P7 / P7-016 | Attack and dependent result, Movement action |
| Canopy Crawler | P7 / P7-018 | Granted movement speed, Movement action |
| Connective Current | P7 / P7-019 | Turn trigger or boundary, Movement action |
| Earthbreaker Stride | P7 / P7-020 | Ending or dismissal, Granted movement speed, Movement action |
| Forceful Hand | P7 / P7-021 | Sustain, Turn trigger or boundary, Basic-save damage, Attack and dependent result, Movement action, Modifier / resistance |
| Hippocampus Retreat | P7 / P7-022 | Attack and dependent result, Movement action, Modifier / resistance |
| Lotus Walk | P7 / P7-025 | Turn trigger or boundary, Ending or dismissal, Movement action |
| Path of Least Resistance | P7 / P7-027 | Movement action |
| Sudden Shift | P7 / P7-030 | Movement action |
| The Four Hunters | P7 / P7-031 | Granted movement speed, Movement action, Modifier / resistance |
| Unfolding Wind Rush | P7 / P7-034 | Choice / casting variant, Movement action |
| Wood Walk | P7 / P7-035 | Sustain, Movement action |
| Illusory Object | P7 / P7-036 | Object / structure creation |
| Shadow Illusion | P7 / P7-036 | Object / structure creation |
| Creation | P7 / P7-037 | Object / structure creation |
| False Nature | P7 / P7-038 | Ending or dismissal, Object / structure creation |
| Soft Landing | P7 / P7-039 | Object / structure creation |
| Soulshelter Vessel | P7 / P7-040 | Healing / recipient mode, Object / structure creation |
| Far-Flung Fetch | P7 / P7-041 | Teleportation |
| Reclined Apport | P7 / P7-041 | Teleportation |
| Snare Hopping | P7 / P7-041 | Teleportation |
| Forest of Gates | P7 / P7-042 | Save-result condition rider, Native condition, Healing / recipient mode, Choice / casting variant, Incarnate arrival/departure |
| Maze of Locked Doors | P7 / P7-043 | Save-result condition rider, Counteract, Teleportation |
| Hop, Skip, Jump | P7 / P7-046 | Turn trigger or boundary |
| Rally Point | P7 / P7-046 | Teleportation |
| Shadow Jump | P7 / P7-046 | Turn trigger or boundary, Incarnate arrival/departure, Teleportation |
| Spiritual Transport | P7 / P7-047 | Teleportation |
| Dimensional Steps | P7 / P7-048 | Teleportation |
| Shrink the Span | P7 / P7-048 | Teleportation |
| Blink Charge | P7 / P7-049 | Save-result condition rider, Attack and dependent result, Teleportation |
| Fire's Pathway | P7 / P7-050 | Area exposure, Teleportation, Movement action |
| Nature's Pathway | P7 / P7-050 | Area exposure, Teleportation, Movement action |
| Space Fold Gate | P7 / P7-051 | Area exposure, Choice / casting variant, Teleportation |
| Tesseract Tunnel | P7 / P7-051 | Turn trigger or boundary, Area exposure, Teleportation |
| Take Your Places | P7 / P7-052 | Temporary immunity |
| Translocate | P7 / P7-052 | Temporary immunity |
| Dimensional Assault | P7 / P7-053 | Attack and dependent result, Teleportation |
| Ethereal Jaunt | P7 / P7-057 | Ending or dismissal, Movement action |
| Familiar's Call | P7 / P7-058 | Teleportation |
| Far Reach | P7 / P7-059 |  |
| Fetch | P7 / P7-060 | Teleportation |
| Gate | P7 / P7-062 |  |
| Interplanar Teleport | P7 / P7-064 | Teleportation |
| King's Castle | P7 / P7-065 |  |
| Magic Mailbox | P7 / P7-066 |  |
| Quandary | P7 / P7-067 | Ending or dismissal, Save-result condition rider, Teleportation |
| Return Beacon | P7 / P7-068 | Incarnate arrival/departure, Information / adjudication |
| Teleport | P7 / P7-069 | Incarnate arrival/departure, Teleportation |
| Terrain Transposition | P7 / P7-070 |  |
| Thoughtful Gift | P7 / P7-071 | Teleportation |
| Umbral Journey | P7 / P7-073 | Ending or dismissal |
| Storm of Vengeance | P7 / P7-074 | Sustain, Temporary immunity, Basic-save damage, Native condition, Choice / casting variant, Terrain, Modifier / resistance |
| Wrathful Storm | P7 / P7-074 | Sustain, Basic-save damage, Choice / casting variant, Terrain, Modifier / resistance |
| Earthworks | P7 / P7-075 | Terrain |
| Elemental Breath | P7 / P7-075 | Save-result condition rider, Basic-save damage, Native condition, Choice / casting variant, Terrain, Forced movement |
| Nature's Reprisal | P7 / P7-075 | Area exposure, Terrain |
| Punishing Winds | P7 / P7-075 | Area exposure, Terrain |
| Restore Ground | P7 / P7-075 | Terrain, Information / adjudication |
| Spike Stones | P7 / P7-075 | Area exposure, Terrain |
| Whirlwind | P7 / P7-076 | Sustain, Area exposure, Ending or dismissal, Save-result condition rider, Granted movement speed, Terrain |
| Planar Collision | P7 / P7-078 | Area exposure, Save-result condition rider, Basic-save damage, Choice / casting variant, Terrain, Forced movement |
| Rubble Step | P7 / P7-079 | Choice / casting variant, Terrain |
| Elemental Confluence | P7 / P7-081 | Sustain, Save-result condition rider, Basic-save damage, Persistent damage, Attack and dependent result, Terrain, Modifier / resistance |
| Pierce the Sky | P7 / P7-082 | Area exposure, Save-result condition rider, Native condition, Attack and dependent result, Terrain |
| Rainbow Fumarole | P7 / P7-083 | Area exposure, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Terrain |
| 500 Toads | P7 / P7-091 | Terrain |
| Blast of the Bellows | P7 / P7-093 | Area exposure, Save-result condition rider, Terrain |
| Crystallized Vapors | P7 / P7-094 | Sustain, Attack and dependent result, Terrain |
| Elemental Gift | P7 / P7-096 | Turn trigger or boundary, Persistent damage, Granted movement speed, Native condition, Choice / casting variant, Terrain, Modifier / resistance |
| Helpful Wood Spirits | P7 / P7-101 | Sustain, Native condition, Choice / casting variant, Terrain, Information / adjudication |
| Pillar of Water | P7 / P7-104 | Choice / casting variant, Terrain |
| River Carving Mountains | P7 / P7-106 | Sustain, Turn trigger or boundary, Granted movement speed, Terrain, Movement action, Modifier / resistance |
| Sawtooth Terrain | P7 / P7-107 | Area exposure, Save-result condition rider, Persistent damage, Healing / recipient mode, Terrain, Modifier / resistance |
| Solid Fog | P7 / P7-109 | Ending or dismissal, Terrain |
| Tacky Pine Sap | P7 / P7-111 | Persistent damage, Terrain |
| Transmute Rock And Mud | P7 / P7-113 | Save-result condition rider, Basic-save damage, Native condition, Choice / casting variant, Terrain, Movement action |
| Verdant Sprout | P7 / P7-114 | Terrain |
| Prismatic Wall | P7 / P7-115 | Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Counteract, Wall / barrier |
| Wall Of Mirrors | P7 / P7-116 | Basic-save damage, Wall / barrier |
| Wall of Force | P7 / P7-116 | Counteract, Wall / barrier |
| Wall of Ice | P7 / P7-116 | Wall / barrier, Modifier / resistance |
| Wall of Shadow | P7 / P7-116 | Wall / barrier |
| Wall of Stone | P7 / P7-116 | Wall / barrier |
| Wall of Thorns | P7 / P7-116 | Area exposure, Wall / barrier, Terrain |
| Chromatic Wall | P7 / P7-117 | Save-result condition rider, Native condition, Counteract, Wall / barrier, Information / adjudication, Modifier / resistance |
| Wall of Fire | P7 / P7-117 | Turn trigger or boundary, Wall / barrier |
| Wall of Virtue | P7 / P7-117 | Turn trigger or boundary, Counteract, Wall / barrier |
| Invisibility Curtain | P7 / P7-118 | Wall / barrier |
| Magic Passage | P7 / P7-119 | Area exposure, Ending or dismissal, Wall / barrier |
| Wall of Flesh | P7 / P7-121 | Area exposure, Save-result condition rider, Native condition, Healing / recipient mode, Attack and dependent result, Choice / casting variant, Wall / barrier, Modifier / resistance |
| Drain Planar Connection | P8 / P8-001 | Save-result condition rider |
| Footholds and Foothills | P8 / P8-001 | Save-result condition rider, Terrain |
| Oblivious Expulsion | P8 / P8-002 | Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Information / adjudication |
| Fortifying Brew | P8 / P8-004 | Save-result condition rider, Native condition, Counteract, Delegated affliction, Modifier / resistance |
| Awaken Curse | P8 / P8-006 | Save-result condition rider, Counteract |
| Binding Circle | P8 / P8-008 | Save-result condition rider |
| Confound the Eye and Confuse the Mind | P8 / P8-010 | Save-result condition rider |
| Geas | P8 / P8-013 | Save-result condition rider, Native condition, Counteract, Delegated affliction, Modifier / resistance |
| Loyalty's Ward | P8 / P8-016 | Area exposure, Save-result condition rider |
| Mindscape Door | P8 / P8-017 | Area exposure, Save-result condition rider |
| Mindscape Shift | P8 / P8-018 | Area exposure, Save-result condition rider, Teleportation |
| Purify Tanglebriar | P8 / P8-024 | Save-result condition rider, Terrain, Information / adjudication, Modifier / resistance |
| Rest Eternal | P8 / P8-027 | Save-result condition rider, Native condition, Counteract, Information / adjudication |
| Secure Siege Weapons | P8 / P8-031 | Save-result condition rider |
| Separation | P8 / P8-032 | Turn trigger or boundary, Save-result condition rider, Counteract, Choice / casting variant |
| Teleportation Circle | P8 / P8-035 | Turn trigger or boundary, Save-result condition rider, Incarnate arrival/departure, Teleportation |
| Terminate Bloodline | P8 / P8-036 | Recurring saving throw, Save-result condition rider, Native condition, Counteract, Delegated affliction |
| Wish | P8 / P8-039 | Save-result condition rider |
| All is One, One is All | P9 / P9-001 |  |
| Alter Reality | P9 / P9-002 |  |
| Manifestation | P9 / P9-002 |  |
| Miracle | P9 / P9-002 |  |
| Primal Phenomenon | P9 / P9-002 |  |
| Allfood | P9 / P9-003 |  |
| Create Food | P9 / P9-003 |  |
| Foraging Friends | P9 / P9-003 |  |
| Ancestral Defense | P9 / P9-004 |  |
| Hunter's Luck | P9 / P9-004 |  |
| Extend Blood Magic | P9 / P9-005 |  |
| Extend Spell | P9 / P9-005 |  |
| Extend Boost | P9 / P9-006 |  |
| Lingering Composition | P9 / P9-006 |  |
| Augury | P9 / P9-007 |  |
| Champion's Sacrifice | P9 / P9-008 | Save-result condition rider |
| Cleanse Cuisine | P9 / P9-009 |  |
| Counter Performance | P9 / P9-010 |  |
| Create Water | P9 / P9-011 |  |
| Decompose | P9 / P9-012 |  |
| Desperate Repair | P9 / P9-013 |  |
| Divine Inspiration | P9 / P9-014 |  |
| Draw Moisture | P9 / P9-015 |  |
| Familiar's Resurrection | P9 / P9-016 |  |
| Freeze Time | P9 / P9-017 |  |
| Friendfetch | P9 / P9-018 |  |
| Frost's Touch | P9 / P9-019 |  |
| Genie's Veil | P9 / P9-020 |  |
| Jump | P9 / P9-021 |  |
| Ki Cutting Sight | P9 / P9-022 |  |
| Martyr's Intervention | P9 / P9-023 |  |
| Ode to Ouroboros | P9 / P9-024 |  |
| Patron's Puppet | P9 / P9-025 |  |
| Perfect Strike | P9 / P9-026 |  |
| Propulsive Breeze | P9 / P9-027 |  |
| Protector's Sacrifice | P9 / P9-028 |  |
| Remake | P9 / P9-029 |  |
| Return the Favor | P9 / P9-030 |  |
| Rising Surf | P9 / P9-031 |  |
| Sanguine Transference | P9 / P9-032 |  |
| Shape Wood | P9 / P9-033 |  |
| Share Burden | P9 / P9-034 |  |
| Shepherd of Souls | P9 / P9-035 |  |
| Spontaneous Cartography | P9 / P9-036 |  |
| Stabilize | P9 / P9-037 |  |
| Unfolding Wind Blitz | P9 / P9-038 |  |
| Unity | P9 / P9-039 |  |
| Weave Wood | P9 / P9-040 |  |
| Wooden Double | P9 / P9-041 |  |
| Zeal for Battle | P9 / P9-042 |  |

