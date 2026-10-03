# Rank 4 batch 91 — Call the Ten

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Call the Ten (4) | Up to 10 targets (the caster may be one). For each target, the caster answers on the card whether it's shielded. Shielded: no save; it gets PF2e's Spell Effect, resistance 3 to physical and spirit (+2 every 2 ranks) until the start of the caster's next turn. Attacked: it takes PF2e's 4d6 spirit (+1d6 every 2 ranks) with a basic Fortitude save. |

## Rules

- **Spirit choice (`src/compiler/spirit-choice.js`):**
  - It reads the narration, the either/or sentence, the designation, the Effect link and the heightening.
  - It rewrites the lead into the basic save and keeps the link.
  - It returns the bolster that a post-hook builds from the resolved link.
- **The bolster's resistance proof (new):** `proveBolsterEffect` also accepts a single Resistance rule of the stated types, whose value is the text's base plus its step (`3 + 2*floor((@item.level - 4) / 2)`), lasting 1 round to the turn's start. A basic save may use it with this spell's sentence.
- **Interpretation:** the caster's designation is the card's per-target yes/no (shown as the GM's). The caster is a valid target ("including yourself"). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-91.test.js` is new. It covers the bolster claim, the targets, another resistance step (not proven), and another designation (not read).

A whole-corpus compile (b582 → b583) changed only Call the Ten.

## Evidence

[Live evidence](phase-rank-4-batch-91-live-results.json), case `rank4Batch91`, in the `pftest` world, at 6th rank (caster level 11).

| Target | Result |
| --- | --- |
| Shielded (yes) | no damage; Spell Effect: Call the Ten; resistance 5 to physical and to spirit |
| Attacked (no), failure | 5d6 spirit = 23, lost 23 |

**Cleanup:** fixtures removed.
