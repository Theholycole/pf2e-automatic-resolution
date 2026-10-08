# Third-party features batch 43: the catalysts' notes automated

2026-10-08. The user asked to "automate the 62 catalyst notes too" ([audit](../planning/third-party-features-audit.md)). After batch 42, 62 of PF2e's 107 catalysts only posted their text to the GM. Now every catalyst is read into riders the module carries out. The interpretations are logged in [pending-user-decisions](../planning/pending-user-decisions.md) (ANSWERED 2026-10-08).

## What changed

- **`src/compiler/catalysts.js`:** the remaining texts read into riders. A form can name its own requirement: Broken Ram's Thorn's two actions, Deathless Light's light trait, Shadow Ash's undead spells. A catalyst whose PF2e Effect carries its whole text (the dragon scales) has no note. Necrotic Cap's void type also covers persistent damage.
- **`scripts/catalyst-runtime.js`** (new):
  - **At the cast:** reminder Effects (the spell's duration, rounds, hours, days or unlimited), the willing ally's condition, watches on the caster, the food card and Deathless Light's reminder.
  - **On the save card:** caltrops Regions, the flying creature's push, prone after the pull, the charm's end save, doubled durations, a condition after another ends, incorporeal creatures, and Ogre Spider Filament's swap (`swapAfflictionConditions`, in Pseudo Afflictions' stages).
  - **Once the cast has resolved, or its lingering area has started:** the Effect patches (selector swap, duration, lingering resistance, type swap, tradition replacement, flags), plus the walls', mists' and auras' riders.
  - **On events:** damage (Black Ash, Ghostcracker, Shadow Ash), destroyed images, flat checks, turn starts, moves, Effects ending, casts in a battle form, and the spell shield's Shield Block.
- **`scripts/spellshape-runtime.js`:**
  - The catalyst cast and save riders are dispatched here; Shadow Ash on summons.
  - `generated` riders take rounds, a description and "one target".
  - The terrain hazard takes a skill check first and can be spent on a hit.
- **`scripts/basic-save-runtime.js`:**
  - The card records the creatures' starting spots (by token id).
  - Unsullied Blood's benefit kind is applied.
  - Deathless Light raises the counteract rank against darkness.
  - The affliction handoff swaps conditions.
  - A spellshape's or catalyst's damage type swap reaches the row's own damage too (Necrotic Cap's persistent void).
- **`scripts/effect-runtime.js`:**
  - Stabilize takes the extra targets; Mad Monkeys takes the added mode.
  - Wall of Force marks its cast resolved.
- **`scripts/ongoing-families.js`:**
  - A lingering area centres on an ally and excludes the actors given.
  - A lingering record keeps its cast's message; the cast's initial save carries the spellshapes and catalysts.
- **`scripts/item-spellshape-runtime.js`:** the `applyDamage` wrapper notes the damage's item and actor (written on PF2e's damage-taken message, which has none), and marks a spell shield's Effect when it Shield Blocks.
- **`scripts/stored-trigger-runtime.js`:** a destroyed image's message names the attacker.
- **`scripts/main.js`:**
  - The hooks.
  - `api.ongoing.journalFor`, `saveRecord` and `startCloud`.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged (227 {save 66, note 51, effect 102, ongoing 8}).

## Tests

`test/third-party-features-batch-43.test.js` (5). Batch 42's tests were updated for the readings batch 43 supersedes: Deathless Light's trait requirement, and Courier's Cryptex's reminder in place of the note. All unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-43-live-results.json), cases `thirdPartyFeaturesBatch43a` to `43e` (a 12th-level occult caster).

Re-run, all passing: batches 42, 41, 38, 32, 7, 3 and 2; `spellFeaturesBatch4a`; `spellshapeBatch4`, `9`, `14` and `18`; `thirdPartyBatch1` and `23`; `rank5Batch13`, `rank3Batch21`, `rank8Batch2`, `rank6Batch10`, `rank2Batch38`, `cr1Batch22`, `rank3Batch100`, `rank7Batch16`, `longTailBatch2` and `rank2Batch78`. These cover the spellshape type swaps, the lingering saves, Stabilize, Mad Monkeys, Wall of Force, the images, Repulsion, Vampiric Feast, Gravity Well and Illusory Creature. In the first pass six of them failed on turn timing: an earlier case had left a started combat on the PFTEST scene. With it removed, all six pass.

