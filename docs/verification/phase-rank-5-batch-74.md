# Rank 5 batch 74 — Forceful Hand

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Forceful Hand (5) | **The hand** is a token adjacent to the caster, with the cast rank's statistics: AC 25 and 50 HP at 5th, up to AC 35 and 90 HP at 9th; Large from 7th; saves at the spell DC − 10. The caster's sustained Effect removes it, and every Effect it put on others, when it ends. **The card's end-of-turn entries** (the GM presses the first matching a trait of the caster's actions): **Manipulate or Attack** is lesser cover (+1 AC); **Move** is standard (+2 AC, Reflex, Stealth); **Concentrate** is greater (+4). It's an Effect on the protected creature with its bonuses toggled on for attacks through the hand's square. **"Protect an ally"** moves it to a targeted ally. **At 6th and higher** the caster may replace Manipulate or Attack when casting. That entry then rolls the caster's spell attack against a targeted enemy within range: **Swat** is a Push against its Fortitude DC (the GM moves it 5 or 10 feet); **Grasp** is a Grapple (Grabbed, or Restrained on a critical success, until the end of the caster's next turn); **Punch** is a Strike against its AC for 7d8 force; **Crush** is a Strike for 6d8 force that grabs, or, with a creature already grabbed, a Constrict save card (6d8 force, basic Fortitude). |

## Rules

- **`src/compiler/force-hand.js`:** reads every sentence, the entries and each Heightened rank; `forceHandAt` gives a rank's statistics. Crush's Constrict is a compiled basic save (the `phaseFormula` evidence).
- **`summonOnEnd`:** also removes the Effects flagged `summonLinked` to the summon's cast.
- **Runtime:** new kind `force-hand`; `forceHandAct` (API and card buttons).

## Interpretation

- **QUESTION: the hand's saves.** The text gives AC and HP only. Its saves are set at the spell DC − 10 (as for other conjured objects).
- **The entry choice** is the GM's: the module can't see every action's traits.
- **Cover** applies only to attacks through the hand's square; the toggle defaults on (the hand interposes) and is switched off for one that doesn't.
- **"Until the end of your next turn"** for the grabs is a round from the roll, ending at a turn's end (as for Chromatic Ray).

## Tests

`test/rank-5-batch-74.test.js` is new. It covers the ranks, entries, replacements, the Constrict plan (supported) and an unrecognised clause (not read).

A whole-corpus compile (b682 → b683) changed only Forceful Hand.

## Evidence

[Live evidence](phase-rank-5-batch-74-live-results.json), case `rank5Batch74`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 5th | The hand: AC 25, 50 HP, Medium |
| Move | The caster's AC +2 |
| Protect an ally, then Concentrate | The ally's AC +4; the caster's cover gone |
| The caster's Effect deleted | The hand's token and the ally's cover gone |
| 7th, Grasp on a weak foe | Large hand; critical success: Restrained; gone when the spell ends |
| 9th, Crush | AC 35, 90 HP; critical hit for 60 force; Grabbed |
| Crush again | Constrict card; a failure took 27 force |

**Cleanup:** fixtures removed.
