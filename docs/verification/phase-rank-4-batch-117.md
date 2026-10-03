# Rank 4 batch 117 — Variable Gravity

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Variable Gravity (4) | The caster picks low, normal or high gravity on the card and gets an Effect: 5 minutes, or 1 hour from 6th rank. The card's *Change the gravity* control (a single action) swaps the option, replacing the Effect's rules and notes. **High gravity:** Encumbered, and +2 status to saves against forced movement and being knocked Prone. The same +2 applies to the Fortitude DC that Shove and Reposition target and the Reflex DC that Trip targets. The halved forced movement, jumping and falling are notes. **Low gravity:** the jumping and falling rules as notes. **Normal gravity:** nothing. |

## Rules

- **`src/compiler/rule-sets.js` `gravity`:** reads the four opening sentences, the two listed gravities and the Heightened duration.
  - High gravity's two rules sentences must match exactly.
  - Every other listed sentence must be one of the known notes.
- **`ruleSetRules`:** a chosen option's own rules, with or without a scale.
- **Runtime (rule-set):**
  - `secondsByRank` gives the longer duration.
  - A switchable choice names the Effect after the option and adds the card's control.
  - `ruleSetSwitch` asks for another option and updates the Effect.

## Interpretation

- **"DCs to resist forced movement and attempts to knock you Prone"** are the Fortitude DC (Shove, Reposition) and the Reflex DC (Trip). These are PF2e's actions that target them.
- **PF2e's High Gravity Effect isn't used.** The module's Effect carries the same rules plus the DCs.

## Tests

`test/rank-4-batch-117.test.js` is new. It covers the options and their rule counts, the 6th-rank duration, high gravity's modifiers, the low notes, and a different bonus (not read).

A whole-corpus compile (b656 → b657) changed only Variable Gravity.

## Evidence

[Live evidence](phase-rank-4-batch-117-live-results.json), case `rank4Batch117`, in the `pftest` world.

| Step | Result |
| --- | --- |
| High gravity at 4th | Encumbered; save, Fortitude DC and Reflex DC modifiers; 5 minutes |
| Switched to low | No rules, not Encumbered, the notes |
| At 6th | 1 hour |

**Cleanup:** fixtures removed.
