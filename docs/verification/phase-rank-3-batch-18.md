# Rank 3 batch 18 — Safe Passage, Soothing Blossoms (area Effects)

2026-10-02. Part of the user's ranks 3–5 pass. This extends rank 4 batch 4's `area` Effect-note recipient.

| Spell | Now |
| --- | --- |
| Safe Passage (3) | The GM draws the stated section of terrain as a region and selects it. Creatures in it hold PF2e's Effect while inside: its toggle (on when the harm is the terrain's), +2 status to AC and saves, and resistance 5 / 10 / 15 by rank. The area is sustained. Collapse prevention and the limits are GM notes. |
| Soothing Blossoms (3) | Creatures in the burst hold PF2e's Effect (a success on a poison or disease save becomes a critical success). Each occupant's persistent damage gets PF2e's recovery flat check at the cast and as each of the caster's turns begins. The 10-minute stage limit and the flowers afterwards are GM notes. |

## Rules

- **Proof (`effect-note-proof.js`):**
  - An Area paragraph before the text is skipped, like a Trigger. The compile records it as `drawnArea` and doesn't flag `area-paragraph` for this route.
  - Safe Passage's two sentences are the toggle, and the toggle-predicated +2 and all-damage resistance at its base value.
  - "The granted resistance increases to N, and the area can be N feet long." is checked at its rank, and so is a Resistance claimed in a multi-rule sentence.
  - Soothing Blossoms' degree adjustment, and "assisted recovery … when the spell is cast and at the start of each of your turns" (`assistedRecovery`).
- **Runtime:**
  - With no item area, the GM's selected region is used, or an error asks for one.
  - The area is sustained when the spell is.
  - `ongoing-families.js` `assistedRecovery`: PF2e's `rollRecovery()` for each occupant's persistent damage, at the cast and once per caster turn start. A cast on the caster's own turn counts as that turn.

## Tests

1010 + 2 = 1012 pass. `test/rank-3-batch-18.test.js` is new, with negative cases:
- base resistance;
- the heightened value;
- the affliction traits.

A whole-corpus compile (b368 → b369) changed only these two.

## Evidence

[Live evidence](phase-rank-3-batch-18-live-results.json), case `rank3Batch18`, in the `pftest` world.
- **Safe Passage, cast at 5th:** the creature inside held the Effect with its toggle and the outsider didn't; the record was sustained.
- **Soothing Blossoms:**
  - With the occupant on persistent bleed (DC 30), there was one recovery check at the cast and a second as the caster's turn began.
  - None came on the occupant's own turn.
  - The degree adjustment was held inside only.
- **Run note:** the first run's way of adding persistent damage failed silently; the case now uses `ConditionManager`, as other cases do.
- **Cleanup:** the combat, regions and fixtures were removed.
