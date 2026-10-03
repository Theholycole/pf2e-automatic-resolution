# Rank 5 batch 32 — Flame Strike

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Flame Strike (5) | 8d6 fire (+2d6 a rank), basic Reflex. Creatures apply only half their usual fire resistance. A creature immune to fire takes the damage untyped, with its result one degree better. |

## Rules

- **Resistance halving (`src/compiler/resistance-halving.js` `compileResistanceHalving`):**
  - It reads "… creatures in the area apply only half their usual X resistance." and "Creatures that are immune to X, instead of gaining the usual benefit of immunity, treat the results of their saving throws as one degree of success better."
  - X must be the spell's one damage type.
  - The rest of the description must be a simple basic save.
- **Plan:**
  - `resolution.resistanceHalving {type}`;
  - `resolution.degreeAdjustment` with the new predicate `immunity-any`, read from PF2e's immunities;
  - validated by `isResistanceHalving` in `basic-save-core.js`.
- **Runtime (`basic-save-runtime.js`):**
  - For a creature with resistance to X, PF2e's bypass ignores it, and the roll is lowered by half of it less the creature's best all-damage or energy resistance, which PF2e still applies.
  - A creature immune to X takes the roll with X changed to untyped.
  - The card shows "(fire resistance 12 → 6)" and "(immune to fire)".
- **Interpretations:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-32.test.js` is new. Its negative cases are another resistance type (not read) and a changed map (not executable).

A whole-corpus compile (b497 → b498) changed only Flame Strike.

## Evidence

[Live evidence](phase-rank-5-batch-32-live-results.json), case `rank5Batch32`, in the `pftest` world, at 6th rank (10d6 fire = 31).

| Creature | Result |
| --- | --- |
| Fire resistance 12, failure | 25 lost (resistance 6) |
| Immune to fire, Reflex −10, rolled failure | Success (one better); 15 lost, untyped |
| Plain, failure | 31 lost |

**Cleanup:** fixtures removed.
