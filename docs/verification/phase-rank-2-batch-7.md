# Rank 2 batch 7 — a condition floor while the creature bleeds

2026-09-30.

| Spell | Now |
| --- | --- |
| Horrifying Blood Loss (2) | Success: Frightened 1. Failure: Frightened 2. Critical failure: Frightened 3. On a failure or critical failure, Frightened can't drop below 1 until the creature stops taking persistent bleed damage. Only a creature taking bleed damage can be targeted (batch 5). |

## Rules

- **The floor:** "Until it stops bleeding, its frightened value can't decrease below frightened 1." is a floor Effect that holds Frightened 1 (`lifetime: "while-persistent"`, `persistentDamage: "bleed"`).
  - The Effect is linked to the creature's persistent bleed. The module's existing persistent-damage link removes it when the creature's last persistent bleed condition ends.
  - It's read only when the target line requires persistent bleed damage. Otherwise the floor stays blocked.
- **The critical failure:** "As failure, but the target is Frightened 3." keeps the failure's floor.
- **Not automated:** at 4th rank, up to four secondary targets that needn't be bleeding. Their floor depends on the primary target's bleeding. The module's target check refuses creatures that aren't bleeding, so secondary targets are the GM's.

## Plan validator fix

Batch 5's new target checks weren't accepted by the plan validator (`validate-plan.js`), which marked any plan using them unsafe:
- a trait that must be absent;
- `not-caster`;
- `living-or-undead`;
- `persistent-damage`.

The validator now accepts them. A whole-corpus compile (b260 → b261) changed 8 plans: Life Link, Horrifying Blood Loss, Imprinting Hand, Worm's Repast, Positive Attunement, Debilitating Dichotomy, Grisly Growths and Implosion.
- Only Horrifying Blood Loss became executable. The others are no longer unsafe but still have other rules to do.
- Life Link's own route was unchanged.
- [Batch 5's verification](phase-rank-2-batch-5.md) carries a correction note.

## Tests

795/795 pass. `test/rank-2-batch-7.test.js` is new. It checks:
- the floor on both failure rows, and the core's checks of the floor's shape;
- that the floor is blocked without the target line's bleed;
- that the validator accepts the predicates.

## Coverage

**Census:** **806 enabled**, up from 805. Rank 2: 71 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-7-live-results.json), case `rank2Batch7`, in the `pftest` world. The failure and critical failure targets each had a persistent bleed condition (1d6, DC 15); a third target had none.
- **Cast:** the failure gave Frightened 2 and the critical failure Frightened 3, each with "Horrifying Blood Loss: frightened floor". Its text reads "Can't reduce Frightened below 1 while taking persistent bleed damage."
- **Non-bleeding target:** ineligible ("requires persistent bleed damage"), and not Frightened.
- **The floor:**
  - Three reductions left the failure target at Frightened 1.
  - Deleting its bleed removed its floor Effect, and Frightened went to 0.
  - The critical failure target, still bleeding, kept its floor.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
