# Rank 2 batch 70 — Radiant Field

2026-10-01. It needed no new user decision. PF2e's Light Blindness ability is detected on the creature; the darkness the field suppresses is a GM note.

| Spell | Now |
| --- | --- |
| Radiant Field (2) | The GM places the 20-foot burst. A light (bright to its radius) is placed at its centre for the minute. A creature with PF2e's Light Blindness ability inside is blinded by it: once, until the end of its next turn, per its ability. At the start of each of its turns while it's blinded by the field and inside (from 4th, anywhere), a card rolls its Fortitude save against the spell DC. Incapacitation is applied: one degree better for a creature above twice the rank. A failure keeps it blinded for 1 round. From 4th the creatures inside are Concealed (the observers outside are the GM's). The end of the spell removes the light, the area and the blindness. |

## Rules

- **`radiant-field.js` (new pre-pass, kind `radiant-field`):** the four sentences and the 4th-rank entry exactly. The ability and condition links are read from the text.
- **`ongoing-families.js`:**
  - `startRadiantField` — the placed record, the AmbientLight, and concealment from the rank.
  - `syncRadiant` — the first exposure.
  - `radiantBlind`.
  - `radiantTurnStart` — the card, once per creature per round, on the turn's start.
  - `radiantSave` (with incapacitation).
- **`main.js`:** the card's button.

## Tests

934/934 pass. `test/rank-2-batch-70.test.js` is new. It checks:
- the plan;
- that a changed duration, trait or heightened condition isn't read.

A whole-corpus compile (b325 → b326) changed only Radiant Field.

## Coverage

**Census:** **1147 enabled**, up from 1146. Rank 2: 233 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-70-live-results.json), case `rank2Batch70`, in the `pftest` world.
- **At 2nd:**
  - The light was placed.
  - The creature with Light Blindness was blinded; the other wasn't, and wasn't Concealed.
- **Its turn in combat:** the card was posted. Its save critically failed, and it stays blinded for 1 round (expiring at turn start).
- **Ending the spell:** the light and the blindness went.
- **At 4th:** the creature inside was Concealed.
- **Cleanup:** fixtures removed.
