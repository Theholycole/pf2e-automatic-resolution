# Rank 2 batch 31 — blasts from the caster's own creatures

2026-10-01. Follows the user's decision of 2026-10-01: a choice that depends on the caster's companions is asked on the card.

| Spell | Now |
| --- | --- |
| Final Sacrifice (2) | A basic Reflex save for the creatures in the 20-foot emanation: 6d6 fire (+2d6 a rank). The card lists the scene's tokens with the minion trait and the caster picks one; it also shows the GM the summoned-or-permanently-controlled question. Finalize waits for the pick. The minion is slain (PF2e's Dead status), and a minion with the cold or water trait makes the damage cold. |
| Bony Barrage (2) | A basic Reflex save for the creatures in the 30-foot cone: 2d10 piercing (+1d10 a rank). The card reminds the GM to remove the destroyed thrall (thralls are marks on the map) and asks whether a second thrall is destroyed for bone armor. On a yes, the caster and its allies (PF2e alliances) among the targets take no damage. The caster and those allies also get +1 status to AC until the start of the caster's next turn. |

## Rules

- **`sacrifice-blast.js` (new pre-pass):** each spell's three rule sentences exactly (one sentence of narration allowed).
  - They become the ordinary basic save of the creatures in the area, plus `sacrifice` (`minion` with its trait type switch and the GM's question, or `thrall` with its reminder) and Bony Barrage's `boneArmor`.
  - The Heightened entry must be the item's own step.
- **`basic-save-core.js`:**
  - `validSacrifice` and `validBoneArmor` run on both the simple basic-save route and the degree route. A first test showed the simple route didn't check them; it now does.
  - Finalize waits for the minion and the bone armor answer.
  - `damageMultiplierForTarget` gives 0 to a bone-armored target.
- **`basic-save-runtime.js`:**
  - The card shows the minion select or the thrall reminder, and the bone armor buttons.
  - The minion's cold or water trait retypes the damage roll.
  - At Finalize the minion becomes Dead and the bone armor Effects are made.

## Tests

863/863 pass. `test/rank-2-batch-31.test.js` is new. It checks:
- both plans, the wait for the minion, and a forged retype being refused;
- the zero multiplier, and a changed bone-armor wording not being read.

A whole-corpus compile (b284 → b285) changed only these two spells.

## Coverage

**Census:** **1088 enabled**, up from 1086. Rank 2: 176 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-31-live-results.json), case `rank2Batch31`, in the `pftest` world.
- **Final Sacrifice at 3rd:**
  - The card asked for the minion, and Finalize was refused before the pick.
  - With a water minion the damage was "8d6 cold" (29). The failure lost 29 and the success 14.
  - The minion is Dead.
- **Bony Barrage at 2nd:**
  - The card showed the thrall reminder and the bone armor question. The answer was yes.
  - Both targets failed. The ally lost 0 and the foe 16 (2d10 piercing).
  - The caster and the ally hold +1 status AC for 1 round; the foe doesn't.
- **Cleanup:** fixtures removed.
