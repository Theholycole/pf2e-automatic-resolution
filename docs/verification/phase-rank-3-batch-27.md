# Rank 3 batch 27 — Echo Jump, Blazing Dive, Fungal Exhalation, Powerful Inhalation

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Echo Jump (3) | A basic Reflex save for the creatures in the 10-foot emanation (4d8 force, +3d8 per 2 ranks). The teleport is the caster's reminder, with its range at the cast rank (30 feet, +10 per 2 ranks), and the emanation is centred on the space the caster left. |
| Blazing Dive (3) | One basic Reflex save for 3d4 bludgeoning and 3d6 fire (+1d4 and +1d6 a rank). The dive (15 feet up, then a straight line to a space within 60 feet) is the caster's reminder; the emanation is around where the caster lands. |
| Fungal Exhalation (3) | Basic Reflex save for 6d4 poison: **Failure** Sickened 1, **Critical failure** Sickened 2. A GM question asks whether each creature breathes ("immune to this effect", which here is the whole spell). |
| Powerful Inhalation (3) | Basic Fortitude save for 5d6 bludgeoning. Creatures with the air trait get a result one degree worse (read from PF2e's traits). **Failure:** a 1-round note (raspy whisper). **Critical failure:** that note plus a 1-round note (can't speak or use breath abilities, with the text's explanation). |

## Rules

- **Move then blast (`move-blast.js`, new):** a teleport or Fly dive followed by an emanation is rewritten to the plain basic save. The move becomes a `caster-movement` reminder.
  - The emanation's size, the damage entries and the Heightened step must be the item's own.
  - A teleport's range at the cast rank comes from the Heightened entry.
- **State immunity (`save-preamble.js`):** "A creature that doesn't X is immune to this effect." is read only in a basic save with riders, where the effect is the spell. Elsewhere "this effect" is still ambiguous.
- **Narration (`semantic-gate.js`):** "You … that fill(s) the area." is narration, like "You … in the area."
- **Row notes (`basic-degree-rider.js`, `compileBasicRowNotes`):**
  - "A creature that (critically) fails (its save) can't … for N rounds." becomes a note for that long; a failure's note also applies on a critical failure.
  - An explaining "This prevents it from …" joins the note.
  - These notes are combined with a trait degree adjustment; the plan is then guided so the degree rows carry the notes.

## Tests

1048 pass (`test/compiler.test.js` updated for Blazing Dive, which is now supported). `test/rank-3-batch-27.test.js` is new, with negative cases:
- a different emanation size;
- a Heightened step that isn't the item's;
- a failing rule with an unreadable length.

A whole-corpus compile (b388 → b391) changed only the spells in rank 3 batch 27 and rank 4 batch 11.

## Evidence

[Live evidence](phase-rank-3-batch-27-live-results.json), case `rank3Batch27`, in the `pftest` world.
- Echo Jump at 5th: a failure lost 39 (7d8). The reminder said 40 feet and "the space the caster left".
- Blazing Dive at 4th: a failure lost 18 (4d4 + 4d6). The dive reminder was on the card.
- Fungal Exhalation: the breathing question was answered "affected". Failure gave Sickened 1; critical failure gave Sickened 2.
- Powerful Inhalation:
  - The air creature rolled a critical success and the result became a success (no notes, lost 9).
  - The plain creature's critical failure gave both 1-round notes (lost 38).
  - In an earlier run of the same case, an air creature's real failure became a critical failure with both notes.
- **Cleanup:** fixtures removed.
