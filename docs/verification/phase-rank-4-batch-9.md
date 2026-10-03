# Rank 4 batch 9 — Fire Shield

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Fire Shield (4) | PF2e's Effect on the caster, every rule proved against the text: cold resistance 5 (+5 per 2 ranks); the shield's +1 AC, Hardness 10 and no Broken Threshold; HP 40 (+10 per 2 ranks); and Hardness halved against water (PF2e's toggle). The Shield Block damage to the attacker is a clickable roll in the caster's note at the cast rank (2d6 fire, +1d6 per 2 ranks), because the module can't see the Shield Block. Environmental cold immunity and the shield's fire immunity are notes. |

## Rules

- **`effect-note-proof.js`:**
  - Readers for the shield's sentences.
  - The three-part heightened entry "The X resistance increases by N, the HP increase by N, and the Y damage increases by NdM." is two steps plus the damage step for the note.
  - `ruleValueAt` reads `eq(...)`.
  - A multi-rule reader that fails now logs under PROOF_DEBUG.
- **`spell-note.js` `compileEffectNote`:** one item damage entry that is exactly the Shield Block damage the note carries is allowed. `EFFECT_NOTE_DEBUG=1` prints the refusal line.
- **`effect-runtime.js`:** proof notes with a roll link are appended to the caster's note Effect. The note's level is the cast rank, so `@item.level` resolves.

## Tests

1036 + 1 = 1037 pass. `test/rank-4-batch-9.test.js` is new, with negative cases: wrong resistance, Hardness, HP, and HP step.

A whole-corpus compile (b381 → b382) changed only Fire Shield.

## Evidence

[Live evidence](phase-rank-4-batch-9-live-results.json), case `rank4Batch9`, in the `pftest` world. Cast at 6th:
- cold resistance 10;
- shield +1 AC, Hardness 10, 50 HP;
- the note's roll evaluated to 3d6 fire.

PF2e's Effect writes the heightened HP to `shield.max` and `shield.value` (its `shield.hp` keeps 40); the first run read `hp.max`, and the case now reads `max`.

**Cleanup:** fixtures removed.
