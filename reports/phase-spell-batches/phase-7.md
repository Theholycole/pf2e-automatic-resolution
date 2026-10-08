# Phase 7: Spatial effects and movement

212 primary worklist entries; 230 entries with this phase signal including cross-phase dependencies. Assignments are planning candidates, not verified semantic classifications.

Descriptions are grouped first by rule family, then by normalized word/bigram similarity. Each cohort has at most 12 entries. Similarity is a discovery aid; check the full source and differing values/branches before sharing implementation or evidence.

## Rule-family index

| Rule family | Spells | Not enabled | Wording cohorts |
| --- | --- | --- | --- |
| Forced movement | 36 | 0 | 11 |
| Movement action | 29 | 0 | 24 |
| Object / structure creation | 6 | 0 | 5 |
| Teleportation | 48 | 0 | 33 |
| Terrain | 76 | 0 | 41 |
| Wall / barrier | 17 | 0 | 8 |


## P7-001 — Forced movement: Pummeling Rubble

**12 spells; 0 not enabled.** Suggested source-reading anchor: Pummeling Rubble. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Forced movement

**Anchor wording:** Failure The creature takes full damage and is pushed 5 feet away from you..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Pummeling Rubble](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/pummeling-rubble.json) | 1 | Enabled route | 2 | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Gale Blast](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/gale-blast.json) | 1 | Enabled route | 2 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Repelling Pulse](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/repelling-pulse.json) | 5 | Enabled route | 2 | 0.85 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Tornadic Gale](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/tornadic-gale.json) | 5 | Enabled route | 2, 3 | 0.82 | reflex; non-basic/no save; duration outcome/text; target source/area/text |
| [Begone](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/begone.json) | 3 | Enabled route | 2 | 0.78 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Qi Blast](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/qi-blast.json) | 3 | Enabled route | 2 | 0.73 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Pushing Gust](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/pushing-gust.json) | 1 | Enabled route | 2 | 0.70 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Geyser](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/geyser.json) | 5 | Enabled route | 2, 3 | 0.57 | reflex; non-basic/no save; duration 1 round; target source/area/text |
| [Unbreaking Wave Advance](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/unbreaking-wave-advance.json) | 3 | Enabled route | 2 | 0.53 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |
| [Airburst](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/airburst.json) | 1 | Enabled route | 2, 3 | 0.42 | fortitude; non-basic/no save; duration outcome/text; target all creatures and unattended objects |
| [Kinetic Ram](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/kinetic-ram.json) | 1 | Enabled route | 2 | 0.33 | fortitude; non-basic/no save; duration outcome/text; target 1 or more creatures |
| [Glacial Skewer](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/glacial-skewer.json) | 5 | Enabled route | 2, 3, 4 | 0.29 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P7-002 — Forced movement: Buffeting Winds

**5 spells; 0 not enabled.** Suggested source-reading anchor: Buffeting Winds. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Forced movement

**Anchor wording:** On a failure, undead creatures are also knocked back 5 feet (or 10 feet on a critical failure)..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Buffeting Winds](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/buffeting-winds.json) | 1 | Enabled route | 2 | 1.00 | reflex; basic; duration outcome/text; target source/area/text |
| [Hydraulic Torrent](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/hydraulic-torrent.json) | 4 | Enabled route | 2 | 0.54 | fortitude; basic; duration outcome/text; target source/area/text |
| [Psychic Outburst](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/psychic-outburst.json) | 5 | Enabled route | 2 | 0.19 | will; basic; duration outcome/text; target source/area/text |
| [Gravitational Pull](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/gravitational-pull.json) | 1 | Enabled route | 2 | 0.18 | fortitude; non-basic/no save; duration outcome/text; target 1 creature |
| [Banishing Touch](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/banishing-touch.json) | 2 | Enabled route | 4 | 0.17 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P7-003 — Forced movement: Retrieving Hook

**5 spells; 0 not enabled.** Suggested source-reading anchor: Retrieving Hook. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Forced movement

**Anchor wording:** Success The target is pulled 5 feet toward you..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Retrieving Hook](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/retrieving-hook.json) | 2 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature or an undattended object of 2 Bulk or less |
| [Shadow Strike](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/shadow-strike.json) | 4 | Enabled route | 2, 4 | 0.40 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |
| [Door to Beyond](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/door-to-beyond.json) | 4 | Enabled route | 2, 3 | 0.28 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |
| [Inevitable Destination](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/inevitable-destination.json) | 4 | Enabled route | 2, 3 | 0.27 | will; non-basic/no save; duration 2 rounds; target you and 1 enemy |
| [Undertow](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/undertow.json) | 3 | Enabled route | 2, 3 | 0.22 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |


## P7-004 — Forced movement: Heaving Earth

**4 spells; 0 not enabled.** Suggested source-reading anchor: Heaving Earth. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Forced movement

**Anchor wording:** A creature that fails this save is pushed 10 feet away from you..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Heaving Earth](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/heaving-earth.json) | 7 | Enabled route | 2 | 1.00 | reflex; basic; duration outcome/text; target 1 creature or object on the ground |
| [Blastback](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/blastback.json) | 3 | Enabled route | 2 | 0.22 | reflex; basic; duration outcome/text; target source/area/text |
| [Elemental Annihilation Wave](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/elemental-annihilation-wave.json) | 3 | Enabled route | 2 | 0.16 | reflex; basic; duration outcome/text; target source/area/text |
| [Unfolding Wind Buffet](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/unfolding-wind-buffet.json) | 5 | Enabled route | 2 | 0.15 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |


## P7-005 — Forced movement: Unseasonable Squall

**3 spells; 0 not enabled.** Suggested source-reading anchor: Unseasonable Squall. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Forced movement

**Anchor wording:** Critical Failure The creature is pushed 30 feet away from the center of the burst, is knocked Prone, and takes 2d6 bludgeoning damage..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unseasonable Squall](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/unseasonable-squall.json) | 3 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration until the start of your next turn; target source/area/text |
| [Gust of Wind](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/gust-of-wind.json) | 1 | Enabled route | 2, 3 | 0.34 | fortitude; non-basic/no save; duration until the start of your next turn; target source/area/text |
| [Hydraulic Push](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/hydraulic-push.json) | 1 | Enabled route | 2, 4 | 0.15 | no primary save; non-basic/no save; duration outcome/text; target 1 creature or unattended object |


## P7-006 — Forced movement: Fractious Echo

**2 spells; 0 not enabled.** Suggested source-reading anchor: Fractious Echo. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Attack and dependent result, Forced movement

**Anchor wording:** If the Strike hits, the target is pushed 10 feet away from you (20 feet on a critical success) and leaves behind a spiritual echo of itself in its original space that lasts for 1 round.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fractious Echo](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/fractious-echo.json) | 3 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |
| [Turbulent Tide](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/turbulent-tide.json) | 1 | Enabled route | 2, 4 | 0.19 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |


## P7-007 — Forced movement: Arcane Explosion

**1 spells; 0 not enabled.** Suggested source-reading anchor: Arcane Explosion. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Area exposure, Basic-save damage, Native condition, Forced movement, Modifier / resistance

**Anchor wording:** Creatures that fail are also pushed 10 feet directly away from you; creatures that can't complete this forced movement are knocked Prone (but creatures who reduce this movement, such as with an ability or feat, don't fall prone).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Arcane Explosion](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/arcane-explosion.json) | 9 | Enabled route | 2, 3 | 1.00 | fortitude; basic; duration outcome/text; target source/area/text |


## P7-008 — Forced movement: Blessed Boundary

**1 spells; 0 not enabled.** Suggested source-reading anchor: Blessed Boundary. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Forced movement

**Anchor wording:** Failure The creature takes full damage, is pushed up to 10 feet in the direction of your choice, and ends its movement..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Blessed Boundary](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/blessed-boundary.json) | 6 | Enabled route | 2, 3 | 1.00 | reflex; basic; duration 1 minute; target source/area/text |


## P7-009 — Forced movement: Boneshaker

**1 spells; 0 not enabled.** Suggested source-reading anchor: Boneshaker. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Save-result condition rider, Native condition, Forced movement

**Anchor wording:** If you cast the 3-action version, you can move the target up to 5 feet; it can choose to fall Prone to avoid moving..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Boneshaker](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/boneshaker.json) | 2 | Enabled route | 2 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 creature with a skeleton |


## P7-010 — Forced movement: Imaginary Weapon

**1 spells; 0 not enabled.** Suggested source-reading anchor: Imaginary Weapon. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Attack and dependent result, Forced movement

**Anchor wording:** On a critical success, you deal double damage and can choose to detonate your weapon to push the target 10 feet away from you..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Imaginary Weapon](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/imaginary-weapon.json) | 1 | Enabled route | 2, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P7-011 — Forced movement: Life's Flowing River

