# Rank 2 batch 27 — repeated spell attacks, object damage, GM-triggered areas

2026-10-01. Follows the user's decisions of 2026-10-01: object damage rolls on the card, and area damage the module can't detect is a GM control.

| Spell | Now |
| --- | --- |
| Spiritual Weapon (2) | A melee spell attack when cast and again from the spell's card on each Sustain. It deals 2d8 (+1d8 per 2 ranks) of force or of the weapon's type (bludgeoning, piercing or slashing), picked for each attack. Moving the weapon, the multiple attack penalty and the weapon's other limits are notes. |
| Spiritual Armament (2) | The same shape, at range: 2d8 (+1d8 per 2 ranks) of the weapon's type, or spirit when the GM judges that more detrimental, picked for each attack. The 120-foot repeat, the multiple attack penalty, the weapon's return and sanctifying are notes. |
| Shatter (2) | The card rolls 2d10 sonic (+1d10 a rank) and states the Hardness the spell ignores (4, +2 a rank). The GM applies it to the object. |
| Explosive Dust (2) | A placed 5-foot burst for 1 minute. In Ongoing spells the GM targets an enemy that passed through and gives the squares; each square rolls 1d4 fire (+1d4 per 2 ranks) and applies it with PF2e's IWR. Seeking the dust, the safe squares and the end when all of it explodes are GM notes. |
| Tacky Pine Sap (2) | A placed 5-foot burst of difficult terrain for 1 minute. In Ongoing spells the GM marks the sap igniting: each targeted creature standing on it takes `floor(rank/2)d6` persistent fire, and the spell ends (the sap and its terrain go). |

## Rules

- **`sustain-attack.js`:** Spiritual Weapon's and Spiritual Armament's sentences, exactly. They become the existing repeated spell attack with the caster's damage-type pick, now with each spell's own list of types.
- **`object-damage` (new family):** "You deal NdX <type> damage to the object, ignoring the object's Hardness if it is N or lower." for "1 unattended object", with "Heightened (+N) The damage increases by …, and the Hardness the spell ignores increases by N."
- **`hazard-area` (new family):** two controls.
  - Per square, for Explosive Dust: "enemies who move into the dust trigger explosions, taking NdX <type> damage for every square they pass through".
  - Ignite, for Tacky Pine Sap: "When a creature within the area uses a <trait> effect or receives <trait> damage, the <thing> ignites, dealing @Damage[floor(@item.rank/N)dX[persistent,<type>]] damage to anyone standing on it; this burns up …".
  - The area runs on `startRegionArea` with `gmHazard`. The Ongoing control and the `gm-hazard` request roll the formula at the cast rank and apply it with PF2e's IWR.

## Tests

855/855 pass. `test/rank-2-batch-27.test.js` is new. It checks:
- each spell's data and its formula at higher ranks;
- that changed wordings are refused.

A whole-corpus compile (b280 → b281) changed only these five spells.

## Coverage

**Census:** **1080 enabled**, up from 1075. Rank 2: 168 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-27-live-results.json), case `rank2Batch27`, in the `pftest` world.
- **Spiritual Weapon at 4th:**
  - The type choices were force/bludgeoning/piercing/slashing.
  - A force hit dealt 3d8 (lost 10 of 10). A piercing critical dealt 3d8 doubled (lost 26 from 13).
  - The spell's card has "Resolve Spell Attack".
- **Spiritual Armament at 4th:** choices bludgeoning/piercing/slashing/spirit; spirit 3d8 (10 of 10); piercing critical 24 from 12.
- **Shatter at 3rd:** rolled 3d10 = 20, ignoring Hardness 6 or lower, with the GM's line.
- **Explosive Dust at 4th:** three squares rolled 2d4 fire each; the enemy lost 9, as reported. The spell stayed active, and ending it removed the region.
- **Tacky Pine Sap at 4th:**
  - The region is difficult terrain.
  - Igniting under two creatures gave each 2d6 persistent fire, ended the spell, and removed the region.
- **Cleanup:** fixtures and regions removed.
