# Third-party features batch 5: mythic points, reports, allies and feints

2026-10-07. The fifth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)).

## What changed

- **`plus-spellshapes.js`**, four new forms:
  - **Drain Destiny** (Magic+): a single-target spell attack. On a hit, the caster regains a Mythic Point (up to its maximum) and the target loses one if it has any. Using it with a Spellstrike is the table's.
  - **Reporting Spell** (Wizards+): needs a spell attack or save. After the card:
    - the caster picks one enemy the spell affected that isn't immune, and one fact: highest weakness, lowest save, an immunity, or highest resistance;
    - the caster also learns any immunity, resistance or weakness to the spell's damage, and whether the save the spell targeted was the weakest or highest;
    - all this is whispered to the caster's owners and the GM, and the enemy becomes immune for a day.
  - **Enlightening Spell** (Oracles+): the module's Effect (a circumstance bonus to Recall Knowledge equal to the origin's cursebound value) on each ally the spell's Effect or healing reaches, when the caster is cursebound. The free Recall Knowledge is the table's.
  - **Beguiling Feint** (Wizards+): rolled on the card before the spell's own roll. The caster picks a target within 30 feet and rolls Deception against its Perception DC, adding the difference between Intelligence and Charisma.
    - On a success or better, the target is Off-Guard until the card finishes, and the caster gets a reminder Effect for its concealment from that creature until the end of its next turn. On a success, the reminder says the concealment ends with a hostile action.
    - On a critical failure, the caster is Off-Guard until the end of its next turn.
    - The module's own rule only adds Intelligence beside Charisma, and PF2e keeps the higher of the two. The text says "instead", so the difference is added instead.
- **Runtime:**
  - `applyShapeRiders` gained `mythic-drain`.
  - `finishShapeRiders` gained `reportingSpell` and the removal of Feint's Off-Guard.
  - `assignShapeTargets` gained `feint-check`.
  - New `allyRecipientEffect` and `shapeRecipientsAfter`: the Effect route calls the latter for its targets, and the healing path uses the former.
  - `shapeEffect` gained a description.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 4 | Batch 5 |
| --- | --- | --- |
| spellshape | 26 / 51 | 30 / 51 |

## Tests

`test/third-party-features-batch-5.test.js` (2). All 1,804 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-5-live-results.json), case `thirdPartyFeaturesBatch5`, in the `pftest` world. A 10th-level mythic caster (Intelligence +4, Charisma +0) with Cursebound 2:

| Step | Result |
| --- | --- |
| Drain Destiny, Hydraulic Push hits | The caster 1 → 2 Mythic Points, the foe 2 → 1 |
| Reporting Spell, Fireball at 3 on a foe weak to fire, "lowest save" chosen | Whispered: its lowest save, its fire weakness 5, and that Reflex is tied for weakest and highest; the foe immune |
| Enlightening Spell, Heroism at 3 on an ally | Heroism and the module's Effect: Enlightening Spell |
| Beguiling Feint, Hydraulic Push on a foe with a very low Perception | Deception with "+4 Intelligence instead of Charisma", a critical success; the foe Off-Guard during the card, not after; the concealment reminder on the caster |
