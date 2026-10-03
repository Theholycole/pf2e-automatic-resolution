# Cantrip / rank 1 batch 162 — action families (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Cackle | Sustains the caster's sustained spell |
| Friendfetch | Pulls 1–2 willing targets to the free squares nearest the caster (forced movement) |
| Liberating Command | A held target (Grabbed, Immobilized or Restrained) rolls PF2e's Escape; others are refused |
| Bone Shield | A held, raised spell shield (Hardness by rank). Destroyed, it's recreated and raised on Sustain |

## Tests

777/777 pass. A whole-corpus compile changed only these 4 spells.

## Coverage

**Census:** **678 enabled**, up from 674.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-162-live-results.json), case `cr1Batch162`, in the `pftest` world.
- **Friendfetch:** an ally 30 feet away (x 2500) was pulled to x 2300, beside the caster.
- **Liberating Command:** a free target was refused. An Immobilized target's Escape roll was made.
- **Bone Shield (rank 3):**
  - Hardness 6, raised.
  - When destroyed, the shield went and the spell stayed.
  - Cackle Sustained it in combat: recreated and raised.
- **Found live:**
  - A plain token position update doesn't stick on Foundry v14; `teleport: true` does.
  - A raise right after the shield or its old raise changes can be ignored by PF2e, so the module retries it.
- **Cleanup:** fixtures removed, and no combats left.
