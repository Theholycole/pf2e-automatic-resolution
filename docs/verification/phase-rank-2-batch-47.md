# Rank 2 batch 47 — Knock

2026-10-01. Follows the user's decision of 2026-10-01: an Effect + note spell counts once the module covers what PF2e's Effect doesn't.

| Spell | Now |
| --- | --- |
| Knock (2) | PF2e's Effect (+4 status to Force Open and Pick a Lock, with Athletics or Thievery) goes on whoever will try to open the target: the caster, or the creatures the caster targets, asked when cast. The card's buttons: the caster's Thievery check to open, as part of casting, against the DC the GM gives, with the caster's level added while untrained (once per cast); and the counteract against Lock, rolled against the DC and rank the GM gives. |

## Rules

- **`spell-note.js`:** an Effect + note's text may contain "X counteracts <spell>." (that sentence is the proof's).
- **`effect-note-proof.js`:**
  - Readers for the bonus, with the recipient asked, and for the cast's check (`castCheck`) and the counteract.
  - A proof that names the recipient also answers the recipient question.
- **Runtime:**
  - The Effect + note card shows the check and counteract buttons (`noteCheck`, and the existing `noteCounteract`).
  - `noteCheck` rolls PF2e's skill with the action's roll option, adding the level as a modifier when untrained, and marks the card used.

## Tests

891/891 pass. `test/rank-2-batch-47.test.js` is new. It checks the proof, and that a changed bonus isn't proved.

A whole-corpus compile (b301 → b302) changed only Knock.

## Coverage

**Census:** **1122 enabled**, up from 1121. Rank 2: 208 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-47-live-results.json), case `rank2Batch47`, in the `pftest` world (a character caster).
- The caster got the Effect.
- The check (DC 15) added the level (untrained) and totalled 15, a success; a second check was refused.
- The counteract against Lock (DC 10, rank 1) succeeded.
- The card shows both buttons.