| Case | Step | Result |
| --- | --- | --- |
| 43a | Alicorn Hair, Stabilize on two dying foes | Both stabilized (Wounded 1); without it, two targets refused |
| 43a | Dimensional Knot, Translocate on the ally | The ally Stunned 1 |
| 43a | Courier's Cryptex; Echoing Theater; Deadlock Mint | Reminder Effects: the spell's duration, 7 days, this turn |
| 43a | Preserved Alecost, Create Food at 2; two creatures eat | 2 temporary Hit Points each |
| 43a | Deathless Light, Light | The light counts as rank 7 (the cantrip at 6, +1, at most 7) |
| 43b | Swirling Sand, Suggestion; Kushtaka Relic, Spirit Blast | The compulsion for 3 rounds; the possession reminder for 10 rounds |
| 43b | Leaden Weight, Gravity Well: the pulled foe, and the foe at the centre | Prone at once; prone after its next move |
| 43b | Necrotic Cap (Lesser), Acid Grip: a failure | Enfeebled 1, sickened 1 and the held sickened; persistent void |
| 43b | Dazzling Rosary, Spiritual Armament: a critical hit | Dazzled |
| 43b | Seventh Prism (Triangular), Dizzying Colors | A success's dazzled for 2 rounds; dazzled 10 rounds after the blindness ends |
| 43b | Undertaker's Spade, Impaling Spike on an incorporeal foe; Ogre Spider Filament, Spider Sting | The immobilized reminder; the venom's stages give clumsy, not enfeebled |
| 43b | Broken Ram's Thorn, Howling Blizzard (lingering); the other foe moves in on a natural 1 | A 4-square ring; 5 cold; the ring spent |
| 43b | Kirin Echo Chime, Gust of Wind on a flying foe | Pushed 30 feet south from where it stood |
| 43b | Euphoric Loop, Charm; the charm ends, not by a hostile act; the Will save fails | Stunned 2 |
| 43c | Consecrated Shield, Heroism | The bonus to AC, saves, skills and Perception, not attacks |
| 43c | Nevercold; Witchwarg Fur (Fire Shield at 4) | 5 minutes, cold resistance for 1 hour and immunity for 8 hours; fire resistance, cold damage |
| 43c | Dragon Scute (Lesser), Mountain Resilience at 6, occult | Resistance 10 to mental in place of the spell's |
| 43c | Chaos Falcon Feather, Resist Energy (fire) on the ally; the Sustain onto the caster | Moved as acid, 90 rounds left |
| 43c | Demon Bone Tiles (Pusk), Shield at 6; a Shield Block | The adjacent creatures' DC 16 Reflex card; the foe's 1d4 persistent bleed |
| 43c | Feral Linguist (Greater), Animal Form (ape); Daze, then Fear | Daze cast in the form; Fear refused |
| 43c | Unsullied Blood (Lesser), Vampiric Feast at 4 | Half the damage as Hit Points, no temporary Hit Points |
| 43c | Literate Lemur, Mad Monkeys' Fierce Debate: a natural 1 | Blinded |
| 43d | Force Tiles, Wall of Force; the foe moves into the wall | 2d6 force |
| 43d | Noxious Incense, Wall of Fire | The smoke a square around the wall; the foe beside it Concealed |
| 43d | Gravemist Taper with Mistwalker's Instinct, Mist; the foe's flat check of 4 | The roller Frightened 1; the caster's reminder |
| 43d | Irritating Seedpod (Major), Mist: a failure and a success; then the turns | Slowed 2 then Slowed 1; the success immune; a new save only for the first foe's turn |
| 43d | Odious Token, Repulsion on the ally | The aura centred on the ally; caster and ally not members |
| 43d | Skyfisher Vapors, Toxic Cloud (lingering) | The Region seen only on the GM's layer; no concealment |
| 43e | Black Ash, Wall of Thorns; the thorns hurt the foe | 1d6 persistent poison |
| 43e | Fearcracker, Mirror Image; the foe's miss destroys an image | The foe Frightened 1 |
| 43e | Ghostcracker, Illusory Creature; the foe's claw ends the image | The foe Frightened 1 |
| 43e | Shadow Ash, Summon Undead; the foe's claw twice; a lethal blow (a natural 20) | 3d6 cold and Drained 1 on the foe, once; the undead rises with half its Hit Points |
