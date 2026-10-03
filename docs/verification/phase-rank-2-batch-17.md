# Rank 2 batch 17 — action damage, a floor until lifted, a reduction by rank

2026-09-30.

| Spell | Now |
| --- | --- |
| Frozen Lungs (2) | 2d8 cold, Fortitude save. Each row's "damage whenever it performs an auditory action or Casts a Spell" is a note on the creature, with an Ongoing control that deals it: 1 on a success, `(floor(rank/2))d8` on a failure, one die more on a critical failure (heightened by the formula). |
| Ghoulish Cravings (2) | Success: Sickened 1. Failure: Sickened 2 that can't drop below 1 until it consumes raw meat. Critical failure: the same, held at 2. The floor Effect says to delete it when the creature eats, and carries the corpse-bite note. |
| Imprinting Hand (2) | 8 force (+4 a rank), halved / full / doubled by the row. The creature's note states the healing reduction at the cast rank and row (4/8/16 at rank 2; 6/12/24 at 3), deleted when used. |

## Rules

- **Damage on the creature's actions:**
  - "For the spell's duration, the target takes @Damage[F[type]] damage whenever it performs an auditory action or Casts a Spell." puts triggered damage on the row's note.
  - The formula (digits, dice and the spell's rank only) is rolled at the cast rank, each time the GM reports such an action.
- **A floor until the creature does something:**
  - "… and can't reduce this condition below X N until it (first) …; <note>." is a floor with an `until-lifted` lifetime, and "As failure, but … below X N until it …" is the same for the critical failure.
  - The GM deletes the floor Effect when it happens.
- **A number by rank on a note:** the healing reduction ("reduced by 8", "Heightened (+1) … increase by 4", halved or doubled by the row) is computed when the note is made.
- **Typed half or full damage:** "takes half the force damage and …" / "takes the full force damage and …" set the row's damage multiplier for the spell's one entry.

## Heightened versions (checked)

- **Frozen Lungs:** "(+2) … increases by 1d8" is the formula's own `floor(rank/2)`. Live: 1d8 at rank 2, 2d8 at rank 4; the success's 1 at both.
- **Imprinting Hand:** "(+1) The damage and healing reduction both increase by 4." Live at rank 3: 6 / 12 / 24 damage and the same reductions.
- **Ghoulish Cravings:** no Heightened entry.

## Tests

823/823 pass. `test/rank-2-batch-17.test.js` is new. It checks:
- each spell's rows and notes, and the reduction by rank;
- the refusals: an actor formula, another frequency, a floor without its lift.

A whole-corpus compile (b270 → b271) changed these 3 spells (now supported) and Hypnopompic Terrors (rank 3, still blocked).

## Coverage

**Census:** **1051 enabled**, up from 1048. Rank 2: 139 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-17-live-results.json), case `rank2Batch17`, in the `pftest` world.
- **Frozen Lungs:**
  - Rank 2: the success's control dealt "1 cold" (1 HP) and the failure's "1d8 cold".
  - Rank 4: "1 cold" and "2d8 cold".
- **Ghoulish Cravings:**
  - Both rows Sickened 2, with floors of 1 and 2 ("until it consumes some raw meat (GM: delete this Effect then)" plus the corpse note).
  - Three reductions left the failure target at 1; deleting its floor let it drop to 0.
- **Imprinting Hand at rank 3:** lost 6 / 12 / 24, and each note reads "reduced by 6 / 12 / 24".
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
