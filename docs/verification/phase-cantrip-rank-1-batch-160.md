# Cantrip / rank 1 batch 160 — damage reactions (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Protector's Sacrifice | 3 per rank of the ally's last damage moves to the caster (no IWR) |
| Delay Consequence | The last damage is restored, then dealt at the start of the caster's next turn (or on Dismiss) |
| Interposing Earth | Cover (+2 AC and Reflex) and resistance 2 (8 from 4th) until the triggering damage |

## Tests

775/775 pass: amounts by rank, `untilStartOf`, and strictness. A whole-corpus compile changed only these 3 spells.

## Coverage

**Census:** **669 enabled**, up from 666.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-160-live-results.json), case `cr1Batch160`, in the `pftest` world.
- **Protector's Sacrifice:** the ally went 500 → 490 → 493, and the caster 500 → 497.
- **Delay Consequence (combat):** 8 damage was restored. The target stayed at full HP through its own turn and dropped to 492 at the start of the caster's next turn.
- **Interposing Earth:** AC went 20 → 22. A 10 bludgeoning hit dealt 8, and the Effect was then gone.
- **Cleanup:** fixtures removed, and no combats left.
