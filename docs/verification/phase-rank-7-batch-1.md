# Rank 7 batch 1 — Power Word Stun, Power Word Blind, Power Word Kill, Fatal Aria, Disappearance, Implosion, Suffocate

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Power Word Stun, Power Word Blind, Power Word Kill, Fatal Aria | New kind `level-tiers` (`level-tiers.js`): no save. The target's tier comes from its level, with the tiers shifted by the heightened step at the cast rank ("+1": 2 levels per rank; "10th": 2 at 10th). Possible outcomes: a condition (for rolled or stated time via an Effect, permanently, or at its value); death (0 HP and PF2e's Dead status); death at or below the stated HP, otherwise 0 HP and Dying (+1 if already Dying where the text says so); or damage that kills at 0 HP. Then the target's temporary-immunity Effect, which refuses a recast on it. |
| Disappearance | Condition-note grant: the target is Invisible for 10 minutes. Its reach to every precise sense is the note. |
| Implosion | Repeat-save: the card's button rolls the basic Fortitude save (75 damage, +10 per rank) for the cast's target and for each Sustain's new one. A creature this casting already hit is refused. The solid-form limit is a note. |
| Suffocate | The critical-failure row is reworded (`save-rewrites.js`) to double damage and Unconscious. The suffocation rule is the row's note on the failure and critical failure (both rows also apply damage). Target: living (PF2e traits), and the GM confirms it breathes. |

## Tests

`test/rank-7-batch-1.test.js` is new. A whole-corpus compile (b719 → b720) changed these seven spells. It also changed Vacuum, which is still unresolved: its row now carries the suffocation note.

## Evidence

[Live evidence](phase-rank-7-batch-1-live-results.json), case `rank7Batch1`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Power Word Stun on a level-17 creature | Stunned 1; immune; a second cast refused |
| Power Word Blind at 8th on a level-13 creature | Blinded permanently (the tier shifted by 2) |
| Power Word Kill on level 10 and level 15 (200 HP) | The first dies; the second drops to 0 HP, Dying 1 |
| Fatal Aria on a level-18 creature | 50 damage |
| Disappearance | Invisible |
| Implosion on two creatures, failures | 75 each; the first creature refused on a second press |
| Suffocate on a living creature and an undead | The undead is ineligible; a critical failure deals damage, Unconscious, and the suffocation note |

**Cleanup:** fixtures removed.
