# Third-party features batch 7: the "+" items' spellshape activations

2026-10-07. The seventh batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)). It covers Magic+'s Power Rings and scepters, whose activations are spellshapes.

## What changed

- **`item-spellshape.js`:** when the official item reader reads nothing, `readPlusItemSpellshape` splits the item's activations. Each one with the spellshape trait is read as a feat (`readSpellshapeFeat`), with its frequency kept. An item is unread if any of its spellshape activations is unread.
- **`plus-spellshapes.js`**, the activations' forms:
  - **Veracious Spell** (Power Rings): an item bonus to spell attacks this turn, as each ring's text gives it (Iron +1, Silver and Platinum +2). The Sustain's later attacks are the table's.
  - **Sicken Spell** (Scepter of Sickening): Sickened 1 on a failed basic Fortitude save, 2 on a critical failure.
  - **Energy Ablation** (its scepter): resistance equal to the rank to one energy type, chosen among those the spell deals, until the end of the caster's next turn.
  - **Heighten Spell** (Scepter of Heightening): needs a spell at least 3 ranks below the highest; resolved 2 ranks higher, with the limits as a note.
  - **Reach Spell** (Scepter of Greater Distances): the range (+30, or +45 with the Reach Spell feat) is the table's.
  - **Dangerous Odds** (Scepter of Second Chances): the caster's reaction to make the target reroll is the table's (the card's Roll Save Again).
  - **Purifying Spell** (Scepter of Purifying): counteracting the sickened condition is a GM note.
- **`recordShaping`:** PF2e's spellshape selector set by a "+" item (the ring's "Veracious Spell" suboption) now finds the item and reads its activation of that name.
- **Self-resistance:** the rider can limit its choice to the spell's own damage types (`spellTypesOnly`).

The modules' own rules on these items are predicated on the selector, which the runtime switches off at the cast, so they never add to the riders. Still to do in this group: the Precision rune's Hone Spell (a save spell turned into a spell attack) and the Calling rune's Veracious Summon.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 6 | Batch 7 |
| --- | --- | --- |
| item-cast | 0 / 122 | 10 / 122 |

## Tests

`test/third-party-features-batch-7.test.js` (1). All 1,807 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-7-live-results.json), case `thirdPartyFeaturesBatch7`, in the `pftest` world. A 10th-level caster:

| Step | Result |
| --- | --- |
| Power Ring (Silver), armed from its card, then Hydraulic Push | +2 item to spell attacks this turn |
| The same ring worn and invested, PF2e's selector set to Veracious Spell | Read, the same +2; the selector off after the cast |
| Scepter of Sickening, Sudden Blight on two foes (failure, critical failure) | Sickened 1 and Sickened 2 |
| Scepter of Energy Ablation, Fireball at 3 | Fire resistance 3 |
| Scepter of Heightening, Fear at 1 (highest 5) | Resolved at 3 |
| Greater Distances (Fireball), Second Chances (Fear), Purifying (Heal) | Read; Purifying's note posted |
