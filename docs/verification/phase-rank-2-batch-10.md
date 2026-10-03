# Rank 2 batch 10 — rows that are only behaviour; note-only spells counted resolved

2026-09-30.

## Note-only spells count as resolved (user decision)

"All note only spells count as resolved." Every non-ritual note-only spell, at any rank, is now counted as enabled; before, only cantrips and rank 1 were. The census went from **808 to 1038** before this batch's spells.

The 44 note-only rituals and the Effect + note spells are still counted apart.

## Spells

| Spell | Now |
| --- | --- |
| Paranoia (2) | Success: a 1-round note ("believes everyone it sees is a potential threat … treats no one as an ally"). Failure: the same, for 1 minute. Critical failure: the failure's note plus its own ("everyone it sees is a mortal enemy …"), for 1 minute. |
| Vicious Jealousy (2) | Success: "For 1 round, the target no longer treats anyone as its allies." Failure: no allies, no Aid or directly beneficial actions, while the caster Sustains (up to 1 minute). Critical failure: the failure's rules plus berating a former ally on its first action. One note per row. |

## Rule

A result row that applies nothing (no damage, condition, Effect or movement) and only says how the creature behaves becomes **one note Effect** with the row's text.
- **Only as a fallback:** it's tried when the clause-by-clause notes still leave the row partly unclaimed, and it replaces those clause notes. Spells the clause notes already resolve are unchanged.
- **Refused:**
  - any link other than an attitude;
  - dice, damage, a check or an inline roll;
  - rolls, twice, checks, saves, AC, bonus, penalty, Speed, Hit Points, resistance, weakness, immunity, feet, or "within the next …";
  - any unexplained signal other than duration, timing, action or choice.
- **Duration:** "The spell ends after 1 round." / "For 1 round, …" / "As success, but the effect lasts 1 minute." / the named row's ("As failure, except …", which adds its text) / the spell's (sustained when the spell is).

**Caught in development:** a first version also resolved Mirror's Misfortune (rank 4) as a note. Its rows ("roll its next two attack rolls twice and take the lower result", "within the next hour") are mechanical, so the blockers above were added. A first version also replaced existing clause notes on already working spells (Tame, Charm, Command…), which is why it became a fallback.

## Tests

804/804 pass. `test/rank-2-batch-10.test.js` is new. It checks:
- both spells' notes and durations, with no double note on "As failure" rows;
- the refusals: a roll rule, a penalty, a row with a condition, and an unexplained movement signal.

A whole-corpus compile (b263 → b264) changed only Paranoia and Vicious Jealousy among supported or newly supported plans. 32 other plans still blocked for other reasons gained a partial row note.

## Coverage

**Census:** **1040 enabled** (808 before the note decision, 1038 after it, plus these 2). Rank 2: 128 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-10-live-results.json), case `rank2Batch10`, in the `pftest` world.
- **Paranoia, at success, failure and critical failure:** one "Paranoia: GM note" each, lasting 1 round / 1 minute / 1 minute. Only the critical failure's note has "mortal enemy".
- **Vicious Jealousy, at failure and critical failure:** one "Vicious Jealousy: No allies" note each. Only the critical failure's note has the berating rule. One active Ongoing record for the sustained cast.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left. The world still has 7 active Ongoing records from much older runs (world time 63 to 19,240), not from this batch.
