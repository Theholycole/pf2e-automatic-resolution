# Rank 3 batch 16 — Return the Favor, Capital Dividend, Know the Enemy

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Return the Favor (3, reaction) | PF2e's Effect on the triggering ally: 12 temporary HP for 1 minute, +4 per rank (PF2e's formula, checked against the text's step). |
| Capital Dividend (4, reaction) | PF2e's Effect: +8 healing received from healing effects for 1 minute, +2 per rank. Staying at 1 HP is the GM's note, since the module can't intercept the drop to 0. |
| Know the Enemy (4, reaction) | PF2e's Effect: Recall Knowledge rolled twice, keeping the higher. Using Recall Knowledge is the note. |

## Rules

**`effect-note-proof.js`:**
- readers for the three rule sentences;
- step patterns "The temporary Hit Points increase by N." / "The additional healing increases by N Hit Points." (`STEP_MORE`, the same step check);
- note patterns;
- narration with no rule words is now accepted in the first three sentences, not only the first. The corpus showed no other plan changed.

## Tests

995 + 1 pass. `test/rank-3-batch-16.test.js` is new. It checks:
- the three proofs;
- that a changed step isn't proved.

A whole-corpus compile (b362 → b363) changed only these three.

## Coverage

**Census:** **1191 enabled** (milestone; 1187 non-ritual), up from 1188.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-16-live-results.json), case `rank3Batch16`, in the `pftest` world.
- **Return the Favor:** 12 temporary HP at rank 3; 16 at rank 4 (caster level 7).
- **Capital Dividend:** the FlatModifier, plus the 1-HP note.
- **Know the Enemy:** RollTwice.
- **Cleanup:** fixtures removed.