**1 spells; 0 not enabled.** Suggested source-reading anchor: Life's Flowing River. This is not a verified-test designation.

**Test contract:** Direction/distance; degree scaling; size restrictions; obstacles/falls; placement review; per-target movement.

**Shared signals:** Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Forced movement

**Anchor wording:** Critical Failure As failure, but the creature is pushed 20 feet along the river's path in the direction of flow.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Life's Flowing River](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/lifes-flowing-river.json) | 4 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration 1 minute; target source/area/text |


## P7-012 — Movement action: Pyrefowl Rebuke

**3 spells; 0 not enabled.** Suggested source-reading anchor: Pyrefowl Rebuke. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Movement action

**Anchor wording:** Heightened (+2) The damage increases by 1d6, and the maximum distance you can Fly increases by 5 feet..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Pyrefowl Rebuke](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/pyrefowl-rebuke.json) | 2 | Enabled route | 2, 3 | 1.00 | reflex; basic; duration outcome/text; target source/area/text |
| [Zephyr Slip](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/zephyr-slip.json) | 4 | Note only (resolved) | 3, 4 | 0.20 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Airlift](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/airlift.json) | 4 | Note only (resolved) | 2 | 0.15 | reflex; non-basic/no save; duration outcome/text; target source/area/text |


## P7-013 — Movement action: Agile Feet

**2 spells; 0 not enabled.** Suggested source-reading anchor: Agile Feet. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Granted movement speed, Movement action, Modifier / resistance

**Anchor wording:** As part of casting agile feet, you can Stride, Step, or [[/act tumble-through]]; you can instead Burrow, Climb, Fly, or Swim if you have the appropriate Speed..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Agile Feet](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/agile-feet.json) | 1 | Enabled route | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the end of the current turn; target source/area/text |
| [Augmented Body](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/augmented-body.json) | 1 | Partial Effect | 2, 3, 4 | 0.18 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-014 — Movement action: Blazing Dive

**2 spells; 0 not enabled.** Suggested source-reading anchor: Blazing Dive. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Movement action

**Anchor wording:** You Fly 15 feet straight up into the air, then Fly in a straight line to an empty space of your choice on the ground within 60 feet.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Blazing Dive](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/blazing-dive.json) | 3 | Enabled route | 2 | 1.00 | reflex; basic; duration outcome/text; target source/area/text |
| [Comet Charge](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/comet-charge.json) | 7 | Enabled route | 2, 3, 4 | 0.21 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P7-015 — Movement action: Flashy Disappearance

**2 spells; 0 not enabled.** Suggested source-reading anchor: Flashy Disappearance. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Movement action

**Anchor wording:** You Stride.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Flashy Disappearance](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/flashy-disappearance.json) | 1 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Flowing Strike](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/flowing-strike.json) | 5 | Enabled route | 2, 4 | 0.27 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-016 — Movement action: Agitate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Agitate. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Movement action

**Anchor wording:** During the duration, the target must Stride, Fly, or Swim at least once each turn or take 2d8 mental damage at the end of its turn.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Agitate](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/agitate.json) | 1 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P7-017 — Movement action: Canopy Crawler

**1 spells; 0 not enabled.** Suggested source-reading anchor: Canopy Crawler. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Granted movement speed, Movement action

**Anchor wording:** The target can Climb with a hand occupied (or two hands occupied if they have the Combat Climber feat)..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Canopy Crawler](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/canopy-crawler.json) | 2 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target yourself or your animal companion |


## P7-018 — Movement action: Connective Current

**1 spells; 0 not enabled.** Suggested source-reading anchor: Connective Current. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Turn trigger or boundary, Movement action

**Anchor wording:** When the target takes a move action, you can Stride up to half your Speed in the same direction as the target as a reaction..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Connective Current](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/connective-current.json) | 1 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 enemy |


## P7-019 — Movement action: Earth and Sky

**1 spells; 0 not enabled.** Suggested source-reading anchor: Earth and Sky. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Ending or dismissal, Save-result condition rider, Movement action

**Anchor wording:** You fly directly upward, up to 100 feet into the air.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Earth and Sky](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/earth-and-sky.json) | 6 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |


## P7-020 — Movement action: Earthbreaker Stride

**1 spells; 0 not enabled.** Suggested source-reading anchor: Earthbreaker Stride. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Ending or dismissal, Granted movement speed, Movement action

**Anchor wording:** You gain a burrow Speed equal to your land Speed; you can burrow through solid stone and structures made entirely of rock or stone, though you treat such substances as difficult terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Earthbreaker Stride](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/earthbreaker-stride.json) | 8 | Partial Effect | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P7-021 — Movement action: Forceful Hand

**1 spells; 0 not enabled.** Suggested source-reading anchor: Forceful Hand. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Sustain, Turn trigger or boundary, Basic-save damage, Attack and dependent result, Movement action, Modifier / resistance

**Anchor wording:** For instance, if you Step, Stride, and Sustain the Spell, you use the entry for move actions, so the hand provides standard cover..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Forceful Hand](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/forceful-hand.json) | 5 | Enabled route | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-022 — Movement action: Hippocampus Retreat

**1 spells; 0 not enabled.** Suggested source-reading anchor: Hippocampus Retreat. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Attack and dependent result, Movement action, Modifier / resistance

**Anchor wording:** Then, Swim up to 30 feet; if you already have a swim Speed, you can Swim up to your Speed with a +10-foot circumstance bonus.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Hippocampus Retreat](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/hippocampus-retreat.json) | 1 | Enabled route | 2, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P7-023 — Movement action: Inside Ropes

**1 spells; 0 not enabled.** Suggested source-reading anchor: Inside Ropes. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Save-result condition rider, Movement action, Modifier / resistance

**Anchor wording:** You can use the guts as 50 feet of rope to help you Climb, and they help attach you to a wall.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Inside Ropes](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/inside-ropes.json) | 1 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P7-024 — Movement action: Loose Time's Arrow

**1 spells; 0 not enabled.** Suggested source-reading anchor: Loose Time's Arrow. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Native condition, Movement action

**Anchor wording:** ou pluck the time stream like a bow—pull one string back, release, and watch a creature fly.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Loose Time's Arrow](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/loose-times-arrow.json) | 2 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target up to 6 creatures |


## P7-025 — Movement action: Lotus Walk

**1 spells; 0 not enabled.** Suggested source-reading anchor: Lotus Walk. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Turn trigger or boundary, Ending or dismissal, Movement action

**Anchor wording:** You can go underwater if you wish, but in that case, you must Swim normally.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Lotus Walk](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/lotus-walk.json) | 3 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-026 — Movement action: Mirror's Misfortune

**1 spells; 0 not enabled.** Suggested source-reading anchor: Mirror's Misfortune. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Ending or dismissal, Save-result condition rider, Movement action

**Anchor wording:** As you do, you can Step to any adjacent square.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Mirror's Misfortune](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/mirrors-misfortune.json) | 4 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration 1 minute; target source/area/text |


## P7-027 — Movement action: Path of Least Resistance

**1 spells; 0 not enabled.** Suggested source-reading anchor: Path of Least Resistance. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Movement action

**Anchor wording:** You Stride twice to one of the spaces, determined randomly by the GM from among the paths you chose.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Path of Least Resistance](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/path-of-least-resistance.json) | 4 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-028 — Movement action: Steel Fortifications

**1 spells; 0 not enabled.** Suggested source-reading anchor: Steel Fortifications. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Persistent damage, Native condition, Movement action

**Anchor wording:** A Medium or smaller creature can climb a fortification with a successful athletics|dc:15 check..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Steel Fortifications](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/steel-fortifications.json) | 2 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P7-029 — Movement action: Stormwind Flight

**1 spells; 0 not enabled.** Suggested source-reading anchor: Stormwind Flight. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Movement action

**Anchor wording:** Heightened (6th) When you fly using stormwind flight , you ignore difficult terrain from wind..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Stormwind Flight](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/stormwind-flight.json) | 4 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-030 — Movement action: Sudden Shift

**1 spells; 0 not enabled.** Suggested source-reading anchor: Sudden Shift. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Movement action

**Anchor wording:** You Step and become Concealed..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sudden Shift](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/sudden-shift.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration until the end of your next turn; target source/area/text |


## P7-031 — Movement action: The Four Hunters

**1 spells; 0 not enabled.** Suggested source-reading anchor: The Four Hunters. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Granted movement speed, Movement action, Modifier / resistance

**Anchor wording:** The target can Step as a free action and gains a +1 status bonus to Survival for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [The Four Hunters](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/the-four-hunters.json) | 3 | Enabled route | 2, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 or more creatures |


## P7-032 — Movement action: Time Jump

**1 spells; 0 not enabled.** Suggested source-reading anchor: Time Jump. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Native condition, Movement action

**Anchor wording:** ou leap through time, appearing across the battlefield in the blink of an eye.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Time Jump](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/time-jump.json) | 3 | Note only (resolved) | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-033 — Movement action: Unbreaking Wave Vapor

