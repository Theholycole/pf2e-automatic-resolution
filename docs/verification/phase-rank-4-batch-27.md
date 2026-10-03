# Rank 4 batch 27 — Airlift, Animal Vision, Misty Memory, Wisdom of the Winds

2026-10-02. Part of the user's ranks 3–5 pass. (Animal Vision is rank 3; Wisdom of the Winds is rank 5.)

| Spell | Now |
| --- | --- |
| Airlift (4) | A spell note. It's instantaneous, so it's the note card (mark the result on the map); Heightened (6th) is shown at 6th. The unwilling participant's Reflex save is in the note; the GM runs it. |
| Animal Vision (3) | A note Effect on the animal for 1 hour. The animal's Will save to refuse is in the note. |
| Misty Memory (4) | A note on the caster for 10 minutes. Strong winds' counteract against the spell DC is in the note (how it can end). |
| Wisdom of the Winds (5) | A note on the caster for 8 hours (Guiding Gale's upper bound; Voice of the Sky is instant). The note has both options. |

## Rules

- **Unwilling saves (`spell-note.js` `bystanderSaveOnly`):** a save that only keeps the spell off an unwilling creature leaves the spell a note. Two sentences are read: "Any unwilling participant can attempt a Reflex save to avoid being carried along." and "If the target wishes to prevent you from doing so, it can attempt a Will save, negating the spell on a success, but most animals don't bother to do so."
- **Passive counteract:** "Strong winds from a magical source can disrupt this spell if the effect succeeds at a counteract check against your spell DC." is how the spell can end, not the caster's check.
- **"varies" with an upper bound (`compile-ability.js`):** a note whose text has one "The spell has a duration of N hours or until …, whichever comes first." lasts N hours, and the item duration is settled to that.
- **Notes keep their whole text:** spell-note text is no longer cut at 1,200 characters. Wisdom of the Winds had lost its second option. This changed only the note text of 42 other spells (b424 → b425); none changed status.

## Tests

1094 pass. `test/rank-4-batch-27.test.js` is new, with a negative case: an unwilling save with another result isn't a note.

Whole-corpus compiles: b423 → b424 changed these four. b424 → b425 (the text cap) changed only note text.

## Evidence

[Live evidence](phase-rank-4-batch-27-live-results.json), case `rank4Batch27`, in the `pftest` world.
- **Airlift at 6th:** the note card (no Effect), with the unwilling save and "120 feet".
- **Animal Vision:** the animal's note lasts 1 hour, with its Will save.
- **Misty Memory:** 10 minutes, with the strong-winds sentence.
- **Wisdom of the Winds:** 8 hours, with both options.
- **Cleanup:** fixtures removed.
