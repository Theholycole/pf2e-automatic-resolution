# Rank 2 batch 68 — Dancing Shield

2026-10-01. Follows the user's decision of 2026-10-01: an Effect + note spell counts once the module covers what PF2e's Effect doesn't.

| Spell | Now |
| --- | --- |
| Dancing Shield (2) | The cast asks for the shield: one the caster has (its AC bonus and Hardness), or an unattended one (its bonus and Hardness typed in). PF2e's Effect goes on the target creature, with its choice preset to the shield's bonus (+1 to +3), so the target gets that circumstance bonus to AC while the sustained spell lasts. That stands for the Raise a Shield on each cast and Sustain. From 4th, the card has a Shield Block button: if the caster has the Shield Block reaction and the spell is still on the target, the target regains up to the shield's Hardness of the physical-attack damage it took, and a shield the caster has takes the rest. |

## Rules

- **`effect-note-proof.js`:**
  - A reader for the Raise a Shield sentence. It claims PF2e's ChoiceSet (1, 2, 3) and the AC modifier read from it, and adds `shieldChoice`.
  - Readers can now carry `extra` data into the proof.
  - The narration sentence.
  - The 4th-rank Shield Block entry, read exactly, gives `shieldBlockFromRank`.
- **Runtime:**
  - `#executeEffectNote` picks the shield (`shieldItemId` in tests) and presets the choice.
  - From the rank, the card carries `noteShieldBlock` and the button.
  - `noteShieldBlock` checks the reaction and the Effect, then applies the restore and the shield's damage.

## Tests

930/930 pass. `test/rank-2-batch-68.test.js` is new. It checks:
- the proof;
- that another action, or a changed Shield Block, isn't proved.

A whole-corpus compile (b323 → b324) changed only Dancing Shield.

## Coverage

**Census:** **1145 enabled**, up from 1144. Rank 2: 231 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-68-live-results.json), case `rank2Batch68`, in the `pftest` world. The caster is a character with a steel shield (+2, Hardness 5, 20 HP) and the Shield Block feat.
- **At 2nd:** the ally got "Spell Effect: Dancing Shield (+2)" and its AC rose by 2. There was no Shield Block button.
- **At 4th:** the button was there. After 9 damage, Shield Block restored 5 (391 → 396), and the shield went from 20 to 16 HP.
- **Cleanup:** fixtures removed.

## Limit

Shield Block is applied after the damage, as a correction. An unattended shield's own HP is the GM's to track.
