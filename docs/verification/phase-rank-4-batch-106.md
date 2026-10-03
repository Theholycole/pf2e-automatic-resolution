# Rank 4 batch 106 — Cinder Swarm

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Cinder Swarm (4) | The caster picks the insects. Each is a save plan of the text's damage (the item has none): the rank formula, +2d6 per rank. They are exposed on the target and the creatures within 5 feet of it when cast and on the first Sustain each round; the GM leaves out allies at review. **Fire ants:** 3d6 piercing and 2d6 persistent fire, the basic Reflex save written as its rows; the failing rows push 5 feet in the caster's direction. **Fireflies** (incapacitation): 3d6 fire with Fortitude rows — half and Dazzled 1 round; full and Blinded 1 round; double and Blinded 1 minute. The 24-hour immunity to being blinded is a reminder. |

## Rules

- **`src/compiler/lingering-modes.js`:** `extractAuraModes` reads the five lead sentences, both list items, the fireflies' rows and the heightening. It returns each kind's text, damage entries and heightening.
- **`compileSpell`:**
  - It compiles each kind on a copy and turns the item damage into the text's formula (the item has no damage of its own).
  - The ants' push gets direction "any".
  - The lingering declaration is the target's 5-foot aura including the target, exposed on Sustain with an initial exposure.
- **Validation (`basic-save-core`):**
  - A target aura including its targets with Sustain exposures is allowed, from the compiler's sentences.
  - The formula damage is accepted when it is the compiler's own (`auraFormula`).
  - Reminders proved by the `auraModes` evidence are accepted.

## Interpretation

- **"Enemies in the aura" is the GM's review.** Allies are left out at review.
- **The ants' basic save keeps its persistent fire.** It is written as rows, the failing ones pushing; the direction is the caster's.
- **"Immune to being blinded for 24 hours" is a reminder.**

## Tests

`test/rank-4-batch-106.test.js` is new. It covers both kinds' aura, events, support, formula, push and rows, and a changed move (not read).

A whole-corpus compile (b645 → b646) changed only Cinder Swarm.

## Evidence

[Live evidence](phase-rank-4-batch-106-live-results.json), case `rank4Batch106`, in the `pftest` world, cast at 4th rank.

| Step | Result |
| --- | --- |
| The start | The target and the creature beside it exposed (not the far one) |
| Their failures | "3d6 piercing + 2d6 persistent fire"; push 5; persistent "2d6 fire" on the target |
| The Sustain | Both exposed again |

**Cleanup:** fixtures and combat removed.
