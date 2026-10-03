# Rank 3 batch 123 — rituals carrying a disease

2026-10-03. Part of the user's ranks 3–5 pass. This batch extends `ritual-degrees` with a disease the ritual carries.

**New:**

- **The ritual's own affliction block** (name, traits, level, save, onset, stages), compiled from the text. Each stage reads as conditions, a time, death, or the text's contagion line (a note).
- **The disease as Pseudo Afflictions' Effect:** an onset step, each stage's conditions (linked) and time, and death and contagion as the stage's note. It can be virulent, or have a deadlier stage, as the result says. Pseudo Afflictions then runs the stages and saves.
- **An exposure (`ritualExpose`):** the creature's save against the disease's DC (or the GM's, when the text gives none). A failure starts the stated stage; a critical failure starts one stage later. A disease the creature already has is unaffected by a new exposure; a poison advances.
- **The carrier and the infestation:** the caster's Effect for the duration, with GM controls to expose the targeted creatures, give arthropods their bonus, or report the hive removed.
- **The hive:** a token with the text's Hardness (as resistance to all damage) and Hit Points. At 0 HP the ritual ends after the text's delay rather than at once.

| Ritual | Now |
| --- | --- |
| Plague Shot (5) | **Critical success:** the caster's Effect for 1 hour. The control ("a plague shot hit") exposes the targeted creatures to siege sickness (Fortitude DC 24) as a virulent disease. **Success:** the same, not virulent. **Critical failure:** the targeted creatures (within 60 feet of the primary caster) are exposed at stage 2. |
| Mosquito Blight (5) | **Success:** the hive token beside the caster (Tiny, Hardness 5, 10 HP), and the caster's Effect for 5 days. Its controls expose the targeted creatures to witch's hunger (Fortitude, the GM's DC), or give targeted arthropods +1 status to attack rolls, skill checks, saves and Perception until the ritual ends. The hive at 0 HP (or removed): the ritual ends 1 hour later. **Critical success:** the same, with stage 3 unconscious and stage 4 death. **Critical failure:** the primary caster is exposed. |

## Rules

- **`src/compiler/ritual-degrees.js`:** `readAfflictionBlock` and `readStage`, and readers for the carrier, the infestation, the hive and the exposures. The disease's name must match the block's.
- **`scripts/effect-runtime.js`:** `#afflictionSource`, `ritualExpose`, `#ritualHive`, `ritualCarry` and `ritualHiveGone`.
- **`scripts/main.js`:** a summoned creature with `endsAfter` delays its caster's Effect instead of ending it.

## Interpretation

Listed in `docs/planning/pending-user-decisions.md`: the stage-2 exposure, the hit control, Mosquito Blight's DC, area and hive.

## Tests

`test/rank-3-batch-123.test.js` is new. It covers both rituals' disease blocks and actions, an unknown stage part (not read) and the stage reader.

A whole-corpus compile (b707 → b708) changed only these two rituals, apart from an empty `affliction` field added to the other rituals.

## Evidence

[Live evidence](phase-rank-3-batch-123-live-results.json), case `rank3Batch123`, in the `pftest` world (Pseudo Afflictions 0.5.1 active).

| Step | Result |
| --- | --- |
| Plague Shot, critical success: the hit control on two creatures | Fortitude −40: afflicted (critical failure: start stage 2, onset first), virulent, DC 24, 6 steps. Fortitude +60: resisted |
| The same creature hit again | No effect (already afflicted) |
| Its counter moved past the onset | Pseudo Afflictions applied stage 1's Sickened 2 |
| Plague Shot, critical failure on a creature (Fortitude −40) | Afflicted, start stage 3 (stage 2, one later for the critical failure) |
| Mosquito Blight, success | Hive token (Tiny, 10 HP, resistance 5); Effect for 120 hours |
| Its exposure control at DC 20 | Witch's hunger, onset 1d6 hours, 6 steps |
| Its arthropod control | +1 status to attack rolls, skill checks, saves and Perception |
| The hive at 0 HP | The Effect now ends in 1 hour |
| Ending the Effect | The hive and the arthropod's bonus gone |
| Mosquito Blight, critical success | Stage 3 unconscious, stage 4 death (5 steps) |
| Mosquito Blight, critical failure | The caster saved (resisted) |

**Cleanup:** fixtures removed.