**1 spells; 0 not enabled.** Suggested source-reading anchor: Unbreaking Wave Vapor. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Movement action, Modifier / resistance

**Anchor wording:** After the triggering attack is complete, you can Step if the triggering attack hit or Step twice if the triggering attack missed..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unbreaking Wave Vapor](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/unbreaking-wave-vapor.json) | 5 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-034 — Movement action: Unfolding Wind Rush

**1 spells; 0 not enabled.** Suggested source-reading anchor: Unfolding Wind Rush. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Choice / casting variant, Movement action

**Anchor wording:** You can Stride or Step into the air during this movement, moving upward at a 45-degree angle at most; if you end your movement in the air, you fall after taking one action or when your turn ends, whichever comes first.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unfolding Wind Rush](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/unfolding-wind-rush.json) | 3 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-035 — Movement action: Wood Walk

**1 spells; 0 not enabled.** Suggested source-reading anchor: Wood Walk. This is not a verified-test designation.

**Test contract:** Movement mode/action; restrictions; intervening reactions; path/space; independent destination confirmation.

**Shared signals:** Sustain, Movement action

**Anchor wording:** ood shapes itself according to your will readily, making staircases appear as you climb up the side of a tree, automatically weaving vines into ladders, or lowering branches to lift you up to the top.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wood Walk](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/wood-walk.json) | 4 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-036 — Object / structure creation: Illusory Object

**2 spells; 0 not enabled.** Suggested source-reading anchor: Illusory Object. This is not a verified-test designation.

**Test contract:** Object eligibility/size; placement; durability; actor/token/document identity; permanent consequences.

**Shared signals:** Object / structure creation

**Anchor wording:** ou create an illusory visual image of a stationary object.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Illusory Object](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/illusory-object.json) | 1 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |
| [Shadow Illusion](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/shadow-illusion.json) | 6 | Enabled route | 3, 4 | 0.27 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-037 — Object / structure creation: Creation

**1 spells; 0 not enabled.** Suggested source-reading anchor: Creation. This is not a verified-test designation.

**Test contract:** Object eligibility/size; placement; durability; actor/token/document identity; permanent consequences.

**Shared signals:** Object / structure creation

**Anchor wording:** ou conjure a temporary object from magical energy.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Creation](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/creation.json) | 4 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P7-038 — Object / structure creation: False Nature

**1 spells; 0 not enabled.** Suggested source-reading anchor: False Nature. This is not a verified-test designation.

**Test contract:** Object eligibility/size; placement; durability; actor/token/document identity; permanent consequences.

**Shared signals:** Ending or dismissal, Object / structure creation

**Anchor wording:** ou create an illusion that makes an object seem to be something entirely different.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [False Nature](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/false-nature.json) | 4 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration until your next daily preparations; target one unattended item or one item you're holding |


## P7-039 — Object / structure creation: Soft Landing

**1 spells; 0 not enabled.** Suggested source-reading anchor: Soft Landing. This is not a verified-test designation.

**Test contract:** Object eligibility/size; placement; durability; actor/token/document identity; permanent consequences.

**Shared signals:** Object / structure creation

**Anchor wording:** ou create a magical field that buoys any creature or object falling into the area, providing a harmless landing from any height.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Soft Landing](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/soft-landing.json) | 4 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-040 — Object / structure creation: Soulshelter Vessel

**1 spells; 0 not enabled.** Suggested source-reading anchor: Soulshelter Vessel. This is not a verified-test designation.

**Test contract:** Object eligibility/size; placement; durability; actor/token/document identity; permanent consequences.

**Shared signals:** Healing / recipient mode, Object / structure creation

**Anchor wording:** You create a pool of healing within the object, which starts out with 40 HP worth of healing per Bulk of the object.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Soulshelter Vessel](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/soulshelter-vessel.json) | 5 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 10 minutes; target 1 willing creature and 1 non-magical stone object of 1 or 2 Bulk |


## P7-041 — Teleportation: Reclined Apport

**6 spells; 0 not enabled.** Suggested source-reading anchor: Reclined Apport. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Teleportation

**Anchor wording:** You teleport the target into your open hand.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Reclined Apport](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/reclined-apport.json) | 1 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 unattended object of light Bulk or less |
| [Far-Flung Fetch](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/far-flung-fetch.json) | 2 | Note only (resolved) | 4 | 0.62 | no primary save; non-basic/no save; duration outcome/text; target 1 unattended object of light Bulk or less |
| [Snare Hopping](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/snare-hopping.json) | 1 | Note only (resolved) | 4 | 0.23 | no primary save; non-basic/no save; duration outcome/text; target one snare you built |
| [Warping Pull](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/warping-pull.json) | 2 | Enabled route | 2 | 0.20 | no primary save; non-basic/no save; duration outcome/text; target 1 willing creature that would take damage from the triggering effect |
| [Sudden Transposition](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/sudden-transposition.json) | 8 | Enabled route | 2, 3 | 0.18 | fortitude; non-basic/no save; duration outcome/text; target up to 2 creatures |
| [Collective Transposition](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/collective-transposition.json) | 6 | Enabled route | 2 | 0.15 | will; non-basic/no save; duration outcome/text; target up to 2 creatures |


## P7-042 — Teleportation: Momentary Recovery

**4 spells; 0 not enabled.** Suggested source-reading anchor: Momentary Recovery. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** ou instantly teleport yourself and any items you're wearing or holding from your current space to a clear space within range that you can see.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Momentary Recovery](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/momentary-recovery.json) | 7 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Shadow Jump](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/shadow-jump.json) | 5 | Note only (resolved) | 3, 4 | 0.35 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Rally Point](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/rally-point.json) | 3 | Note only (resolved) | 3, 4 | 0.17 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Hop, Skip, Jump](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/hop-skip-jump.json) | 4 | Note only (resolved) | 3, 4 | 0.15 | no primary save; non-basic/no save; duration 3 rounds; target source/area/text |


## P7-043 — Teleportation: Spiritual Transport

**3 spells; 0 not enabled.** Suggested source-reading anchor: Spiritual Transport. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Teleportation

**Anchor wording:** ou call upon the spiritual energies surrounding you to teleport you to an unoccupied space within range that you can see.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Spiritual Transport](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/spiritual-transport.json) | 5 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Echo Jump](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/echo-jump.json) | 3 | Enabled route | 2 | 0.21 | reflex; basic; duration outcome/text; target source/area/text |
| [Rapid Retreat](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/rapid-retreat.json) | 4 | Enabled route | 2, 3 | 0.16 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-044 — Teleportation: Dimensional Steps

**2 spells; 0 not enabled.** Suggested source-reading anchor: Dimensional Steps. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Teleportation

**Anchor wording:** ou teleport to a location up to 20 feet away within your line of sight..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dimensional Steps](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/dimensional-steps.json) | 4 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Shrink the Span](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/shrink-the-span.json) | 3 | Note only (resolved) | 4 | 0.44 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-045 — Teleportation: Disruptive Transfer

**2 spells; 0 not enabled.** Suggested source-reading anchor: Disruptive Transfer. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Teleportation

**Anchor wording:** Teleport to an empty square you can see within range.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Disruptive Transfer](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/disruptive-transfer.json) | 3 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration outcome/text; target source/area/text |
| [Blink Charge](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/blink-charge.json) | 5 | Enabled route | 4 | 0.19 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P7-046 — Teleportation: Fire's Pathway

**2 spells; 0 not enabled.** Suggested source-reading anchor: Fire's Pathway. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Area exposure, Teleportation, Movement action

**Anchor wording:** ou step into a blazing fire that's big enough for you to fit inside and instantly teleport to any other fire within 5 miles that also has a sufficiently large size.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fire's Pathway](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/fires-pathway.json) | 5 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Nature's Pathway](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/natures-pathway.json) | 5 | Note only (resolved) | 3, 4 | 0.69 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-047 — Teleportation: Space Fold Gate

**2 spells; 0 not enabled.** Suggested source-reading anchor: Space Fold Gate. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Area exposure, Teleportation

**Anchor wording:** Any creature that enters one portal can immediately transport itself to the exit portal as a part of its move action, which adds the teleportation trait to its movement (this movement still triggers reactions as normal).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Space Fold Gate](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/space-fold-gate.json) | 5 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Tesseract Tunnel](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/tesseract-tunnel.json) | 5 | Note only (resolved) | 3, 4 | 0.64 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-048 — Teleportation: Translocate

