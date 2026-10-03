# Rank 2 batch 75 — Web

2026-10-01. Follows the user's decision of 2026-10-01: a trigger Foundry can detect (a token entering, or moving in, a region) is automated, and the rest is the GM's.

| Spell | Now |
| --- | --- |
| Web (2) | The GM places the burst: 10 feet, or 20 from 4th. Its region is difficult terrain. A creature that enters it, or moves while in it, gets a card: its buttons roll its Athletics check or its Reflex save against the spell DC, its choice. The creatures inside when it's cast are only asked once they move. The outcome is applied: a failure is −10 feet circumstance to all Speeds until the start of its next turn; a critical failure is Immobilized until then, with the penalty through the round after. The penalty is lost on leaving the web. A critical success frees the creature from further checks this turn. Clearing squares, and the web's AC and saves, are GM notes. Edit the region to clear squares. |

## Rules

- **`web-area.js` (new pre-pass, kind `web-area`):** the five sentences, the four rows and the 4th-rank entry exactly. `webRadius` gives the burst by rank.
- **`ongoing-families.js`:**
  - `startWeb` — the placed record and its difficult terrain (walk and travel), and the positions seen at the cast.
  - `syncWeb` — run on every reconcile. It compares positions, so a creature entering or moving inside gets one card while its check is pending; none while it's freed this turn.
  - `webCheck` (the `web-check` request) — the chosen roll, and the penalty (`all-speeds`, leave-area), Immobilized, or freedom.
- **`main.js`:** the card's two buttons.
- **`test/terrain-batch-2.test.js`:** its check that an unread "difficult terrain" sentence blocks a spell now uses a changed Web, since Web itself is read whole.

## Tests

944/944 pass. `test/rank-2-batch-75.test.js` is new. It checks:
- the plan and the radius by rank;
- that a changed penalty, check or condition isn't read.

A whole-corpus compile (b330 → b331) changed only Web.

## Coverage

**Census:** **1152 enabled**, up from 1151. Rank 2: 238 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-75-live-results.json), case `rank2Batch75`, in the `pftest` world.
- **The cast:** no card for the creature inside. Moving into the web cost 15 feet for two squares.
- **The creature entering:** its card came, and its Reflex save critically failed. It is Immobilized, and its Speed went from 25 to 15.
- **The creature inside moving:** its card came and it critically succeeded. Moving again that turn brought no card.
- **Leaving the web:** the penalty went; Immobilized stayed.
- **Ending the spell:** removed the region and the Immobilized.
- **Cleanup:** fixtures removed.
