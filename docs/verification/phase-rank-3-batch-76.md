# Rank 3 batch 76 — Swamp of Sloth

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Swamp of Sloth (3) | A lingering burst of difficult terrain. A creature that ends its turn inside saves (basic Fortitude) against PF2e's poison damage (1d6, +1d6 every 2 ranks). The radius is 5 feet, plus 5 for each action past the first (asked when the area starts) and 5 for each heightening step. |

## Rules

- **Sloth swamp (`src/compiler/sloth-swamp.js`):**
  - It reads the terrain, the damage sentence, the action growth and the heightening.
  - It rewrites the text into the lingering turn-end save. The sludge beasts are narration.
  - It gives the spell a 5-foot burst. PF2e's item has no area, and the text names no initial radius.
- **Actions widen the burst (new, `lingering.actionStep`):** `startLingering` asks how many actions were spent (or takes `options.actions`). Each action past the first adds the step. The validator requires the compiled sentence.
- **Interpretation:** the initial radius is 5 feet, the smallest burst, matching the published stat block ("5-foot burst or more"). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-76.test.js` is new. It covers the plan, a step without the sentence (refused), and another growth (not read).

A whole-corpus compile (b569 → b570) changed only Swamp of Sloth.

## Evidence

[Live evidence](phase-rank-3-batch-76-live-results.json), case `rank3Batch76`, in the `pftest` world, at 5th rank (caster level 9) with 3 actions, in combat.

| Step | Result |
| --- | --- |
| Area | 20-foot burst (5 + 5 heightened + 10 for the actions), difficult terrain on the region |
| Walker's turn starts inside | no obligation |
| Walker's turn ends inside | exposed; failure: 2d6 poison = 5, lost 5 |

**Cleanup:** fixtures, combat and region removed.