**2 spells; 0 not enabled.** Suggested source-reading anchor: Translocate. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Temporary immunity

**Anchor wording:** You are then temporarily immune for 1 hour..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Translocate](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/translocate.json) | 4 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Take Your Places](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/take-your-places.json) | 8 | Note only (resolved) | 3, 4 | 0.43 | no primary save; non-basic/no save; duration outcome/text; target up to 4 willing creatures |


## P7-049 — Teleportation: Dimensional Assault

**1 spells; 0 not enabled.** Suggested source-reading anchor: Dimensional Assault. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Attack and dependent result, Teleportation

**Anchor wording:** Teleport to any space in range you can see that's within reach of an enemy, and then make a melee Strike against that enemy.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dimensional Assault](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/dimensional-assault.json) | 1 | Enabled route | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-050 — Teleportation: Dimensional Drop

**1 spells; 0 not enabled.** Suggested source-reading anchor: Dimensional Drop. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Save-result condition rider

**Anchor wording:** Critical Failure The target falls 40 feet through the void before reappearing..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dimensional Drop](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/dimensional-drop.json) | 2 | Enabled route | 2 | 1.00 | reflex; non-basic/no save; duration outcome/text; target 1 creature standing on the ground |


## P7-051 — Teleportation: Dimensional Excision

**1 spells; 0 not enabled.** Suggested source-reading anchor: Dimensional Excision. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Persistent damage, Modifier / resistance

**Anchor wording:** The creature takes 14d10 damage (no damage type) and 2d10 persistent bleed damage and must attempt a Will save.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dimensional Excision](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/dimensional-excision.json) | 9 | Enabled route | 2, 3 | 1.00 | will; basic; duration outcome/text; target 1 creature |


## P7-052 — Teleportation: Dive and Breach

**1 spells; 0 not enabled.** Suggested source-reading anchor: Dive and Breach. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Area exposure, Movement action

**Anchor wording:** You Leap 10 feet, and where you would land on the ground, you instead disappear in a splash of water, your body entering the surface like a diver entering a pool.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Dive and Breach](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/dive-and-breach.json) | 3 | Enabled route | 2, 3 | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P7-053 — Teleportation: Ethereal Jaunt

**1 spells; 0 not enabled.** Suggested source-reading anchor: Ethereal Jaunt. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Ending or dismissal, Movement action

**Anchor wording:** When the spell ends, you return to the Material Plane.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ethereal Jaunt](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/ethereal-jaunt.json) | 7 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-054 — Teleportation: Familiar's Call

**1 spells; 0 not enabled.** Suggested source-reading anchor: Familiar's Call. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Teleportation

**Anchor wording:** The exact appearance of this teleportation differs based on your tradition (a druid's familiar might fall into a spray of autumn leaves, a shadowy familiar might simply fade away), but it's always clearly supernatural..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Familiar's Call](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/familiars-call.json) | 3 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target your familiar |


## P7-055 — Teleportation: Far Reach

**1 spells; 0 not enabled.** Suggested source-reading anchor: Far Reach. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You conjure two tiny portals in midair: one in your own space and another in any unoccupied space within range that you can see. As long as you occupy the space of a portal, you can see, hear, and reach through the portal in your space to I

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Far Reach](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/far-reach.json) | 3 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-056 — Teleportation: Fetch

**1 spells; 0 not enabled.** Suggested source-reading anchor: Fetch. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Teleportation

**Anchor wording:** Your companion teleports to a location within 120 feet of you, can perform one Interact action, and then teleports back to its starting location.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Fetch](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/fetch.json) | 4 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target your companion |


## P7-057 — Teleportation: Flicker

**1 spells; 0 not enabled.** Suggested source-reading anchor: Flicker. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Sustain, Turn trigger or boundary, Teleportation, Modifier / resistance

**Anchor wording:** At the end of each of your turns, you automatically teleport 10 feet in a random direction, as determined by the GM.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Flicker](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/flicker.json) | 4 | Partial Effect | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-058 — Teleportation: Forest of Gates

**1 spells; 0 not enabled.** Suggested source-reading anchor: Forest of Gates. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Save-result condition rider, Native condition, Healing / recipient mode, Choice / casting variant, Incarnate arrival/departure

**Anchor wording:** Critical Failure You and your allies exit the forest within 1 mile of your original location..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Forest of Gates](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/forest-of-gates.json) | 9 | Note only (resolved) | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target you and up to 6 willing creatures |


## P7-059 — Teleportation: Gate

**1 spells; 0 not enabled.** Suggested source-reading anchor: Gate. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You tear open a rift to another plane, creating a portal that creatures can travel through in either direction. This portal is vertical and circular, with a radius of 40 feet. The portal appears at a location of your choice on the destinati

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Gate](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/gate.json) | 10 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-060 — Teleportation: Infiltrator's Tunnel

**1 spells; 0 not enabled.** Suggested source-reading anchor: Infiltrator's Tunnel. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Teleportation

**Anchor wording:** Any other creature attempting to move through the portals must succeed at a Will saving throw or be teleported up to 30 feet away from their starting point to a random safe space determined by the GM..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Infiltrator's Tunnel](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/infiltrators-tunnel.json) | 4 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration 1 minute; target source/area/text |


## P7-061 — Teleportation: Interplanar Teleport

**1 spells; 0 not enabled.** Suggested source-reading anchor: Interplanar Teleport. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Teleportation

**Anchor wording:** While the planar keys for most prominent planes are uncommon, just like the spell interplanar teleport , more obscure planes and demiplanes often have rare or possibly even unique planar keys..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Interplanar Teleport](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/interplanar-teleport.json) | 7 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target up to 8 willing creatures |


## P7-062 — Teleportation: King's Castle

**1 spells; 0 not enabled.** Suggested source-reading anchor: King's Castle. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You and a willing creature swap places. You appear in the target's former space, and the target appears in your former space. You and your target must each be able to fit in the new spaces within range; otherwise, the spell fails..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [King's Castle](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/kings-castle.json) | 5 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 willing creature |


## P7-063 — Teleportation: Magic Mailbox

**1 spells; 0 not enabled.** Suggested source-reading anchor: Magic Mailbox. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You create an interdimensional link between two containers, both of which must be capable of being closed in such a way that their contents aren't visible. If both containers are left closed for 10 consecutive minutes, the contents of each 

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Magic Mailbox](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/magic-mailbox.json) | 4 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration until your next daily preparations; target 2 containers, each no larger than 5 feet in any dimension |


## P7-064 — Teleportation: Maze of Locked Doors

**1 spells; 0 not enabled.** Suggested source-reading anchor: Maze of Locked Doors. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Save-result condition rider, Counteract, Teleportation

**Anchor wording:** Teleportation effects of 6th level or lower are automatically suppressed within the extradimensional hallway; higher-level teleportation effects require the caster to succeed at a counteract check against your spell DC or they fail..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Maze of Locked Doors](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/maze-of-locked-doors.json) | 7 | Enabled route | 2, 3, 4 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P7-065 — Teleportation: Proximal Shift

**1 spells; 0 not enabled.** Suggested source-reading anchor: Proximal Shift. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Basic-save damage, Native condition, Teleportation, Terrain

**Anchor wording:** At the GM's discretion, the spell might have additional effects based on the nature of the material teleported with you.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Proximal Shift](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/proximal-shift.json) | 6 | Enabled route | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-066 — Teleportation: Quandary

**1 spells; 0 not enabled.** Suggested source-reading anchor: Quandary. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Ending or dismissal, Save-result condition rider, Teleportation

**Anchor wording:** Teleportation effects can't carry the target outside the puzzle room unless they can also traverse the planes, such as Interplanar Teleport.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Quandary](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/quandary.json) | 8 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 creature |


## P7-067 — Teleportation: Return Beacon

**1 spells; 0 not enabled.** Suggested source-reading anchor: Return Beacon. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Incarnate arrival/departure, Information / adjudication

**Anchor wording:** If a solid object is in the same space as the beacon when you transport yourself, you arrive in the nearest open space to the beacon.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Return Beacon](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/return-beacon.json) | 5 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P7-068 — Teleportation: Teleport

**1 spells; 0 not enabled.** Suggested source-reading anchor: Teleport. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Incarnate arrival/departure, Teleportation

**Anchor wording:** Teleport is not precise over great distances.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Teleport](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/teleport.json) | 6 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target you and up to 4 targets touched, either willing creatures or objects roughly the size of a creature. |


## P7-069 — Teleportation: Terrain Transposition

**1 spells; 0 not enabled.** Suggested source-reading anchor: Terrain Transposition. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Structured source family; inspect the descriptions.

