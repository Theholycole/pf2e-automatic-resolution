# Rank 3 batch 15 — five proved Effect + note spells

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Levitate (3) | PF2e's Effect on the target: −2 circumstance to attack rolls, with its "stabilized" toggle (an Interact negates it for the turn). Raising the target, Sustain to move it, and climbing or crawling are notes. |
| Ghost Rush (3) | PF2e's Effect: +10-foot status to Speeds, ignoring difficult and greater difficult terrain. Striding twice, hazardous terrain, barriers, and the mount or vehicle are notes. |
| Girzanje's March (4) | PF2e's Effect on each ally the GM targets in the burst (no target line, so no count limit): +1 status to attack rolls, Fortitude, and Will against mental effects. The 7th / 10th values (+2 / +3) are checked against PF2e's formula. |
| Spectral Advance (5) | PF2e's Effect: resistance to all damage equal to the caster's level. The movement rules are notes. |
| Filter Air (4, reaction) | PF2e's Effect: one degree better on saves against inhaled poisons and diseases. |

## Rules

- **`effect-note-proof.js`:** readers and note patterns for these sentences, and the fixed-rank "The status bonus increases to +N." check, which every claimed modifier must meet at that rank (with the base value at the spell's rank).
- **`effect-runtime.js`:** an effect-note spell with no target line but an area has no recipient count limit; the GM targets the creatures in the area. Before, it was limited to 1.

## Tests

993 + 2 pass. `test/rank-3-batch-15.test.js` is new. It checks:
- the five proofs;
- that a heightened value that disagrees isn't proved.

A whole-corpus compile (b361 → b362) changed only these five.

## Coverage

**Census:** **1188 enabled** (milestone; 1184 non-ritual), up from 1183.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-15-live-results.json), case `rank3Batch15`, in the `pftest` world.
- **Levitate:** the FlatModifier and the RollOption.
- **Ghost Rush:** the Effect; land Speed 35.
- **Girzanje's March:** Fortitude +1 on both targeted allies; +2 at rank 7 (caster level 13).
- **Spectral Advance:** resistance 9 at level 9.
- **Filter Air:** its AdjustDegreeOfSuccess.
- **Run note:** the first run hit the 1-creature limit on the March, which led to the area fix.
- **Cleanup:** fixtures removed.
