# Rank 2 batch 16 — rank 1 spells heightened

2026-09-30. User direction: "check 1st rank spells if they are heightened correctly too."

## The check

Every working rank 1 spell (not cantrips) with a Heightened entry was cast live, 468 casts over 245 spells ([results](rank-1-heightened-smoke.json)):
- at each fixed-rank entry's rank;
- for a (+N) entry, one and two steps up.

Each result records the Effects made (level, duration) and, for save cards, the rolled damage and each target's HP loss.

**Result:** 422 ok, 39 refusals, 5 with no module button, 2 errors.
- **Fixture limits, not spell faults (most refusals):** the test caster has no melee Strike, no elemental or draconic bloodline, no weapon for the Effect to pick, no Lore, no feat option, no damaged item; or the spell targets something the fixtures don't provide (an undead minion, a weapon, an animal, a thrall).
- **Pest Form at 4th:** needs a character caster; with one, it worked (level 4).
- **Durations:** no mismatch with the heightened durations the plans expect (checked automatically).
- **Effect levels:** 21 module-made Effects keep level 1, but none has a rank-dependent rule; their heightening is carried by the plan:
  - Bone Shield's Hardness step;
  - Arms of Nature's runes by rank;
  - Summon Lesser Servitor's creature level;
  - Wall of Shrubs' cover and 1-hour duration;
  - Tentacular Limbs' note;
  - Garden of Healing's pulse (its PF2e Effect has no rank rule).
- **Damage:** grows by rank (Camel Spit 2d6 → 3d6, Grim Tendrils 4d4 → 6d4, Thunderous Strike 3 → 4, Ulcerous Canker 2d4 → 3d4, …). Casts with no formula were misses, or a damage-type choice the smoke doesn't answer; those formulas carry `@item.rank`.

## Problems found and fixed

| Spell | Before | Now |
| --- | --- | --- |
| Dehydrate (3rd, 5th, …) | No module button: the card compiled PF2e's heightened copy (4d6, a 10-foot burst), which no longer matched the text's 1d6 and 5-foot burst. Once that was fixed, the stored spell at the cast rank still rolled 1d6. | The plan is compiled from the spell's own data. The fields PF2e's fixed-level heightening changed are taken from the stored spell, and the spell is always loaded at the cast rank when it has fixed-level data. Live: 4d6 persistent fire at 3rd. |
| Fear (3rd) | "Changed condition-spell target requires review": its heightened copy's 5 targets looked like a changed spell. | A field equal to PF2e's own fixed-level value at the cast rank isn't a change. |
| Life Link (3rd, 6th, 9th) | No module button (the same heightened-copy problem). | Resolved at each rank (Effect levels 3/6/9). |
| Interposing Earth (4th) | The reduction rose to 8, but the barrier said Hardness 2 and 5 HP. | "It has AC 5, 8 Hardness, and 20 Hit Points." at 4th. |
| Sleep (4th) | Refused. | Unconscious for 1 round (failure) / 1 minute (critical failure), Prone (until it Stands), and a note: releases what it's holding, can't wake by Perception, sleeps normally after. |
| Zenith Star (4th) | Refused. | The marked rows' note adds "You ignore the Concealed condition against targets marked by zenith star."; the note lasts 4 days (+1 day a rank). |
| Mushroom Patch (9th) | Refused. | The area's rows give Blinded instead of Dazzled. |
| Divine Plagues (5th) | Refused. | Pseudo Afflictions applies its own copy of the plague (by the spell's slug), so the module patches the Effect it makes: virulent, the stated conditions at value 2 in every stage, those already granted raised, and the stage text updated. |
| Putrefy Food and Drink (2nd, 3rd) | Refused. | Its note card has "Counteract an alchemical elixir" (or "a potion or alchemical elixir"). The GM names the item and its counteract DC and rank, and the caster's PF2e counteract check decides. |

**The general mechanism:** a fixed-rank Heightened entry that rewrites a save's rows becomes a heightened variant. The rows are built from the base rows (or the affliction handed off), and the card, or a lingering area's exposures, use them from that rank on. The core checks each variant's rows like the base. Entries the variant rules don't read keep the rank gate.

**Changed expectations:** five older tests asserted the rank gates (Sleep, Zenith Star, Putrefy Food and Drink, Mushroom Patch) and Interposing Earth's raised values; they now assert the heightened behaviour.

## Tests

820/820 pass. `test/rank-2-batch-16.test.js` is new. It checks:
- Sleep's variant rows and their absence below 4th;
- Zenith Star's, Mushroom Patch's and Divine Plagues' variants;
- Putrefy's counteract entries and Interposing Earth's raised barrier.

A whole-corpus compile (b269 → b270) changed only these plans: Divine Plagues, Interposing Earth, Mushroom Patch, Putrefy Food and Drink, Sleep and Zenith Star.

## Coverage

**Census:** unchanged at **1048**. These spells were already counted; they now also work at their heightened ranks.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

- **[Rank 1 heightened smoke](rank-1-heightened-smoke.json):** the 468 casts.
- **Re-run of the fixed spells** (character caster): all 14 resolved.
  - Dehydrate 3rd/5th, Fear 3rd, Life Link 3rd/6th/9th, Sleep 4th, Zenith Star 4th (note 4 days).
  - Putrefy 2nd/3rd, Mushroom Patch 9th, Divine Plagues 5th, Interposing Earth 4th, Pest Form 4th.
- **[Live case](phase-rank-2-batch-16-live-results.json)** `rank2Batch16`, in the `pftest` world:
  - Dehydrate at 3rd: "4d6 fire" persistent.
  - Sleep at 4th: Unconscious 1 round + Prone (failure) and 1 minute + Prone (critical failure), with the "Asleep" note.
  - Zenith Star at 4th: the note has the Concealed line.
  - Divine Plagues at 5th:
    - Pseudo Afflictions' Effect is virulent;
    - its stages are clumsy 2 + enfeebled 2 + stupefied 2 (and Slowed at stage 2);
    - the granted conditions are at 2;
    - its text reads "Clumsy 2".
  - Interposing Earth at 4th: resistance 8 and the barrier's 8 Hardness / 20 HP.
  - Putrefy at 3rd: the card's Counteract button; a counteract against an item (DC 10, rank 1) was decided (countered).
  - Mushroom Patch at 9th: the area's exposure rows are Blinded (success, failure) and Slowed + Blinded (critical failure).
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
