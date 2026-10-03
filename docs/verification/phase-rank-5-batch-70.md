# Rank 5 batch 70 — Flame Dancer

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Flame Dancer (5) | **PF2e's Spell Effect** on the willing target at the cast rank: unarmed Strikes deal 2d6 extra fire, and critical hits 2d4 persistent fire (3d6 and 3d4 at 7th). The compiler proves its dice against the text at both ranks. **The card's control** "X Demoralizes with Performance (target the foe)": the target's Performance check (`action:demoralize`; visual, not auditory) against the foe's Will DC, within 30 feet. A success is Frightened 1; a critical success, Frightened 2. **At 7th** a critical success also makes the foe Fleeing from the target for 1 round. No language penalty is applied. |

## Rules

- **`src/compiler/skill-demoralize.js`:** reads every sentence; the catalog proves PF2e's two DamageDice rules.
- **Runtime:** new kind `skill-demoralize`; `skillDemoralize` (API and card button on the target's Effect).

## Interpretation

- **Demoralize's 10-minute immunity** is a GM line on the result (as for Belittling Boast).
- **The Demoralize with Intimidation** stays PF2e's own action; the card is the Performance alternative.

## Tests

`test/rank-5-batch-70.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b678 → b679) changed only Flame Dancer.

## Evidence

[Live evidence](phase-rank-5-batch-70-live-results.json), case `rank5Batch70`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 5th on an ally | PF2e's Effect (level 5); its unarmed Strike's damage is "1d4 bludgeoning + 2d6 fire" |
| Its Demoralize with Performance on a weak-willed foe | Critical success: Frightened 2, not Fleeing |
| On a foe 40 feet away | Refused |
| Cast at 7th; another foe | "1d4 bludgeoning + 3d6 fire"; critical success: Frightened 2 and Fleeing for 1 round |

**Cleanup:** fixtures removed.
