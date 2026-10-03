# Cantrip / rank 1 batch 168 — items (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Summon Instrument | The instrument (virtuoso from 5th) in the caster's hands for the hour; a new cast replaces it; removed at the end |
| Arms of Nature | A chosen common weapon of 2 Bulk or less with the rank's runes, held for the minute, then removed |
| Mending | An item within the rank's limits regains 5 HP per rank (to its maximum), leaving the broken state when above its Broken Threshold |

## Tests

783/783 pass. A whole-corpus compile (b251 → b252) changed only these 3 spells. Batch-22 is updated.

## Coverage

**Census:** **710 enabled**, up from 707.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-168-live-results.json), case `cr1Batch168`, in the `pftest` world.
- **Summon Instrument:**
  - Rank 1: a Musical Instrument (Handheld), held.
  - Rank 5 cast: replaced by the virtuoso instrument, with one Effect left. Deleting the Effect removed it.
- **Arms of Nature:**
  - The list offered 101 weapons. A character at rank 3 drew "Club (Arms of Nature)" with +1 striking, held, with a Strike at +1.
  - A weapon over 2 Bulk was refused. The club was removed with the Effect.
- **Mending:**
  - Rank 1 took a broken Buckler from 1 to 6/6 HP, and it's no longer broken.
  - A Steel Shield (1 Bulk) was refused at rank 1; at rank 2 it went from 5 to 15.
- **Cleanup:** fixtures removed; no combats left.
