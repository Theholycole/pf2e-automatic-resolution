# Rank 2 batch 72 — Banishing Touch

2026-10-01. It needed no new user decision.

| Spell | Now |
| --- | --- |
| Banishing Touch (2) | The cast asks how many actions were spent. The attack is the caster's spell attack against the target's AC, with a "Mythic proficiency" modifier raising its proficiency to level + 10. An NPC's flat attack has no separate proficiency to raise. On a hit the target takes the touch's bludgeoning damage, by actions and rank. It is pushed back away from the caster along the nearest of the 8 directions, kept within the scene. It then falls from the launch height: half the distance in bludgeoning damage, and Prone if that hurt it. The text's numbers are read per action count and rank (the heightened entries aren't cumulative). |

| Actions | Damage | Up / back |
| --- | --- | --- |
| 1 | 1d6 | 10 / 10 |
| 2 | 2d6 | 20 / 10 |
| 3 | 2d6 | 30 / 20 |

Each heightened entry adds dice and feet: +1d6 and 10/20 at 4th; +2d6 and 20/60 at 6th; +3d6 and 30/100 at 8th.

## Rules

- **`mythic-launch.js` (new pre-pass, kind `mythic-launch`):**
  - It reads the three sentences, the three action rows and the three entries exactly.
  - PF2e's heightened dice must be the 1-action row's.
  - `launchAt` gives the values for an action count and rank.
- **Runtime:** `#executeMythicLaunch` — the actions (`actions` in tests), the attack with the mythic modifier, the damage, the push, the fall and Prone.

## Tests

938/938 pass. `test/rank-2-batch-72.test.js` is new. It checks:
- the values for several action counts and ranks;
- that a changed proficiency, movement or step isn't read.

A whole-corpus compile (b327 → b328) changed only Banishing Touch.

## Coverage

**Census:** **1149 enabled**, up from 1148. Rank 2: 235 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-72-live-results.json), case `rank2Batch72`, in the `pftest` world (a level 7 character caster, trained).
- **1 action at 2nd:**
  - The attack carried "Mythic proficiency +8" (17 − 9) and hit.
  - 1d6 bludgeoning.
  - The target was pushed from x 2000 to 2200.
  - It fell 10 feet: 5 damage, and it's Prone.
- **3 actions at 4th:** a hit for 3d6. Up 50 and back 40; the push stopped at the scene's edge. It fell for 25.
- **Cleanup:** fixtures removed.

## Limit

Walls and obstacles in the push's path are the GM's.
