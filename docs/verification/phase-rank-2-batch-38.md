# Rank 2 batch 38 — image decoys, and a proved Effect + note

2026-10-01. Follows the user's decision of 2026-10-01: an Effect + note spell counts once the module covers what PF2e's Effect doesn't.

| Spell | Now |
| --- | --- |
| Mirror Image (2) | PF2e's Spell Effect: Mirror Image goes on the caster with its image count ("(3 images)"), tracked in Ongoing spells. Its controls are for an attack that would hit, would critically hit, or missed without critically failing. A hit or critical hit rolls the stated die for the images left: 1 on 1d4 with three, 1–2 on 1d6 with two, 1–3 on 1d6 with one. A low roll means the attack hits the caster (a critical hit stays one). Otherwise an image is destroyed and the attack misses; for a critical hit it becomes a hit on the caster. A miss destroys an image. The last image ends the spell. |
| See the Unseen (2) | Each rule sentence is proved against PF2e's Effect: seeing invisible creatures as Concealed is the see-invisibility Sense, and the +2 status bonus to disbelieve is the FlatModifier on Perception and Will against illusions. The incorporeal-sight sentence is the note. At 5th the Effect and the note last 8 hours, read from "Heightened (5th) This spell has a duration of 8 hours." |

## Rules

- **`image-decoys.js` (new note family):**
  - The image sentences, the odds for each count (the stated range must equal the stated odds), and the miss, critical and end rules.
  - PF2e's linked Effect with no rules.
- **`effect-note-proof.js` (new):** readers pair each rule sentence with exactly one rule of the Effect; every rule must be claimed. The known notes and the opening narration are allowed. A proved plan is automatic and counts as enabled; `report-enabled-spells.mjs` now routes it as an effect.
- **`spell-note.js`:** a Spell Effect link after a Heightened entry isn't part of the entry. It changed only the note text of 16 other Effect + note spells.
- **`heightened-duration-compiler.js`:** reads "This spell has a duration of N <unit>".
- **Runtime:**
  - `image-decoys` executor; the `decoy` request and its three Ongoing controls.
  - The Effect + note executor gives PF2e's Effect the heightened duration when it differs from the template's.

## Tests

882/882 pass. `test/rank-2-batch-38.test.js` is new. It checks:
- the image odds, and that changed odds aren't read;
- the proof, and that a changed bonus keeps the plan guided.

A whole-corpus compile (b291 → b292) changed Mirror Image and See the Unseen. It also changed the note text of 16 Effect + note spells (the link label is gone); their levels are unchanged.

## Coverage

**Census:** **1108 enabled**, up from 1106. Rank 2: 194 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-38-live-results.json), case `rank2Batch38`, in the `pftest` world.
- **Mirror Image:**
  - The Effect started at "(3 images)". A miss left "(2 images)".
  - A critical hit rolled 4 on 1d6: it hit an image (destroyed) and became a hit on the caster, leaving "(1 image)".
  - A miss destroyed the last image. The spell ended and the Effect is gone.
- **See the Unseen:** automatic; the Effect has Sense + FlatModifier.
  - At 2nd: Effect and note 10 minutes.
  - At 5th: Effect and note 8 hours.
