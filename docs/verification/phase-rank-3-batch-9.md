# Rank 3 batch 9 — Drain Life

2026-10-02.

| Spell | Now |
| --- | --- |
| Drain Life (3, focus) | One living creature (an undead target is ineligible) rolls a basic Fortitude save against 3d4 void damage. The caster gains temporary Hit Points equal to the damage the target takes (PF2e's confirmed damage receipt), but no more than the Hit Points the target had. They last for 1 minute. **Heightened (+1):** +1d4 (PF2e's data). |

## Rules

**Damage benefits (`damage-benefit-compiler.js`):**
- A new measure, `hp-capped`. "You gain temporary Hit Points equal to the damage the target takes, after resolving its save and applying a blood magic effect if applicable." requires the companion sentence "If the target's Hit Points were lower than the damage you dealt, you gain temporary Hit Points equal to their remaining Hit Points instead."
- `basic-save-core.js` accepts it for one target, the whole amount, with a stated duration.
- The runtime takes min(confirmed damage, the target's Hit Points before the damage).

**Basic-save gate (`semantic-gate.js`):**
- "This deals 3d4 void damage; the target must attempt a basic Fortitude save." is read as the plain damage sentence when it states the item's one damage entry.
- The forced-movement "pull" signal no longer fires on "pull (life) energy", since pulling energy moves no creature.

The whole-corpus compile showed no other plan changed by either.

## Tests

974/974 pass. `test/rank-3-batch-9.test.js` is new. It checks:
- the benefit;
- that without the cap sentence, or with a changed amount or duration, it isn't read.

A whole-corpus compile (b346 → b347) changed only Drain Life.

## Coverage

**Census:** **1166 enabled** (milestone; 1162 non-ritual), up from 1165. Rank 3: 118 of 261.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-9-live-results.json), case `rank3Batch9`, in the `pftest` world.
- **Failure on a 500-HP target:** "3d4 void", 8 lost. The caster gained 8 temporary HP in an Effect lasting 1 minute.
- **Critical failure on a target with 3 HP:** 3d4 rolled 10, doubled to 20. The target went to 0 and the caster gained 3.
- **An undead target:** ineligible.
- **Cleanup:** fixtures removed.
