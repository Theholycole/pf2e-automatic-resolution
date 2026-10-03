# Cantrip / rank 1 batch 109 — Life Tap

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “One creature within 30 feet of the targeted thrall must attempt a Fortitude saving throw. The targeted thrall is then destroyed.”: the thrall route (the caster picks the thrall; the target must be within 30 feet of it; a destroyed-thrall reminder) | Life Tap (1) |
| “Drained 1 but recovers after 1 minute” / “As success, but Drained 2 / 3”: each row's Drained for 1 minute | Life Tap |
| “You or an ally of your choice within 30 feet of the thrall regains Hit Points equal to double the amount the creature lost.”: after Finalize, the targeted creature (the caster or an ally, within 30 feet of the thrall) regains double the Hit Points lost | Life Tap |
| “A creature can be healed by this spell only once every 10 minutes.”: a 10-minute mark; while it lasts, the heal is refused | Life Tap |

**Kept strict (tests):** it isn't read with any of these changes:
- triple the healing;
- an added condition on the drain;
- an added bonus;
- added caster damage.

The last case exposed an untyped-damage gap in the preamble check, now closed. Only Curse of Lost Time, Unbreaking Wave Advance and Bound in Death gained the flag, and they were already blocked.

## Coverage

**Census:** **590 enabled**, up from 589.
- The b192 corpus diff against b191 made Life Tap executable, and changed only the pending flags of those three blocked spells.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 709/709 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-109-live-results.json), case `cr1Batch109`, with level 3 creatures:
- **The failing creature:** lost 6 Hit Points (Drained 2 at level 3), with Drained 2 on a 1-minute Effect.
- **The heal:** the ally near the thrall regained 12 and got the 10-minute mark.
- **Card:** it showed the thrall reminder.
- **Second cast:** healing the same ally was refused.

**Regressions:** `thrallSpells` (Necrotic Bomb, Bone Spear, Dead Weight) passed.
