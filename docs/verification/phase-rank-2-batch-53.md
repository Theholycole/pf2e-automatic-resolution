# Rank 2 batch 53 — Helpful Reload

2026-10-01. Follows the user's decision of 2026-10-01: an Effect + note spell counts once the module covers what PF2e's Effect doesn't.

| Spell | Now |
| --- | --- |
| Helpful Reload (2) | Below 4th, the reload is the note on the triggering ally; PF2e's Effect isn't applied (its +1 is the 4th rank's). From 4th, PF2e's Effect goes on the ally: +1 status to its next Strike with the weapon. The weapon is chosen among its ranged weapons with a reload of 1 or less: preset when there's one, asked among several, refused with none. The 6th rank's ammunition choice and the 8th's summoned ammunition are the note. |

## Rules

- **`effect-note-proof.js`:**
  - A fixed-rank entry can be where PF2e's Effect starts: it claims the weapon choice and the once-only modifier, and sets `effectFromRank`.
  - Later entries that keep the same bonus are accepted.
  - A reaction's Requirements paragraph sits with its Trigger.
- **Runtime:**
  - The Effect + note executor skips PF2e's Effect below `effectFromRank`.
  - It presets an owned-weapon ChoiceSet from the recipient's weapons that fit its predicate.

## Tests

897/897 pass. `test/rank-2-batch-53.test.js` is new. It checks the plan, and that a changed bonus isn't proved.

A whole-corpus compile (b307 → b308) changed only Helpful Reload.

## Coverage

**Census:** **1130 enabled**, up from 1129. Rank 2: 216 of 245.

## Evidence

[Live evidence](phase-rank-2-batch-53-live-results.json), case `rank2Batch53`, in the `pftest` world (a character ally with a hand crossbow).
- **At 2nd:** a note, no Effect.
- **At 4th:** "Spell Effect: Helpful Reload (Hand Crossbow)" and the note.
- The first two runs looked for the Effect's exact name, but PF2e appends the weapon to it; the case now matches the start of the name.
