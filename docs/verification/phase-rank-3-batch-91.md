# Rank 3 batch 91 — Tracking Mayflies

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Tracking Mayflies (3) | A spell Strike. The card gives a button per ranged weapon, plus a second button for a magical target. Each rolls PF2e's own Strike. The second button is for when the GM says the target is under a spell or wields or wears a magic item: the target is Off-Guard for that Strike only (an Effect removed after the roll). A successful Strike Dazzles the target for 1 round (PF2e's condition on an Effect). The doubled range increment and the invisible/concealed rules are notes on the card. |

## Rules

- **The spell-Strike family (`src/compiler/spell-strike.js`):** a new `mayflies` form. Its Strike sentence is followed by the five stated sentences. Its data carries the Off-Guard question and the hit condition.
- **Runtime:**
  - **The card:** for a form with that question, a "(target magical: Off-Guard)" button sits beside each plain Strike button. The card's flags carry the hit condition and the question.
  - **`spellStrikeRoll`:**
    - It grants Off-Guard to the targeted creature for that roll, when asked.
    - It reads PF2e's result, and on a success or critical success grants the hit condition for its rounds.
    - It's exposed on the module API for scripted runs.

## Tests

`test/rank-3-batch-91.test.js` is new. It covers the form's data, its question and its notes, and another hit duration (not read).

A whole-corpus compile (b612 → b613) changed only Tracking Mayflies.

## Evidence

[Live evidence](phase-rank-3-batch-91-live-results.json), case `rank3Batch91`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The card | The Strike button and its Off-Guard button |
| A plain Strike at a soft target | DC 5; a hit; Dazzled; no Off-Guard left behind |
| The "magical" Strike at it | DC 3 (Off-Guard −2); no Off-Guard left behind |
| A Strike at a hard target | A miss; not Dazzled |

**Cleanup:** fixtures removed.
