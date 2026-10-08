# Third-party features batch 6: Seeking Spell and the table's spellshapes

2026-10-07. The sixth batch of the "+" modules' entries that build on spells ([audit](../planning/third-party-features-audit.md)).

## What changed

- **Seeking Spell** (Feats+):
  - The card's spell attack against a target gets a "cover reduced" modifier: up to 2, never more than the target's cover bonus from PF2e's Effect: Cover (`shapeCoverReduceFor`, in `basic-save-runtime.js`'s attack roll).
  - A plain miss (not a critical one) leaves a reminder on that target: the caster can Sustain on its next turn to roll the attack again. It gets one round more at 14th level and every 2 levels after.
- **The table's.** These spellshapes describe what the caster, an ally or an eidolon does, or prepares, rather than how the spell resolves. Each is read as a table rule:
  - **Tandem Casting** (Summoners+): the other's cast in the same activity. The spell is checked for 1 or 2 actions.
  - **Spell Tag** (Feats+): the ally's later Interact. The spell is checked for a touch range.
  - **Distilled Magic**, **Mixed-Potency Tincture**, **Recharging Spellgun**, **Elemental Study Notes** (Wizards+): daily preparations, the spellgun, Learn a Spell. These are marked `passive`.
  - A leading Requirements stays a table requirement.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is still 227 of 227.

## Census

| Family | Batch 5 | Batch 6 |
| --- | --- | --- |
| spellshape | 30 / 51 | 37 / 51 |

## Tests

`test/third-party-features-batch-6.test.js` (2). All 1,806 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-6-live-results.json), case `thirdPartyFeaturesBatch6`, in the `pftest` world:

| Step | Result |
| --- | --- |
| Seeking Spell, Hydraulic Push against a foe with standard cover | The attack's modifier is 2 over the caster's plain spell attack |
| The same, a miss | The Sustain reminder on the target |
| Spell Tag, Fireball | Refused: its range isn't touch |
| Tandem Casting, Fireball | Read |
| Distilled Magic, then Fireball | Read; nothing applied |
