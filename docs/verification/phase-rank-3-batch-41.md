# Rank 3 batch 41 — Sparkleskin

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Sparkleskin (3) | PF2e's Spell Effect: Sparkleskin on the willing target: +2 status to Deception to Create a Diversion or Feint, and to Performance to Perform with the visual trait. The cast posts a card with a glitter-burst button: when the target takes damage, the GM targets the creatures within 5 feet of it and they save (Fortitude). A failure gives Dazzled for 1 round, a critical failure 3 rounds. |

## Rules

- **Triggered area saves (`granted-save-action.js` `extractTriggeredAreaSave`, `compile-ability.js`):** reads "When the target takes damage, … in a @Template[emanation|distance:N]. Creatures in the area must attempt a X save." with the degree rows that follow. Unstated success rows are unaffected. The Effect is compiled without them. The save becomes a granted action whose plan has the emanation as its area. Its button takes every targeted creature (one creature for an action without an area).
- **Per-action bonuses (`direct-effect-resolution-compiler.js`):** "The target gains a +N status bonus on <Skill> checks to <Action> and to <Action>, and on <Skill> checks to <Action> that have the <trait> trait." is covered when each action has a FlatModifier of that value and type on its skill, predicated on the action (and the trait).

## Tests

1107 pass. `test/rank-3-batch-41.test.js` is new, with a negative case: a bonus PF2e doesn't give isn't proved.

A whole-corpus compile (b437 → b438) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-41-live-results.json), case `rank3Batch41`, in the `pftest` world.
- The ally got PF2e's Effect, and the card has the button.
- The button's Fortitude card for two creatures, set to a failure and a critical failure, gave Dazzled for 1 and 3 rounds.
- **Regression check:** Swarm Form's single-target button (`rank4Batch22`) still passes.
- **Cleanup:** fixtures removed.
