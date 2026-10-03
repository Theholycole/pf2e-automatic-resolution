# Rank 3 batch 14 — six proved Effect + note spells

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ghostly Weapon (3) | PF2e's Effect on the ally, its weapon choice preset to its one weapon: the weapon gains ghost touch and the magical trait. |
| Rapid Retreat (4, reaction) | PF2e's Effect on the caster: resistance to all damage equal to its level, removed once that damage is taken. The note says to teleport the token (the module doesn't move it). |
| Unfettered Movement (4) | PF2e's Effect on the touched creature: circumstance penalties to its Speed are suppressed. The automatic Escape is the note. |
| Entwined Roots (5) | PF2e's Effect on each living target: resistance 5 to bludgeoning and piercing. The Heightened 7th / 9th values (10 / 15) are checked against PF2e's formula. The caught ammunition is the note. |
| Unbreaking Wave Vapor (5, reaction) | PF2e's Effect on the caster: Concealed and +2 circumstance AC, removed once the triggering attack roll is posted. The Steps are the note. |
| Wind Jump (5) | PF2e's Effect: a fly Speed equal to the caster's Speed. Ending the turn on solid ground, and the rank 6 Acrobatics check, are notes. |

## Rules

**`effect-note-proof.js`** gains:
- readers for each rule sentence above. Multi-rule readers now carry `endsAfterAttack` / `endsAfterSave` and notes;
- note patterns;
- fixed-rank entries: "The resistances increase to N." is claimed only when the claimed Resistance rule gives exactly N at that rank, and Wind Jump's rank 6 midair check becomes a note from that rank;
- `max` / `min` in `ruleValueAt` (PF2e's Entwined Roots formula uses `max`).

**Other changes:**
- **`compile-ability.js`:** a proved Effect + note's own Effect link no longer counts as unscoped.
- **`target-predicate-compiler.js`:** "1 creature touched", and "up to N willing living creatures" (living).

## Tests

991 + 2 pass. `test/rank-3-batch-14.test.js` is new. It checks:
- the six proofs;
- that a heightened value or a fly rule that disagrees isn't proved.

A whole-corpus compile (b360 → b361) changed only these six.

## Coverage

**Census:** **1183 enabled** (milestone; 1179 non-ritual), up from 1177.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-14-live-results.json), case `rank3Batch14`, in the `pftest` world.
- **Ghostly Weapon:** the Effect on the ally, with its longsword selected.
- **Rapid Retreat:** resistance 7 at caster level 7; after 20 fire damage, the Effect was gone and the resistance 0.
- **Unfettered Movement:** the AdjustModifier Effect.
- **Entwined Roots:** bludgeoning 5 and piercing 5.
- **Unbreaking Wave Vapor:** Concealed; after the attack-roll message, no longer Concealed and the Effect gone.
- **Wind Jump:** fly 25.
- **Run note:** the first run looked the Effect up by its bare name (PF2e adds the weapon) and called `applyDamage` without a token. The second run passed.
- **Cleanup:** fixtures removed.
