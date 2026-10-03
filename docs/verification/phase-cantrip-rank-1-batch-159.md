# Cantrip / rank 1 batch 159 — roll families (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Diviner's Sight | The rolled d20 is PF2e's roll substitute for the target's non-secret saves and skill checks. The Effect is removed once used |
| Read Fate | A secret DC 6 flat check for the GM, then 24-hour immunity |
| Fact Check | Rolls the caster's check with the triggering Recall Knowledge skill against its DC. The degree's text goes to the GM |
| Nudge Fate | Watches the target and re-grades the first failure that +1 status improves. The hex then ends |

## Tests

774/774 pass, with strictness for each spell and the `substituted-check` consumption.

## Coverage

**Census:** **666 enabled**, up from 662.
- A whole-corpus compile changed only these 4 spells.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-159-live-results.json), case `cr1Batch159`, in the `pftest` world.
- **Diviner's Sight:** the rolled 12 was offered in PF2e's dialog. The Will save rolled "12 + 10", and the Effect was then gone.
- **Read Fate:** the flat check was blind and whispered to the GM. The target became immune, and a second cast was refused.
- **Fact Check:** an ally's Arcana Recall Knowledge (DC 15) was found, and the caster's Arcana check against DC 15 was a success.
- **Nudge Fate:**
  - A save failing by 2 left the hex in place.
  - A save failing by 1 was re-graded to a success (14 → 15 against DC 15), and the hex ended.
  - These two messages were posted in PF2e's check format with fixed totals, since a real roll can't be steered to miss by exactly one.
- **Cleanup:** fixtures removed, and no combats left.
