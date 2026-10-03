# Rank 3 batch 105 — Consecrate Flesh

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Consecrate Flesh (3) | PF2e's Effect, checked against the text: weakness 5 to unholy (+5 per 3 ranks) and unarmed +1 spirit (+1 per 3 ranks). It is the retaliation's marker, plus the text's healing dice on the caster's spell healing: PF2e's `spell-healing` selector, `max(1, floor(rank/3))` d4. Ongoing's Retaliate deals the item's 1d6 spirit (+1d6 per 3 ranks) to a creature that touches the caster or damages it with an unarmed attack or non-reach melee weapon. "Only when initially cast" is a note. |

## Rules

- **Retaliation (`src/compiler/retaliation.js`):** a new `compileConsecratedBody` reader handles:
  - the four sentences, the heightening's four clauses and PF2e's interval;
  - PF2e's Effect: the Weakness and FlatModifier formulas exactly.

  It returns the marker Effect with `ruleAdditions` (the healing DamageDice) and a note. In `compileSpell`, its scope and target ("self") are complete.
- **Runtime (`#executeRetaliation`):** the marker's source takes the rule additions and the notes.

## Interpretation

- **"Initially cast" is a note.** The extra dice apply to the caster's spell healing rolls, and the table keeps it to a spell's first healing.
- **Touching is a GM report.** It's the existing Retaliate control.

## Tests

`test/rank-3-batch-105.test.js` is new. It covers the trigger, the rule addition and support, and a weakness PF2e's Effect doesn't give (not supported).

A whole-corpus compile (b629 → b630) changed only Consecrate Flesh.

## Evidence

[Live evidence](phase-rank-3-batch-105-live-results.json), case `rank3Batch105`, in the `pftest` world.

| Rank | Weakness | Soothe | Retaliate |
| --- | --- | --- | --- |
| 3rd | unholy 5 | "1d10 + 1d4 + 4" | 1d6 spirit, applied |
| 6th | unholy 10 | "1d10 + 2d4 + 4" | 2d6 spirit, applied |

The Effect carries the note.

**Cleanup:** fixtures removed.
