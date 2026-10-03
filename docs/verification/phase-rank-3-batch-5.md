# Rank 3 batch 5 — Qi Blast

2026-10-02.

| Spell | Now |
| --- | --- |
| Qi Blast (3, focus) | Cast as PF2e's action variants. **1 action:** a 15-foot cone, 2d6 force. **2 actions:** a 30-foot cone, 3d6. **3 actions:** a 60-foot cone, 4d6. Each creature in the cone rolls a Fortitude save. **Critical Success:** unaffected. **Success:** half. **Failure:** full damage and a GM reminder to push it 5 feet. **Critical Failure:** double, with a reminder to push it 10 feet. **Heightened (+1):** +1d6 for the 1-action variant, +2d6 for the 2- and 3-action variants. |

## Rules

- **Action counts stated as sentences (`selectActionSentences`, `action-paragraphs.js`):** used when the cast is a variant (time 1–3) and the description has no per-action paragraphs. It reads "If you use 2 actions to cast qi blast, increase the size of the cone to 30 feet and the damage to 3d6." and the 3-action sentence.
  - The variant's data must agree with the text for its own count: its one damage entry's formula, its area, and its heightening step from "The damage increases by 1d6, or by 2d6 if you use 2 or 3 actions."
  - The opening sentence's damage becomes the variant's. The "If you use" sentences are set aside, and the heightened entry is reduced to the variant's own step. The rest stays for the save compiler.
- **Target "All creatures" with an area (`target-predicate-compiler.js`):** every creature the area holds. This is the variants' overlay target line.
- **Side effect:** Kinetic Ram's 3-action variant also lost its target-eligibility pending item. It's still unsupported for other reasons, so its behaviour is unchanged.

## Tests

965/965 pass. `test/rank-3-batch-5.test.js` is new. It checks:
- each variant, merged as the official compile does, is supported with complete targeting;
- a variant whose text no longer matches its data isn't (changed 2-action dice, 3-action cone, heightening step).

A whole-corpus compile (b341 → b342) changed no base plan. The variant plans changed for Qi Blast, and for Kinetic Ram as described above.

## Coverage

**Census:** **1162 enabled** (milestone; 1158 non-ritual), up from 1161. Rank 3: 114 of 261.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-3-batch-5-live-results.json), case `rank3Batch5`, in the `pftest` world. Each variant was cast through the save card.

| Cast | Degree | Area | Damage | Lost | Push reminder |
| --- | --- | --- | --- | --- | --- |
| 1 action, rank 3 | failure | 15 ft | 2d6 force | 3 | 5 feet |
| 2 actions, rank 3 | failure | 30 ft | 3d6 | 16 | 5 feet |
| 3 actions, rank 3 | critical failure | 60 ft | 4d6, total 9 | 18 (doubled) | 10 feet |
| 1 action, rank 4 (caster level 7) | failure | 15 ft | 3d6 | 11 | 5 feet |
| 2 actions, rank 4 | success | 30 ft | 5d6, total 18 | 9 (half) | none |

- **Run note:** the first run asked for rank 4 directly. The module refused because PF2e resolved rank 3 for the focus spell. The case now raises the caster's level, as the Force Bolt case does.
- **Cleanup:** fixtures removed.
