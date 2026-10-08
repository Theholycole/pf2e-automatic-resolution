# Third-party features batch 20: Colossal Summon and Colossal Aspect Form

2026-10-07. The twentieth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)), in the spellshape family.

## What changed

- **Colossal Summon** (`plus-spellshapes.js`; `colossal` rider, `colossalSummon` in `spellshape-runtime.js`): a 10th-rank summon's creature gains:
  - **Colossal:** Gargantuan (PF2e's CreatureSize), its token 6 by 6 squares, +20 feet to all its Speeds.
  - **Trample:** PF2e's creature Trample (Huge or smaller, its first melee Strike, the casting's spell DC), or a reminder of the larger damage dice when it has one.
  - **Earth-Shatterer:** an innate entry with Earthquake at the casting's DC, and the 2-action ability. Its card casts the Earthquake (`actionCastOnCard`, `text-rules.js`), once per minute.
  - **Megalophobia:** a 100-foot aura following the creature (`startFollowingAura`). A creature entering or starting its turn in it saves (Will, emotion, fear, mental): frightened 2, or frightened 3 and fleeing while frightened on a critical failure. Then it is immune for 1 hour.
- **Direct condition rows** in an aura's condition save (`ongoing-families.js`): PF2e's condition raised to the row's value, or one lasting while another does.
- **A summon's ongoing areas end first** (`main.js`): before the creature is removed, so an area whose source is gone doesn't wait for review.
- **Colossal Aspect Form** (`form-choice` and `colossal-form` riders; `shapeChoiceSelectionsFor` read by the effect route): an aspect battle form (aspectmorph) at 10th is Gargantuan, with reach 25 and the caster's token 6 by 6. It gives the module's aspect Trample, or a dice reminder. The token size and Trample are undone when the form ends (`shapeTieEnded`).

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 19 | Batch 20 |
| --- | --- | --- |
| spellshape | 46 / 51 | 48 / 51 |

## Tests

`test/third-party-features-batch-20.test.js` (2). All 1,833 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-20-live-results.json), case `thirdPartyFeaturesBatch20`. Re-run: `rank5Batch86` (Tree of Life and Death's areas ending with the trees), `thirdPartyFeaturesBatch19` and `thirdPartyBatch46`, which still pass.

| Step | Result |
| --- | --- |
| Colossal Summon, then Summon Animal at 10 (a Sea Serpent) | Gargantuan, token 6 by 6; land Speed 20 → 40; Trample; Earth-Shatterer; the Megalophobia aura |
| Earth-Shatterer's card, twice | Earthquake cast by the summon; the second refused (within the minute) |
| A foe (Will −20) starting its turn in the aura | Frightened 3 and fleeing; immune for an hour |
| The summon's Effect removed | The aura's region gone; the creature removed |
| Colossal Aspect Form, then Animal Shift at 10 (aerial) | The form Gargantuan with reach 25; token 6 by 6; Trample |
| The form ended | Token back to 1 by 1; Trample removed |
