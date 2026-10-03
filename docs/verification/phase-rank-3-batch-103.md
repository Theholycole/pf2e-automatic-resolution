# Rank 3 batch 103 — Ki Cutting Sight

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ki Cutting Sight (3) | The cast rolls the caster's Perception against the targeted creature's Fortitude DC. On a success, PF2e's Effect goes on the caster, with its toggle replaced by a mark on that creature: the 4d10 slashing (+1d10 per rank, PF2e's "@item.level + 1") applies only against it, on a Strike or a monk focus spell. The first damage roll against it that adds the dice uses the Effect up. A failure applies nothing. |

## Rules

- **Check mark (`src/compiler/check-mark.js`, compiled in `compileSpell`):**
  - **The text:** the check, the success sentence, the Effect link and the heightening.
  - **PF2e's Effect:** a damage toggle plus DamageDice of the text's type and die, with `@item.level + (dice − rank)`.
- **Runtime:** the new kind `check-mark`.
  - The check is PF2e's Perception or skill roll at the target's save DC.
  - The Effect's toggle becomes a TokenMark on the target, and the predicate uses `target:mark:<slug>`.
  - `consumeOn` is a damage roll with that mark.

## Interpretation

- **"A Strike" also matches `self:action:slug:strike`.** PF2e's Strike damage rolls carry that option, not the Effect's `action:strike`, so PF2e's own predicate never matched (checked live).
- **The mark replaces PF2e's toggle.** The text names "the target".

## Tests

`test/rank-3-batch-103.test.js` is new. It covers the data, and dice differing from PF2e's (not read).

A whole-corpus compile (b627 → b628) changed only Ki Cutting Sight.

## Evidence

[Live evidence](phase-rank-3-batch-103-live-results.json), case `rank3Batch103`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Perception vs the foe's low Fortitude | Critical success; the Effect holds the TokenMark (the foe) and the DamageDice |
| A Strike's damage at the foe | 1d4 bludgeoning + 4d10 slashing; the Effect is used up |
| Against a high Fortitude | Failed; no Effect |

**Cleanup:** fixtures removed.