**Anchor wording:** You mystically transpose your current location with another. While in a wilderness environment, you transport yourself and items you're holding to a clear space you can see within range. If you have Favored Terrain and both your starting an

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Terrain Transposition](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/terrain-transposition.json) | 5 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-070 — Teleportation: Thoughtful Gift

**1 spells; 0 not enabled.** Suggested source-reading anchor: Thoughtful Gift. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Teleportation

**Anchor wording:** ou teleport one object of light or negligible Bulk held in your hand to the target.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Thoughtful Gift](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/thoughtful-gift.json) | 1 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target 1 willing creature |


## P7-071 — Teleportation: Trade Items

**1 spells; 0 not enabled.** Suggested source-reading anchor: Trade Items. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Modifier / resistance

**Anchor wording:** If one of the items is 1 Bulk and the other isn't, an unwilling creature gains a +2 circumstance bonus to their saving throw..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Trade Items](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/trade-items.json) | 3 | Note only (resolved) | 2 | 1.00 | reflex; non-basic/no save; duration outcome/text; target 1 item you're holding and 1 item in another creature's possession you can see, each no more than light Bulk |


## P7-072 — Teleportation: Umbral Journey

**1 spells; 0 not enabled.** Suggested source-reading anchor: Umbral Journey. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Ending or dismissal

**Anchor wording:** The landmarks are vague and symbolic rather than concrete, leaving you within a mile of your intended destination when you Dismiss the spell or its duration ends..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Umbral Journey](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/umbral-journey.json) | 5 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 8 hours; target you and up to 10 willing creatures touched |


## P7-073 — Teleportation: Unexpected Transposition

**1 spells; 0 not enabled.** Suggested source-reading anchor: Unexpected Transposition. This is not a verified-test designation.

**Test contract:** Range/rank; eligible passengers; destination constraints; visibility; cross-scene transfer; atomic move or review.

**Shared signals:** Temporary immunity

**Anchor wording:** After the swap, you and the target are both temporarily immune to unexpected transposition spells for 1 minute..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unexpected Transposition](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/unexpected-transposition.json) | 6 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature other than the triggering enemy |


## P7-074 — Terrain: Earthworks

**12 spells; 0 not enabled.** Suggested source-reading anchor: Earthworks. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Terrain

**Anchor wording:** The ground in the area becomes difficult terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Earthworks](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/earthworks.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Scatter Scree](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/scatter-scree.json) | 1 | Enabled route | 2, 3 | 0.49 | reflex; basic; duration 1 minute; target source/area/text |
| [Mushroom Patch](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/mushroom-patch.json) | 1 | Enabled route | 2, 3 | 0.42 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |
| [Spike Stones](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/spike-stones.json) | 4 | Enabled route | 3, 4 | 0.34 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |
| [Untwisting Iron Roots](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/untwisting-iron-roots.json) | 5 | Enabled route | 2, 3 | 0.26 | reflex; basic; duration outcome/text; target source/area/text |
| [Cave Fangs](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/cave-fangs.json) | 3 | Enabled route | 2, 3 | 0.24 | reflex; basic; duration 1 minute; target source/area/text |
| [Nature's Reprisal](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/natures-reprisal.json) | 6 | Enabled route | 3, 4 | 0.24 | no primary save; non-basic/no save; duration 1 minute; target all squares on the ground that contain plants in an 80-foot burst |
| [Elemental Breath](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/elemental-breath.json) | 5 | Enabled route | 2, 4 | 0.23 | reflex; basic; duration outcome/text; target source/area/text |
| [Trim the Blight](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/trim-the-blight.json) | 9 | Note only (resolved) | 2, 3 | 0.23 | fortitude; non-basic/no save; duration varies; target source/area/text |
| [Punishing Winds](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/punishing-winds.json) | 8 | Note only (resolved) | 3, 4 | 0.21 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Restore Ground](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/restore-ground.json) | 7 | Note only (resolved) | 3, 4 | 0.21 | no primary save; non-basic/no save; duration varies; target source/area/text |
| [Coral Eruption](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/coral-eruption.json) | 4 | Enabled route | 2, 3 | 0.20 | reflex; basic; duration 1 minute; target source/area/text |


## P7-075 — Terrain: Entangling Flora

**10 spells; 0 not enabled.** Suggested source-reading anchor: Entangling Flora. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Terrain

**Anchor wording:** All surfaces in the area are difficult terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Entangling Flora](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/entangling-flora.json) | 2 | Enabled route | 2, 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target source/area/text |
| [Sea of Thought](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/sea-of-thought.json) | 3 | Enabled route | 2, 3 | 0.58 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |
| [Oneiric Mire](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/oneiric-mire.json) | 3 | Enabled route | 2, 3 | 0.31 | will; non-basic/no save; duration 1 minute; target source/area/text |
| [Web](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/web.json) | 2 | Enabled route | 2, 3 | 0.27 | reflex; non-basic/no save; duration 1 minute; target source/area/text |
| [Morass of Ages](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/morass-of-ages.json) | 4 | Enabled route | 2, 3 | 0.23 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |
| [Corrosive Muck](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/corrosive-muck.json) | 5 | Enabled route | 2, 3 | 0.21 | reflex; basic; duration 1 minute; target source/area/text |
| [Swampcall](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/swampcall.json) | 1 | Enabled route | 2, 3 | 0.20 | reflex; non-basic/no save; duration 1 minute; target source/area/text |
| [Rime Slick](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/rime-slick.json) | 2 | Enabled route | 2, 3 | 0.18 | reflex; basic; duration 1 minute; target source/area/text |
| [Storm Lord](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/storm-lord.json) | 9 | Enabled route | 2, 3 | 0.18 | reflex; basic; duration 1 minute; target source/area/text |
| [Horizon's Veil](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/horizons-veil.json) | 5 | Enabled route | 2, 3 | 0.17 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-076 — Terrain: Wrathful Storm

**6 spells; 0 not enabled.** Suggested source-reading anchor: Wrathful Storm. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Terrain

**Anchor wording:** The air in the area is greater difficult terrain for flying creatures.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wrathful Storm](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/wrathful-storm.json) | 9 | Enabled route | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Storm of Vengeance](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/storm-of-vengeance.json) | 9 | Enabled route | 2, 3, 4 | 0.45 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Rouse Skeletons](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/rouse-skeletons.json) | 3 | Enabled route | 2, 3 | 0.18 | reflex; basic; duration 1 minute; target source/area/text |
| [Ice Storm](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/ice-storm.json) | 4 | Enabled route | 2, 3 | 0.18 | reflex; basic; duration 1 minute; target source/area/text |
| [Tear the Veil](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/tear-the-veil.json) | 10 | Enabled route | 2, 3 | 0.18 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |
| [Flame Vortex](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/flame-vortex.json) | 6 | Enabled route | 2, 3 | 0.15 | reflex; basic; duration 1 minute; target source/area/text |


## P7-077 — Terrain: Wildfire

**5 spells; 0 not enabled.** Suggested source-reading anchor: Wildfire. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Terrain

**Anchor wording:** The area becomes hazardous terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wildfire](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/wildfire.json) | 1 | Enabled route | 2, 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target source/area/text |
| [Rose's Thorns](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/roses-thorns.json) | 6 | Enabled route | 2, 3 | 0.29 | reflex; basic; duration 1 minute; target source/area/text |
| [Conjured Clockwork](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/conjured-clockwork.json) | 4 | Enabled route | 2, 3 | 0.22 | reflex; basic; duration 1 minute; target source/area/text |
| [Weapon Tide](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/weapon-tide.json) | 3 | Enabled route | 2, 3 | 0.17 | reflex; basic; duration outcome/text; target source/area/text |
| [Etheric Shards](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/etheric-shards.json) | 5 | Enabled route | 2, 3 | 0.16 | reflex; basic; duration 1 minute; target source/area/text |


## P7-078 — Terrain: Bramble Bush

**4 spells; 0 not enabled.** Suggested source-reading anchor: Bramble Bush. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Basic-save damage, Terrain

**Anchor wording:** Until the start of your next turn, the area is difficult terrain and hazardous terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Bramble Bush](../../.cache/pf2e-test-fixtures/spells/spells/cantrip/bramble-bush.json) | 1 | Enabled route | 2, 3 | 1.00 | reflex; basic; duration outcome/text; target source/area/text |
| [Howling Blizzard](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/howling-blizzard.json) | 5 | Enabled route | 2, 3 | 0.24 | reflex; basic; duration outcome/text; target source/area/text |
| [Planar Collision](../../.cache/pf2e-test-fixtures/spells/spells/rank-10/planar-collision.json) | 10 | Enabled route | 2, 3, 4 | 0.17 | reflex; basic; duration outcome/text; target source/area/text |
| [Swamp of Sloth](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/swamp-of-sloth.json) | 3 | Enabled route | 2, 3 | 0.17 | fortitude; basic; duration 1 minute; target source/area/text |


