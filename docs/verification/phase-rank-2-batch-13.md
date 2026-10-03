# Rank 2 batch 13 — conditions without a check; living creatures in an area; a terrain option

2026-09-30.

| Spell | Now |
| --- | --- |
| Blur (2) | The target is Concealed for 1 minute (PF2e's condition), with a note: it can't use this concealment to Hide or Sneak. |
| Loose Time's Arrow (2) | Up to 6 targets are Quickened until the end of the caster's next turn, with a note: the extra action is only to Step or Stride. |
| Sudden Blight (2) | 2d10 void, basic Fortitude save, to each **living** creature in the area; others are ineligible. The GM answers per target whether it's afflicted by a disease (−2 circumstance to the save). The card shows the caster's option to rot plants in the area. |

## Rules

- **Condition without a check:** two more wordings of the existing condition + note route:
  - "It becomes Concealed.";
  - "All affected targets are Quickened.", for a Target of "up to N creatures".
- **Living creatures in an area:** on an instantaneous basic save with an area and no Target line, "Each living creature in the area" / "All living creatures in the area" adds a living-creature check on each target.
  - A lingering area doesn't get this: its exposures don't check each creature. Its existing refusal stands.
- **Terrain option:** "You can also direct the … to rot all … non-creature plants in the area, eliminating …" and "… attempts to counteract any magical effect on the plants before withering them." leave the description and become a card reminder. The core accepts it only by that exact sentence.
- **Narration:** "You accelerate the processes of decay in the area." isn't counted as an extra rule; a "You …" sentence naming only the area.

**Considered, not in this batch:**
- **Invisibility:** its Heightened (4th) entry changes the duration and drops the hostile-action ending, which this route doesn't read yet.
- **Pyrefowl Rebuke:** the reaction's trigger, the caster's Fly, and the critical-failure clause.

## Tests

811/811 pass. `test/rank-2-batch-13.test.js` is new. It checks:
- the two condition notes, and the refusal for a non-"up to N" Target;
- Sudden Blight's check, question and reminder, and the refusal of a changed option sentence;
- that a lingering area with "living" stays refused.

A first version of the living rule also reached lingering areas, which two existing tests caught. It's now limited to instantaneous basic saves.

A whole-corpus compile (b266 → b267) changed only these 3 spells.

## Coverage

**Census:** **1045 enabled**, up from 1042. Rank 2: 133 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-13-live-results.json), case `rank2Batch13`, in the `pftest` world.
- **Blur:** Concealed, with "Blur: Concealed" and the note, each for 1 minute.
- **Loose Time's Arrow on two targets:** both Quickened, with 1-round Effects.
- **Sudden Blight on a living target and an undead one:**
  - The undead was ineligible ("requires a living creature").
  - The GM's disease answer recorded −2.
  - The card shows the plants option.
  - The living target's failure lost exactly the damage roll; the undead lost nothing.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
