# Rank 7 batch 6 — Skeletal Lancers, Recurring Nightmare, Living Graveyard, Perfected Thrall, Telekinetic Bombardment

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Skeletal Lancers, Recurring Nightmare, Living Graveyard, Perfected Thrall | New kind `thrall-summon` (`thrall-summon.js`). The thralls are tokens by the thrall rules, with the spell's size, HP, Speed, fly Speed, reach and damage type (`makeThralls` gains fly, a stated damage type and extra rules). Thrall Charge's extra dice (and its heightened step) are a toggle on their Strike. The Living Graveyard's five base thralls appear beside it. Card controls: a save the GM starts for the creatures it reaches (the nightmare entering a space: Frightened 1/2; the graveyard appearing: Prone), more base thralls (on the graveyard's Stride, on the perfected thrall's critical hit), the nightmare resummoned (only once its token is gone, once per round), and the lancers' 5 piercing to an enemy that Strikes near them. The rest are notes. |
| Telekinetic Bombardment | Lead reworded (`save-rewrites.js`): the save on the creatures the GM targets. The burst-or-line choice and the rubble's difficult terrain are a reminder (new kind `area-shape`). |

## Tests

`test/rank-7-batch-6.test.js` is new. A whole-corpus compile (b731 → b732) changed only these five spells.

## Evidence

[Live evidence](phase-rank-7-batch-6-live-results.json), case `rank7Batch6`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Skeletal Lancers (2) | Speed 30, piercing, reach 10, a 2d6 Thrall Charge toggle; the control deals 5 piercing to an enemy |
| Recurring Nightmare | Fly 60, void; the space save's critical failure Frightened 2; resummoning refused while it exists, allowed after its token is gone |
| Living Graveyard | Gargantuan, 400 HP, reach 15, five base thralls beside it; five more from the Stride control |
| Perfected Thrall | 200 HP, a 6d6 Thrall Charge toggle |
| Telekinetic Bombardment, critical failure | Prone and Stunned 1; the rubble reminder on the card |

**Cleanup:** fixtures and every summoned thrall removed.
