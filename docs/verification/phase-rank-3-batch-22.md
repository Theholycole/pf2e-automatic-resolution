# Rank 3 batch 22 — notes and condition + note (eight spells)

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Clairvoyance (4), Clairaudience (3), Scouting Eye (5) | Spell notes. "You create an Invisible floating eye …" describes the thing created, not a condition on a creature. |
| Invisibility Cloak (4) | The caster is Invisible for the duration (10 minutes from 6th, 1 hour from 8th). The borrowed Invisibility restrictions are the note. |
| Drop Dead (5) | The target is Invisible for the duration, with the rest as the note. |
| Beastmaster Trance (3), Eyes of the Dead (3) | The caster is Off-Guard while sharing the creature's senses; the target is the caster's companion, or an undead it controls. |
| Time Skip (3) | Another creature (never the caster) is Quickened for 1 round; what it can use the action for is the note. |

## Rules

- **`spell-note.js` grants:**
  - "You become @C, with the same restrictions as the … @S spell." (spell links masked as @S);
  - "The target appears to …, though it actually turns @C.";
  - "This lack of awareness makes you @C." (the caster, any target);
  - "The target is @C on its next turn and can use the action only to …".
- **`spell-note.js` mentions:** "You create an @C(,) (floating) eye/sensor/ear …".
- **Targets:**
  - "one of your animal companions you can perceive" is the caster's pick;
  - "one undead creature under your control" requires undead;
  - "1 willing creature other than yourself" is not the caster (the condition-note runtime refuses the caster).

## Tests

1024 + 2 = 1026 pass. `test/rank-3-batch-22.test.js` is new, with a negative case (another wording of Drop Dead's grant stays off the route).

A whole-corpus compile (b375 → b376) changed only these eight.

## Evidence

[Live evidence](phase-rank-3-batch-22-live-results.json), case `rank3Batch22`, in the `pftest` world. It passed on the first run.
- **The three notes:** each put a note on the caster.
- **Invisibility Cloak at 6th:** the caster was Invisible for 10 minutes.
- **Drop Dead:** the target was Invisible.
- **Beastmaster Trance:** the caster was Off-Guard and the companion wasn't.
- **Time Skip:** the ally was Quickened; targeting the caster was refused.
- **Cleanup:** fixtures removed.
