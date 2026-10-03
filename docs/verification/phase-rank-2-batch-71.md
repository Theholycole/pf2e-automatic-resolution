# Rank 2 batch 71 — Blazing Armory

2026-10-01. Follows the user's decision of 2026-10-01: an object's effect (here, touching the weapon) is rolled on the card.

| Spell | Now |
| --- | --- |
| Blazing Armory (2) | The caster picks a common simple or martial weapon (from PF2e's Item compendiums) for each targeted willing creature: one at 2nd, up to 5 from 4th, each with its own. The creature gets it for 5 minutes, held if it has a free hand, otherwise dropped in its space. The weapon's damage is fire, with its versatile and modular traits removed, and it carries the rank's runes: +1 striking; +1 striking flaming (4th); +2 greater striking flaming (6th); +3 greater striking greater flaming (8th); +3 major striking greater flaming (10th). It's removed when its Effect ends. The card's button deals 1d6 fire to the creature the GM targets that touched, Struck with or Disarmed one; the caster and the holders are refused. The thrown and ammunition sentences are notes on the Effect. |

## Rules

- **`blazing-weapons.js` (new family, kind `conjured-weapons`):**
  - It reads the seven sentences and the four heightened entries exactly (one sentence of narration allowed). Each entry's runes must be a known potency, striking and property set.
  - `conjuredWeaponsAt` gives the runes and target limit at a rank.
- **Runtime:**
  - `#executeConjuredWeapons` — the choice per target (`weaponUuids` in tests), the item (type, traits, runes, free hand), and the Effect, which removes the item through the existing `conjuredOnEnd`.
  - `conjuredTouch` and its card button.

## Tests

936/936 pass. `test/rank-2-batch-71.test.js` is new. It checks:
- the runes and limits at each rank, and the touch damage;
- that an extra damage type or an unknown rune isn't read, while the text's own potency is.

A whole-corpus compile (b326 → b327) changed only Blazing Armory.

## Coverage

**Census:** **1148 enabled**, up from 1147. Rank 2: 234 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-71-live-results.json), case `rank2Batch71`, in the `pftest` world (character targets, Strength +2).
- **At 2nd:** "Longsword (Blazing Armory)" was held, with runes +1 striking, no versatile trait, and damage "2d8 + 2 fire".
- **Two targets at 2nd:** refused.
- **The Effect's end:** removed the weapon.
- **At 4th, two targets:** the free creature holds it; the one with both hands busy has it dropped. With flaming, the damage was "2d8 + 1d6 + 2 fire".
- **Touch:** the third creature lost 1 HP (1d6 fire).
- **Cleanup:** fixtures removed.
