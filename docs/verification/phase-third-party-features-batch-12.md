# Third-party features batch 12: the wickets, first four

2026-10-07. The twelfth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)). It covers Magic+'s Eldritch Wicketeer wickets.

## The rules read

- **Eldritch Wicketeer Dedication:** "When you Cast a Spell from Focus Points or spell slots with at least one of your wicket's traits while within the area, you gain your wicket's threaded magic effect … You can only trigger a tethered magic effect once per round."
- **Through the Wicket:** "At 11th level, you gain the Overwhelming Wicket ability while within the area of your wicket's dominion."
- Each wicket's own text gives its traits, its threaded magic and its Overwhelming Wicket.

## What changed

- **`readWicket`** (`plus-feature-rules.js`): a wicket's passive riders.
  - Its requirements: inside the caster's dominion, a slot or Focus spell, one of the wicket's traits.
  - Threaded riders are marked `threaded` (once a round); Overwhelming ones `minLevel: 11`. Each part names the spell traits it needs (`ifTraits`).
- **The four wickets:**
  - **Luminor:**
    - Threaded: the fire spell's hit or failed save gives persistent fire equal to the rank, added to the spell's own persistent fire.
    - Overwhelming: spirit instead of fire, asked (the threaded damage follows); Blinded for 1 round on a critical failure against a light spell (its fire spells have the light trait).
  - **Propulsor:**
    - Threaded: a water spell's hit or failed save pushes the target 5 feet (10 on a critical), away from the caster. Removing Prone with a force spell is the table's.
    - Overwhelming: force instead of bludgeoning, asked; a force spell with no save that deals damage gives each damaged creature a Fortitude save card (Off-Guard until the end of its next turn; Prone on a critical failure).
  - **Erosior:**
    - Threaded: around each creature an earth spell hits or that fails its save, difficult terrain; around one an acid spell does, hazardous terrain (the rank in acid each time a creature passes through). Both last while the dominion does.
    - Overwhelming: bludgeoning instead of acid, asked; an earth spell's failed save gives −5 feet Speed for 1 round (−10 on a critical failure).
  - **Verdor:**
    - Threaded: the cover squares are the caster's placement (the table's).
    - Overwhelming: Immobilized for 1 round on a critical failure against a plant or wood spell; the escape DC is the table's.
- **Runtime:**
  - Manifest Wicket Dominion's region now records its caster (`wicketDominionOf`).
  - The passive riders are filtered at the cast by traits, level and the once-a-round rule.
  - Optional damage-type swaps are asked at the cast.
  - The push rider gained attack degrees.
  - New `degree-rules` and `damaged-save` riders.
  - Terrain around creatures can be hazardous and can last as long as a region.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 11 | Batch 12 |
| --- | --- | --- |
| cast-rider | 9 / 66 | 13 / 66 |

## Tests

`test/third-party-features-batch-12.test.js` (2). All 1,817 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-12-live-results.json), case `thirdPartyFeaturesBatch12`. It also re-ran third-party batch 47 (Manifest Wicket Dominion's own case), which still passes.

The test caster is an 11th-level wicketeer inside its dominion, choosing to keep each original damage type. Cantrips aren't "from Focus Points or spell slots", so copies of Hydraulic Push (given the force trait) and Pummeling Rubble (given wood) stand for those spells.

| Step | Result |
| --- | --- |
| Luminor, Fireball at 3, a failure and a critical failure | 3 persistent fire on both; the critical failure Blinded |
| A second Fireball the same round | No threaded effect |
| Propulsor, Hydraulic Push hits | 10 feet (the spell's own 5 and Propulsor's 5) |
| Propulsor, a force spell with no save hits | The Fortitude save card |
| Erosior, Acidic Burst failed | Hazardous terrain (1 acid a pass) around the foe, tied to the dominion |
| Erosior, Pummeling Rubble failed | Difficult terrain; −5 feet Speed |
| Verdor, a wood spell critically failed | Immobilized |
| The dominion ends | Erosior's terrain removed |
