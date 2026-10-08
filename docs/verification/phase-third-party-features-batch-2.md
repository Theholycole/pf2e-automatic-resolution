# Third-party features batch 2: seven more "+" spellshapes

2026-10-07. The second batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)). The spellshapes whose rules fit existing riders, or are the caster's own action.

## What changed

- **`plus-spellshapes.js`:**
  - A leading **Requirements** is now kept. A form may read it (Storm Spell); otherwise it becomes one of the requirements the table checks.
  - **Heroic Recovery+** (Clerics+): PF2e's Effect: Heroic Recovery on the healed creature. From the caster's 16th level, the Effect's rules are the text's raised values: +10 feet Speed, +2 attack rolls, +1 damage. Standing up is the table's.
  - **Mighty Summons** (Summoners+): a summon spell from slots resolves 1 rank higher, up to 10th. Act Together is the table's; the Special past 10th rank is a GM note.
  - **Storm Spell** (Oracles+): needs the air, cold, electricity or water trait, an area, cursebound 2 or more, and an encounter. The spell's area becomes difficult and hazardous terrain:
    - it lasts as many rounds as the cursebound value;
    - it deals the spell's rank in damage for each square moved through;
    - the type (electricity or bludgeoning) is chosen at the cast.
  - **Travel Channel** (Clerics+), **Ride the Spell** (Magus+) and **Slot Rehearsed Reload** (Wizards+): the caster's own Stride, ride or Interact is the table's. Ride the Spell checks that the spell has a range or an area.
  - **Tenacious Magic** (Magic+): the next spell at mythic proficiency, as Mythic Casting gives it. "Once per day" is the table's.
- **Runtime:**
  - `spellFacts` gained `cursebound` and `inEncounter`.
  - The requirements gained `rangeOrArea`, `minCursebound` and `inEncounter`.
  - At the cast, an area-terrain rider settles its rank damage, cursebound rounds and chosen type.
  - `healed-effect` gained `atLevel`.

The modules' own rules on these entries add the text to the spell's description (`ItemAlteration`) or set the spellshape selector; none changes the spell's numbers.

The official plans are unchanged except Temporal Twin's pending list, as before. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 1 | Batch 2 |
| --- | --- | --- |
| spellshape | 7 / 51 | 14 / 51 |

## Tests

`test/third-party-features-batch-2.test.js` (5). All 1,796 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-2-live-results.json), case `thirdPartyFeaturesBatch2`, in the `pftest` world. A 16th-level caster:

| Step | Result |
| --- | --- |
| Heroic Recovery+, Heal at 1 on an ally (PF2e's healing button) | PF2e's Effect: Speed +10, attack +2, damage +1 |
| Mighty Summons, Summon Animal at 2 | Resolved at 3 |
| Storm Spell, Chilling Spray at 2, Cursebound 2, no encounter | Refused: not in an encounter |
| The same in an encounter, bludgeoning chosen | Difficult terrain for 2 rounds; the foe moving 2 squares takes 4 bludgeoning |
| Tenacious Magic, Fear at 1 | DC 36 in place of 28 (mythic proficiency) |
| Ride the Spell, Fireball / Shield | Read / refused: no range or area |

Travel Channel and Slot Rehearsed Reload are unit-tested only: what they allow is the caster's own action.