## P7-079 — Terrain: Whirlwind

**3 spells; 0 not enabled.** Suggested source-reading anchor: Whirlwind. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Sustain, Area exposure, Terrain

**Anchor wording:** All squares in the whirlwind are difficult terrain..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Whirlwind](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/whirlwind.json) | 8 | Enabled route | 2, 3, 4 | 1.00 | reflex; non-basic/no save; duration 1 minute; target source/area/text |
| [Whirlpool](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/whirlpool.json) | 8 | Enabled route | 2, 3 | 0.17 | reflex; non-basic/no save; duration 1 minute; target source/area/text |
| [Zombie Horde](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/zombie-horde.json) | 3 | Enabled route | 2, 3 | 0.15 | fortitude; non-basic/no save; duration 1 minute; target 1 of your thralls |


## P7-080 — Terrain: Rubble Step

**2 spells; 0 not enabled.** Suggested source-reading anchor: Rubble Step. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Terrain

**Anchor wording:** For 2 rounds, when the target willingly moves out of a space, and if the target is in contact with the ground, the ground in that space becomes difficult terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Rubble Step](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/rubble-step.json) | 2 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |
| [Undertaker](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/undertaker.json) | 9 | Enabled route | 2, 3 | 0.18 | fortitude; non-basic/no save; duration outcome/text; target 1 living creature |


## P7-081 — Terrain: 500 Toads

**1 spells; 0 not enabled.** Suggested source-reading anchor: 500 Toads. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Terrain

**Anchor wording:** The area is difficult terrain, and the magic reconstructs any toads destroyed by traps to keep the area full of toads for the duration of the spell..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [500 Toads](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/500-toads.json) | 1 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 round; target source/area/text |


## P7-082 — Terrain: Antlion Trap

**1 spells; 0 not enabled.** Suggested source-reading anchor: Antlion Trap. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Area exposure, Save-result condition rider, Native condition, Terrain

**Anchor wording:** ou transmute the ground into a conical pit trap of loose sand that becomes difficult terrain for the duration.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Antlion Trap](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/antlion-trap.json) | 3 | Enabled route | 2, 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target source/area/text |


## P7-083 — Terrain: Blast of the Bellows

**1 spells; 0 not enabled.** Suggested source-reading anchor: Blast of the Bellows. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Area exposure, Save-result condition rider, Terrain

**Anchor wording:** This area is difficult terrain for flying creatures.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Blast of the Bellows](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/blast-of-the-bellows.json) | 2 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-084 — Terrain: Crystallized Vapors

**1 spells; 0 not enabled.** Suggested source-reading anchor: Crystallized Vapors. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Sustain, Attack and dependent result, Terrain

**Anchor wording:** ou freeze the precipitation around you in icy pellets, creating a type:emanation|distance:15 of difficult terrain; you're immune to this difficult terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Crystallized Vapors](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/crystallized-vapors.json) | 4 | Enabled route | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-085 — Terrain: Cyclone Rondo

**1 spells; 0 not enabled.** Suggested source-reading anchor: Cyclone Rondo. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Sustain, Area exposure, Basic-save damage, Native condition, Terrain

**Anchor wording:** The area of the whirlwind is difficult terrain..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Cyclone Rondo](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/cyclone-rondo.json) | 3 | Enabled route | 2, 3 | 1.00 | reflex; basic; duration 1 minute; target source/area/text |


## P7-086 — Terrain: Earthquake

**1 spells; 0 not enabled.** Suggested source-reading anchor: Earthquake. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Turn trigger or boundary, Save-result condition rider, Basic-save damage, Native condition, Terrain, Modifier / resistance

**Anchor wording:** Shaking Ground The ground is difficult terrain, and creatures on it take a -2 circumstance penalty to attack rolls, AC, and skill checks.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Earthquake](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/earthquake.json) | 8 | Note only (resolved) | 2, 3 | 1.00 | reflex; basic; duration 1 round; target source/area/text |


## P7-087 — Terrain: Elemental Confluence

**1 spells; 0 not enabled.** Suggested source-reading anchor: Elemental Confluence. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Sustain, Save-result condition rider, Basic-save damage, Persistent damage, Attack and dependent result, Terrain, Modifier / resistance

**Anchor wording:** Wood (wood) Roots and stumps grow, making ground in the area difficult terrain for 1 round..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Elemental Confluence](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/elemental-confluence.json) | 6 | Enabled route | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-088 — Terrain: Elemental Gift

**1 spells; 0 not enabled.** Suggested source-reading anchor: Elemental Gift. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Turn trigger or boundary, Persistent damage, Granted movement speed, Native condition, Choice / casting variant, Terrain, Modifier / resistance

**Anchor wording:** In addition, the ground adjacent to the target is difficult terrain, and the difficult terrain moves with the target, though the target ignores this difficult terrain with their own movement..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Elemental Gift](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/elemental-gift.json) | 4 | Partial Effect | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target 1 willing creature |


## P7-089 — Terrain: Field of Razors

**1 spells; 0 not enabled.** Suggested source-reading anchor: Field of Razors. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Ending or dismissal, Persistent damage, Terrain

**Anchor wording:** The covered area is difficult terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Field of Razors](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/field-of-razors.json) | 6 | Enabled route | 2, 3 | 1.00 | reflex; basic; duration outcome/text; target source/area/text |


## P7-090 — Terrain: Garden of Stone

**1 spells; 0 not enabled.** Suggested source-reading anchor: Garden of Stone. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Basic-save damage, Terrain

**Anchor wording:** The area in a type:emanation|distance:20 around the stalagmite becomes difficult terrain, as smaller stalagmites grow around it..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Garden of Stone](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/garden-of-stone.json) | 3 | Enabled route | 2, 3 | 1.00 | reflex; basic; duration 1 minute; target source/area/text |


## P7-091 — Terrain: Gluttonous Growth

**1 spells; 0 not enabled.** Suggested source-reading anchor: Gluttonous Growth. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Sustain, Turn trigger or boundary, Save-result condition rider, Native condition, Terrain

**Anchor wording:** All affected squares are difficult terrain, both on the ground and for flying creatures.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Gluttonous Growth](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/gluttonous-growth.json) | 5 | Enabled route | 2, 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target source/area/text |


## P7-092 — Terrain: Heart's Desire

**1 spells; 0 not enabled.** Suggested source-reading anchor: Heart's Desire. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Save-result condition rider, Native condition, Terrain, Modifier / resistance

**Anchor wording:** Critical Failure As failure, and all spaces are difficult terrain for the target..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Heart's Desire](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/hearts-desire.json) | 3 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration varies; target 1 creature |


## P7-093 — Terrain: Helpful Wood Spirits

**1 spells; 0 not enabled.** Suggested source-reading anchor: Helpful Wood Spirits. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Sustain, Native condition, Choice / casting variant, Terrain, Information / adjudication

**Anchor wording:** The area they occupy is difficult terrain..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Helpful Wood Spirits](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/helpful-wood-spirits.json) | 2 | Enabled route | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-094 — Terrain: Iron Rain

**1 spells; 0 not enabled.** Suggested source-reading anchor: Iron Rain. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Persistent damage, Terrain

**Anchor wording:** As the rain dissipates, the ground is littered with hundreds of knives, creating difficult terrain that lasts for the duration of the spell.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Iron Rain](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/iron-rain.json) | 3 | Enabled route | 2, 3 | 1.00 | reflex; basic; duration 1 minute; target source/area/text |


## P7-095 — Terrain: Magnetic Repulsion

**1 spells; 0 not enabled.** Suggested source-reading anchor: Magnetic Repulsion. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Native condition, Terrain, Modifier / resistance

**Anchor wording:** Attacks made with metal objects against you take a -1 status penalty, and the squares adjacent to you are difficult terrain for creatures wearing metal armor.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Magnetic Repulsion](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/magnetic-repulsion.json) | 2 | Enabled route | 2, 3 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-096 — Terrain: Pierce the Sky

**1 spells; 0 not enabled.** Suggested source-reading anchor: Pierce the Sky. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Area exposure, Save-result condition rider, Native condition, Attack and dependent result, Terrain

**Anchor wording:** Regardless of the result, each arrow leaves a line of hazardous terrain between you and the target that lasts for 1 minute.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Pierce the Sky](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/pierce-the-sky.json) | 9 | Enabled route | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target up to 3 creatures |


## P7-097 — Terrain: Pillar of Water

**1 spells; 0 not enabled.** Suggested source-reading anchor: Pillar of Water. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Choice / casting variant, Terrain

