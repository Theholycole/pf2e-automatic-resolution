# Rank 5 batch 6 — Unblinking Flame Aura, Mind of Menace

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Unblinking Flame Aura (5) | The caster heals 3 × the cast rank (15 at 5th; Dying handled). PF2e's Effect gives +2 status to Perception and cold resistance 10, +2 per rank (2 × rank). |
| Mind of Menace (3) | PF2e's Effect on the caster grants the Fight with Fear reaction; "once you use the reaction, the spell ends" is a note. The item's Will save is that reaction's, not the spell's. |

## Rules

- **Self-heal (`spell-note.js` `compileEffectNote`):** a self-heal "You recover @Damage[(N*@item.level)[healing]]{…}." is allowed beside the Effect (`selfHeal.perRank`). No other @Damage is allowed.
- **Proof (`effect-note-proof.js`):**
  - The heal sentence is claimed.
  - "For the duration, you gain a +N status bonus on Perception checks and resistance N to X." is the two rules, the resistance checked against the step.
  - "You recover an additional N Hit Points, and the resistance to X increases by N." is that step, with the heal part equal to the formula's per-rank × interval.
  - Multi-rule readers can now be scaled (they get the step).
- **Runtime:** the effect-note runtime heals the caster with PF2e's damage application (negative) and recovers from Dying.
- **A save that belongs to the reaction:** an item save is ignored when PF2e's Effect grants an action and the spell's text names no save and has no degree table.

## Tests

1032 + 2 = 1034 pass. `test/rank-5-batch-6.test.js` is new, with negative cases:
- a heal step unlike the formula;
- a resistance step unlike the Effect;
- a save in the text.

A whole-corpus compile (b379 → b380) changed only these two.

## Evidence

[Live evidence](phase-rank-5-batch-6-live-results.json), case `rank5Batch6`, in the `pftest` world. It passed on the first run.
- **Unblinking Flame Aura at 6th:** healed 18, Perception +2, cold resistance 12.
- **Mind of Menace:** the caster held the Effect and Fight with Fear.
- **Cleanup:** fixtures removed.
