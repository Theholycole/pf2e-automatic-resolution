# Rank 5 batch 90 — Ember Doppelgänger

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Ember Doppelgänger (5) | **The duplicate** is a token with AC 10 and 50 HP (+10 per rank). It's immune to critical hits, precision, immobilized, prone and restrained, and has weakness 10 to cold and water. PF2e's degree rule makes its saves and skill checks failures. Its 0 HP ends the spell; the caster's sustained Effect removes it. **The card's blast** (the cast and each turn's first Sustain) posts the targeted creatures' basic Reflex card: 6d6 fire (+1d6 per rank) against the spell DC. Its Stride and flanking are GM lines. |

## Rules

- **`src/compiler/ember-double.js`:** reads every sentence and the Heightened entry; PF2e's damage entry is the blast's.
- **`compile-ability`:** the blast is a compiled basic save with the text's formula at the cast rank (the `phaseFormula` evidence).
- **Runtime:** new kind `ember-double`; `emberBlast` (API and card button).

## Interpretation

- **"Automatically fails all skill checks and saving throws"** is an AdjustDegreeOfSuccess rule to failure. "Skill checks against it automatically succeed" is a GM line.

## Tests

`test/rank-5-batch-90.test.js` is new. It covers the data, the blast's formula and plan (supported) and an unrecognised clause (not read).

A whole-corpus compile (b698 → b699) changed only Ember Doppelgänger.

## Evidence

[Live evidence](phase-rank-5-batch-90-live-results.json), case `rank5Batch90`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 5th | The duplicate: AC 10, 50 HP, weakness 10 cold, immune to prone; its Reflex against DC 1 a failure |
| Its blast; a foe fails | 19 fire |
| The duplicate at 0 HP | Its token and the caster's Effect gone |
| At 7th | 70 HP; the blast 20 (8d6) |

**Cleanup:** fixtures removed.