**Anchor wording:** Creatures inside the pillar can Swim through the water as normal (athletics|traits:action:swim|dc:10), or if the spell was cast on solid ground, walk along the bottom (which is difficult terrain).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Pillar of Water](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/pillar-of-water.json) | 3 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-098 — Terrain: Rainbow Fumarole

**1 spells; 0 not enabled.** Suggested source-reading anchor: Rainbow Fumarole. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Area exposure, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Terrain

**Anchor wording:** Squares within the area of the rainbow fumarole are difficult terrain..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Rainbow Fumarole](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/rainbow-fumarole.json) | 8 | Enabled route | 2, 3, 4 | 1.00 | reflex; basic; duration 1 minute; target source/area/text |


## P7-099 — Terrain: Ranage's Circle

**1 spells; 0 not enabled.** Suggested source-reading anchor: Ranage's Circle. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Area exposure, Save-result condition rider, Native condition, Terrain

**Anchor wording:** When you Cast this Spell, every square adjacent to the target becomes difficult terrain from the sudden eruption of plant life for 1 minute.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Ranage's Circle](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/ranages-circle.json) | 4 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration varies; target 1 creature |


## P7-100 — Terrain: Repulsion

**1 spells; 0 not enabled.** Suggested source-reading anchor: Repulsion. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Aura membership, Area exposure, Terrain

**Anchor wording:** Success The creature treats each square in the area as difficult terrain when moving closer to you..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Repulsion](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/repulsion.json) | 6 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration 1 minute; target source/area/text |


## P7-101 — Terrain: River Carving Mountains

**1 spells; 0 not enabled.** Suggested source-reading anchor: River Carving Mountains. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Sustain, Turn trigger or boundary, Granted movement speed, Terrain, Movement action, Modifier / resistance

**Anchor wording:** These squares become difficult terrain until the start of your next turn.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [River Carving Mountains](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/river-carving-mountains.json) | 1 | Enabled route | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-102 — Terrain: Sawtooth Terrain

**1 spells; 0 not enabled.** Suggested source-reading anchor: Sawtooth Terrain. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Area exposure, Save-result condition rider, Persistent damage, Healing / recipient mode, Terrain, Modifier / resistance

**Anchor wording:** The area is difficult terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sawtooth Terrain](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/sawtooth-terrain.json) | 5 | Enabled route | 2, 3, 4 | 1.00 | reflex; non-basic/no save; duration 1 minute; target source/area/text |


## P7-103 — Terrain: Shifting Sand

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shifting Sand. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Sustain, Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Terrain, Modifier / resistance

**Anchor wording:** The area becomes difficult terrain, and any tracks in the area are destroyed by the churning ground.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shifting Sand](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/shifting-sand.json) | 3 | Enabled route | 2, 3 | 1.00 | reflex; non-basic/no save; duration 1 minute; target source/area/text |


## P7-104 — Terrain: Shipwreck

**1 spells; 0 not enabled.** Suggested source-reading anchor: Shipwreck. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Save-result condition rider, Terrain

**Anchor wording:** Success The vehicle becomes uncontrolled, and spaces within it become difficult terrain..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Shipwreck](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/shipwreck.json) | 8 | Note only (resolved) | 2 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target 1 vehicle |


## P7-105 — Terrain: Solid Fog

**1 spells; 0 not enabled.** Suggested source-reading anchor: Solid Fog. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Ending or dismissal, Terrain

**Anchor wording:** This functions as Mist, except that the area is also difficult terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Solid Fog](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/solid-fog.json) | 4 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-106 — Terrain: Strange Geometry

**1 spells; 0 not enabled.** Suggested source-reading anchor: Strange Geometry. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Area exposure, Terrain

**Anchor wording:** Failure All terrain in the cubes is difficult terrain for the creature, including the air if the creature is flying, walls if it's climbing, and so on.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Strange Geometry](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/strange-geometry.json) | 5 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration 1 minute; target source/area/text |


## P7-107 — Terrain: Tacky Pine Sap

**1 spells; 0 not enabled.** Suggested source-reading anchor: Tacky Pine Sap. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Persistent damage, Terrain

**Anchor wording:** This area becomes difficult terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Tacky Pine Sap](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/tacky-pine-sap.json) | 2 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-108 — Terrain: Tanglecurse

**1 spells; 0 not enabled.** Suggested source-reading anchor: Tanglecurse. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Area exposure, Save-result condition rider, Native condition, Terrain

**Anchor wording:** This area is difficult terrain for creatures that enter the area.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Tanglecurse](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/tanglecurse.json) | 6 | Enabled route | 2, 3 | 1.00 | will; non-basic/no save; duration outcome/text; target 1 creature |


## P7-109 — Terrain: Telekinetic Bombardment

**1 spells; 0 not enabled.** Suggested source-reading anchor: Telekinetic Bombardment. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Save-result condition rider, Native condition, Terrain

**Anchor wording:** Your missile crashes down in either a type:burst|distance:10 (for most missiles) or a type:line|distance:30 (for something long and tall, like a tree or a ship's mast), dealing 14d6[bludgeoning|options:area-damage] damage and turning its area into difficult terrain as it breaks into rubble.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Telekinetic Bombardment](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/telekinetic-bombardment.json) | 7 | Enabled route | 2, 3 | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |


## P7-110 — Terrain: Transmute Rock And Mud

**1 spells; 0 not enabled.** Suggested source-reading anchor: Transmute Rock And Mud. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Save-result condition rider, Basic-save damage, Native condition, Choice / casting variant, Terrain, Movement action

**Anchor wording:** If you Cast this Spell on a stone floor, it becomes difficult terrain; if the resulting mud is at least 3 feet deep, it is greater difficult terrain, or the creature can try to Swim through it (athletics|dc:10|traits:action:swim).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Transmute Rock And Mud](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/transmute-rock-and-mud.json) | 5 | Enabled route | 2, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-111 — Terrain: Unbreaking Wave Barrier

**1 spells; 0 not enabled.** Suggested source-reading anchor: Unbreaking Wave Barrier. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Sustain, Area exposure, Save-result condition rider, Native condition, Terrain, Forced movement, Modifier / resistance

**Anchor wording:** Success The creature isn't pushed, but the space within the barrier is difficult terrain for it..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Unbreaking Wave Barrier](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/unbreaking-wave-barrier.json) | 7 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration outcome/text; target source/area/text |


## P7-112 — Terrain: Upheaval

**1 spells; 0 not enabled.** Suggested source-reading anchor: Upheaval. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Save-result condition rider, Native condition, Terrain

**Anchor wording:** Stone Debris The area becomes difficult terrain..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Upheaval](../../.cache/pf2e-test-fixtures/spells/spells/rank-9/upheaval.json) | 9 | Note only (resolved) | 2 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-113 — Terrain: Verdant Sprout

**1 spells; 0 not enabled.** Suggested source-reading anchor: Verdant Sprout. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Terrain

**Anchor wording:** After 10 minutes, the plant is sturdy enough to provide standard cover, and its space is difficult terrain.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Verdant Sprout](../../.cache/pf2e-test-fixtures/spells/spells/rank-1/verdant-sprout.json) | 1 | Note only (resolved) | 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-114 — Terrain: Volcanic Eruption

**1 spells; 0 not enabled.** Suggested source-reading anchor: Volcanic Eruption. This is not a verified-test designation.

**Test contract:** Area geometry; terrain type/cost; entry/exposure; hazards; duration; preserve unrelated scene objects.

**Shared signals:** Save-result condition rider, Native condition, Terrain, Modifier / resistance

**Anchor wording:** All normal terrain is difficult terrain to a flying creature, and such creatures immediately descend 20 feet the moment they're encased, but they don't take damage from this fall.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Volcanic Eruption](../../.cache/pf2e-test-fixtures/spells/spells/rank-7/volcanic-eruption.json) | 7 | Enabled route | 2 | 1.00 | reflex; non-basic/no save; duration outcome/text; target source/area/text |


## P7-115 — Wall / barrier: Wall of Shadow

**7 spells; 0 not enabled.** Suggested source-reading anchor: Wall of Shadow. This is not a verified-test designation.

**Test contract:** Dimensions and placement; collision/sight; occupied spaces; defenses/HP; permanent versus temporary cleanup.

**Shared signals:** Wall / barrier

