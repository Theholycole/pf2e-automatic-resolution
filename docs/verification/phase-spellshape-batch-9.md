# Spellshape batch 9: family F, healing and harm

2026-10-05. Feats on Heal, Harm and healing spells.

- **PF2e's applied healing and damage:** Heal and Harm resolve with PF2e's buttons. The module follows PF2e's applied-damage message back to the shaped cast (`shapeOnApplied`). On healing, the healed creature's riders apply. On damage, the damaged riders apply, with the degree of the creature's save against the cast.
- **Healed riders:**
  - PF2e's Effect (Defensive Recovery, Heroic Recovery);
  - extra Strike dice by rank and spell (Divine Infusion);
  - the caster's Hit Points given (Martyr);
  - Hit Points more (Cleansing Spell);
  - a counteract against a tracked disease or poison through the module's counteract card (Cleansing Spell, Purifying Spell).
  - Once per cast where the text says "one target".
- **Healing at the cast:** Healing Transformation.
- **Casts with no roll:** a spell with no save, attack or damage (Pest Form) posts no "spell-cast" context; its card counts as the cast, and the Spellshape selector is read from the caster.
- **Choices:** a choice given on the armed feat now reaches the card's riders too.
- **Reading:**
  - "on a single target and the target regains Hit Points from the spell";
  - "to restore Hit Points to a single ally";
  - "with the healing trait on a living creature";
  - "targets only one creature" (the caster alone counts);
  - "targets only a single ally";
  - "to use your divine font to cast";
  - a Frequency before the lead.

| Feat | Now |
| --- | --- |
| Defensive Recovery, Heroic Recovery | PF2e's Effect on the healed creature. |
| Divine Infusion | +1d6 (2d6 at 5th, 3d6 at 8th) vitality or void on melee Strikes until the end of its next turn. |
| Martyr | The caster loses 1d8 per rank; the ally regains them. |
| Cleansing Spell | The caster's level in Hit Points more; a counteract against disease or poison. |
| Purifying Spell | A counteract against disease or poison. |
| Healing Transformation | 1d6 per rank of healing at the cast. |
| Cast Down | Prone when damaged; PF2e's Effect on a critical failure. |
| Ebb and Flow, Echoing Channel, Interweave Dispel | Read (the table's). |
| Blessed Spell, Remediate | Read (the GM's notes). |

## Tests

`test/spellshape-batch-9.test.js` is new. Coverage: 78 of 131 feats and 13 of 49 wand kinds read. Live batches 1 to 8 pass again.

## Evidence

[Live evidence](phase-spellshape-batch-9-live-results.json), case `spellshapeBatch9`, in the `pftest` world. Healing and damage are applied as PF2e's buttons do.

| Step | Result |
| --- | --- |
| Defensive and Heroic Recovery (cards) on Heal | Both Effects on the ally |
| Divine Infusion on 5th-rank Heal | +2d6 vitality on melee Strikes |
| Martyr on 2nd-rank Heal | The caster lost 6; the ally regained 6 more |
| Cleansing Spell on Heal (caster level 5) | 5 more |
| Purifying Spell on Heal, the ally poisoned by Spider Sting | The counteract card against the venom |
| Cast Down on Harm, the foe critically failing | Prone; PF2e's Effect |
| Healing Transformation on Pest Form, the caster at 1 Hit Point | Healed |
