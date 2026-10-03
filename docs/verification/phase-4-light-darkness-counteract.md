# Counteract family (part 5): light and darkness — verification

2026-09-26. This continues the counteract family ([1](phase-4-counteract-care.md) · [2](phase-4-counteract-spells.md) · [3](phase-4-counteract-set-aside.md) · [4](phase-4-counteract-many.md)). Many damage spells counteract magical light or darkness along their ray or where their globe lands. The module can't see where magical light and darkness are, so until now this was a plain GM note on spell attacks only (Chilling Darkness) and blocked every save spell.

## Change

**`src/compiler/light-darkness-counteract.js`** runs before any route. It removes one of these sentences and makes it a card reminder:
- **Along a path** (`counteract-along-path`): “If the (ray|light|beam|line) passes through an area of magical (light|darkness) or targets a creature affected by magical …, <spell> attempts to counteract the …” (plus the optional “draw a line …” sentence).
- **Overlap** (`counteract-overlap`): “If the (globe|burst|cloud) overlaps with an area of magical (light|darkness) (or affects a creature affected by magical …), <spell> attempts to counteract the … (effect).”

Details:
- Heightened entries aren't touched.
- Two such sentences, or a mismatched light/darkness pair, aren't read.
- The reminder is allowed only on the save card; any other route gets `counteract-reminder-route` pending.
- Chilling Darkness's reminder now comes from here, with the same text.

**The Counteract button:** the save card shows **Counteract the darkness** (or light) under the reminder until the card is finalized. The GM names the effect and gives its counteract DC and rank. The card rolls the caster's PF2e counteract check (the spellcasting entry's `counteraction`; counteract rank = the cast rank) and applies the rank rules. It posts “… is counteracted: end it.” (GM to apply) or “… is not counteracted.”, flagged `reminderCounteract`.

**`extractConditionalClause`:** reads the extra damage for a creature trait written as the end of the damage sentence (“…, plus an additional @Damage[(@item.rank+1)d10[vitality]] damage to undead creatures.”). The clause becomes `conditionalDamage` for that trait, and the rest of the sentence is the spell's damage. “living” isn't a trait, so Eclipse Burst's void damage to the living isn't read.

## Coverage

**New:**
- **Radiant Beam:** basic Reflex; Dazzled 1 round on a failure and 4 rounds on a critical failure; counteracts darkness along the beam.
- **Moonburst** and **Sunburst:** Reflex tables; +vitality damage to undead; Blinded permanently on a critical failure; counteract darkness where the globe overlaps. Moonburst's silver cold damage is its entry's material.

**Census:** **368 enabled**, up from 365.
- The corpus diff against b51 made these 3 newly executable, with none lost.
- Moonlight Ray, Wall of Virtue and Eclipse Burst only moved their counteract sentence into a reminder; they stay blocked for other reasons.
- The speed, escape and six rule-family checks report 0 regressions.

**Still blocked here:**
- Moonlight Ray: its critical row names “fiend or undead” where the damage names the unholy trait.
- Eclipse Burst: void damage to the living; Blinded “by the darkness”.
- Inner Radiance Torrent: action and two-round variants, and a shining state.
- Wall of Virtue: a wall.
- Diadem of Divine Radiance: a skill as the counteract modifier.

## Evidence

**Automated:** 401/401 tests pass. `test/light-darkness-counteract.test.js` covers:
- both sentence forms, and the refusal of a mismatched light/darkness pair;
- the conditional clause (and not for “living”);
- the Radiant Beam, Moonburst and Sunburst plans;
- the refusal of an unknown reminder kind;
- Chilling Darkness keeping its reminder.

[Live evidence](phase-4-light-darkness-counteract-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `lightDarknessCounteract`:
- **Moonburst:**
  - The card had the button.
  - Against “Test darkness” (DC 1, rank 1): critical success at rank 7, and “… is counteracted: end it”.
  - Against DC 80 at the cast rank (7): critical failure, not counteracted.
  - On a failure, the living target lost 31 (the roll) and the undead target lost 68, with the extra vitality damage.
  - After Finalize, the button was gone.
- **Radiant Beam:** counteracted the same way; on a critical failure, the target lost 76 (2 × 38) and got “Radiant Beam: Dazzled”.
- **Chilling Darkness:** the button was present, and the counteract succeeded.
- **By hand:** clicking “Counteract the light” on the Chilling Darkness card opened the dialog. Entering “UI test light”, DC 1, rank 1 posted “critical success (rank 3 vs 1) … UI test light is counteracted: end it.”
- **Regressions:** `rayCounteract`, `conditionalDamage` and `silverDamage` were rerun, then cleanup.
