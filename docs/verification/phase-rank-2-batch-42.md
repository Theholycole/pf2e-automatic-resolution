# Rank 2 batch 42 — a foe's weaknesses revealed, an added toggle

2026-10-01. Follows the user's decisions of 2026-10-01:
- An Effect + note spell counts once the module covers what PF2e's Effect doesn't.
- Information is whispered to the GM and the caster.

| Spell | Now |
| --- | --- |
| Vision of Weakness (2) | The caster targets the one creature. PF2e's Effect goes on the caster: its mark on that foe and the two once-only +2 status modifiers (next attack roll, or a skill check that is part of an attack action) until the end of the turn. The module whispers the foe's weaknesses and lowest save (all of them on a tie) to the GM and the caster's owners. The foe is then temporarily immune for 1 day; a second cast at it is refused. |
| Spirit Sense (2) | PF2e's Effect on the caster: +1 status to Perception, AC, skill checks and saves, regarding haunts or spirits. For the checks, its modifier waits on a "spirit-sense" roll option that nothing sets, so the module adds that toggle (the text over the data); AC and saves follow the creature's traits. At 6th it lasts until the next daily preparations (1 day). The extra check to find haunts is the note. |

## Rules

- **`effect-note-proof.js`:**
  - A reader may claim several rules (the mark and its two modifiers) or none.
  - A reader may restate a rule another sentence claimed (AC and saves).
  - A reader may add a rule (the toggle).
  - A reader may state a reveal, a temporary immunity, or a subject: the caster's Effect is about one targeted creature.
- **Runtime:**
  - `prepareNativeEffectSource` appends proved `ruleAdditions`.
  - The Effect + note executor, for a subject: one target, refused while it's temporarily immune. It sets the user's target (for PF2e's mark), then reveals and records the immunity.
  - `reveal-runtime.js` has the `weaknesses-and-lowest-save` kind.

## Tests

886/886 pass. `test/rank-2-batch-42.test.js` is new. It checks both proofs, and that a changed bonus isn't proved.

A whole-corpus compile (b295 → b296) changed only these two spells.

## Coverage

**Census:** **1117 enabled**, up from 1115. Rank 2: 203 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-42-live-results.json), case `rank2Batch42`, in the `pftest` world.
- **Vision of Weakness:**
  - The caster got the Effect.
  - The whisper read "weaknesses fire 5, cold 3; lowest save fortitude and reflex and will" (the fixture's saves are equal).
  - The foe became temporarily immune, and a second cast was refused.
- **Spirit Sense:**
  - At 2nd: FlatModifier + RollOption (spirit-sense), 10 minutes.
  - At 6th: 1 day.