**Anchor wording:** ou form a wall of pure darkness in a straight line up to 60 feet long and 10 feet high.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wall of Shadow](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/wall-of-shadow.json) | 3 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Wall of Radiance](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/wall-of-radiance.json) | 3 | Enabled route | 2, 3 | 0.36 | fortitude; basic; duration 1 minute; target source/area/text |
| [Wall of Force](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/wall-of-force.json) | 6 | Enabled route | 3, 4 | 0.34 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Wall of Stone](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/wall-of-stone.json) | 5 | Note only (resolved) | 4 | 0.33 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |
| [Wall of Thorns](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/wall-of-thorns.json) | 3 | Enabled route | 3, 4 | 0.28 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Wall of Ice](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/wall-of-ice.json) | 5 | Enabled route | 2, 3, 4 | 0.23 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Wall Of Mirrors](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/wall-of-mirrors.json) | 4 | Enabled route | 4 | 0.21 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-116 — Wall / barrier: Wall of Fire

**4 spells; 0 not enabled.** Suggested source-reading anchor: Wall of Fire. This is not a verified-test designation.

**Test contract:** Dimensions and placement; collision/sight; occupied spaces; defenses/HP; permanent versus temporary cleanup.

**Shared signals:** Wall / barrier

**Anchor wording:** ou raise a blazing wall that burns creatures passing through it.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wall of Fire](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/wall-of-fire.json) | 4 | Enabled route | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Wall of Virtue](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/wall-of-virtue.json) | 3 | Enabled route | 3, 4 | 0.40 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |
| [Blade Barrier](../../.cache/pf2e-test-fixtures/spells/spells/rank-6/blade-barrier.json) | 6 | Enabled route | 2, 3 | 0.18 | reflex; basic; duration 1 minute; target source/area/text |
| [Chromatic Wall](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/chromatic-wall.json) | 5 | Enabled route | 2, 3, 4 | 0.17 | no primary save; non-basic/no save; duration 10 minutes; target source/area/text |


## P7-117 — Wall / barrier: Invisibility Curtain

**1 spells; 0 not enabled.** Suggested source-reading anchor: Invisibility Curtain. This is not a verified-test designation.

**Test contract:** Dimensions and placement; collision/sight; occupied spaces; defenses/HP; permanent versus temporary cleanup.

**Shared signals:** Wall / barrier

**Anchor wording:** ou create a transparent invisible wall that makes any creatures on one side of the wall invisible to those on the other side.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Invisibility Curtain](../../.cache/pf2e-test-fixtures/spells/spells/rank-4/invisibility-curtain.json) | 4 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration outcome/text; target source/area/text |


## P7-118 — Wall / barrier: Magic Passage

**1 spells; 0 not enabled.** Suggested source-reading anchor: Magic Passage. This is not a verified-test designation.

**Test contract:** Dimensions and placement; collision/sight; occupied spaces; defenses/HP; permanent versus temporary cleanup.

**Shared signals:** Area exposure, Ending or dismissal, Wall / barrier

**Anchor wording:** ou create a visible tunnel through the wall in the chosen area, replacing the area with empty space.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Magic Passage](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/magic-passage.json) | 5 | Note only (resolved) | 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P7-119 — Wall / barrier: Prismatic Wall

**1 spells; 0 not enabled.** Suggested source-reading anchor: Prismatic Wall. This is not a verified-test designation.

**Test contract:** Dimensions and placement; collision/sight; occupied spaces; defenses/HP; permanent versus temporary cleanup.

**Shared signals:** Temporary immunity, Ending or dismissal, Save-result condition rider, Native condition, Counteract, Wall / barrier

**Anchor wording:** ou create an opaque wall of shimmering, multicolored light.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Prismatic Wall](../../.cache/pf2e-test-fixtures/spells/spells/rank-8/prismatic-wall.json) | 8 | Enabled route | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 hour; target source/area/text |


## P7-120 — Wall / barrier: Sea Surge

**1 spells; 0 not enabled.** Suggested source-reading anchor: Sea Surge. This is not a verified-test designation.

**Test contract:** Dimensions and placement; collision/sight; occupied spaces; defenses/HP; permanent versus temporary cleanup.

**Shared signals:** Turn trigger or boundary, Area exposure, Save-result condition rider, Native condition, Wall / barrier, Forced movement

**Anchor wording:** The water forms a flat, 5-foot-thick, 10-foot-high wall of water between 5 and 15 feet wide (you decide).

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Sea Surge](../../.cache/pf2e-test-fixtures/spells/spells/rank-2/sea-surge.json) | 2 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration until the start of your next turn; target source/area/text |


## P7-121 — Wall / barrier: Wall of Flesh

**1 spells; 0 not enabled.** Suggested source-reading anchor: Wall of Flesh. This is not a verified-test designation.

**Test contract:** Dimensions and placement; collision/sight; occupied spaces; defenses/HP; permanent versus temporary cleanup.

**Shared signals:** Area exposure, Save-result condition rider, Native condition, Healing / recipient mode, Attack and dependent result, Choice / casting variant, Wall / barrier, Modifier / resistance

**Anchor wording:** You must create the wall in an unbroken open space so its edges don't pass through any creatures or objects, or the spell is lost.

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wall of Flesh](../../.cache/pf2e-test-fixtures/spells/spells/rank-5/wall-of-flesh.json) | 5 | Enabled route | 2, 3, 4 | 1.00 | no primary save; non-basic/no save; duration 1 minute; target source/area/text |


## P7-122 — Wall / barrier: Wall of Wind

**1 spells; 0 not enabled.** Suggested source-reading anchor: Wall of Wind. This is not a verified-test designation.

**Test contract:** Dimensions and placement; collision/sight; occupied spaces; defenses/HP; permanent versus temporary cleanup.

**Shared signals:** Save-result condition rider, Wall / barrier, Forced movement, Modifier / resistance

**Anchor wording:** Massive ranged weapons and spell effects that don't create physical objects pass through the wall with no penalty..

| Spell / source | Rank | Module route | Other phase signals | Similarity to anchor | Mechanical differences to preserve |
| --- | --- | --- | --- | --- | --- |
| [Wall of Wind](../../.cache/pf2e-test-fixtures/spells/spells/rank-3/wall-of-wind.json) | 3 | Enabled route | 2, 3 | 1.00 | fortitude; non-basic/no save; duration 1 minute; target source/area/text |


## Cross-phase dependency list

These spells are owned by another primary worklist; reuse their listed batch instead of implementing them twice.

| Spell | Primary phase / batch | Matched signals |
| --- | --- | --- |
| Element Embodied | P5 / P5-002 | Area exposure, Ending or dismissal, Basic-save damage, Persistent damage, Native condition, Healing / recipient mode, Choice / casting variant, Creature transformation, Terrain, Modifier / resistance |
| Elemental Form | P5 / P5-009 | Ending or dismissal, Persistent damage, Choice / casting variant, Creature transformation, Forced movement, Modifier / resistance |
| Amalgamizing Leap | P5 / P5-012 | Turn trigger or boundary, Save-result condition rider, Granted movement speed, Native condition, Choice / casting variant, Teleportation |
| Patron's Protector | P5 / P5-025 | Sustain, Save-result condition rider, Basic-save damage, Forced movement, Modifier / resistance |
| Spectral Advance | P5 / P5-031 | Movement action, Modifier / resistance |
| Holy Host | P6 / P6-011 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Healing / recipient mode, Choice / casting variant, Incarnate arrival/departure, Forced movement, Information / adjudication, Modifier / resistance |
| Incarnate Kaiju | P6 / P6-011 | Turn trigger or boundary, Area exposure, Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Forced movement, Modifier / resistance |
| Pest Swarm | P6 / P6-011 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Terrain, Delegated affliction, Modifier / resistance |
| Summon Elemental Herald | P6 / P6-013 | Save-result condition rider, Basic-save damage, Persistent damage, Native condition, Choice / casting variant, Incarnate arrival/departure, Terrain, Forced movement, Modifier / resistance |
| Garden of the Green Man's Growth | P6 / P6-018 | Save-result condition rider, Basic-save damage, Native condition, Incarnate arrival/departure, Terrain, Forced movement |
| Summon Oliphaunt of Jandelay | P6 / P6-030 | Basic-save damage, Incarnate arrival/departure, Forced movement |
| Summon Warden of the Wild | P6 / P6-032 | Temporary immunity, Save-result condition rider, Basic-save damage, Native condition, Incarnate arrival/departure, Terrain, Forced movement |
| Footholds and Foothills | P8 / P8-001 | Save-result condition rider, Terrain |
| Labyrinthine Prison | P8 / P8-015 | Area exposure, Save-result condition rider, Native condition |
| Mindscape Shift | P8 / P8-018 | Area exposure, Save-result condition rider, Teleportation |
| Purify Tanglebriar | P8 / P8-024 | Save-result condition rider, Terrain, Information / adjudication, Modifier / resistance |
| Rite of the Red Star | P8 / P8-029 | Area exposure, Save-result condition rider, Native condition |
| Teleportation Circle | P8 / P8-035 | Turn trigger or boundary, Save-result condition rider, Incarnate arrival/departure, Teleportation |

