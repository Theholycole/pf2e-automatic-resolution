# Cantrip / rank 1 batch 165 — attack wards (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Sanctuary | Each attack on the warded creature rolls the attacker's Will save against the spell DC and applies its row; the ward ends when the warded creature attacks |
| Protector Tree | A square holding 10 Hit Points (+10 per rank) that takes Strike damage dealt to an adjacent ally first |

## Tests

780/780 pass. A whole-corpus compile (b247 → b248) changed only these 2 spells. Batch-8 and batch-16 are updated.

## Coverage

**Census:** **688 enabled**, up from 686.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-165-live-results.json), case `cr1Batch165`, in the `pftest` world, on a temporary scene.
- **Sanctuary:** DC 24. The attacker's Strike on the warded creature rolled one Will save (the result was the "barred" row). Then an attack roll by the warded creature ended the ward.
- **Protector Tree:** the tree had 10 HP. An 8-damage Strike on the adjacent ally cost it nothing and left the tree at 2. A 5-damage Strike cost the ally 3, the tree was gone, and the record and square were removed.
- **Cleanup:** fixtures removed, the temporary scene deleted, and no combats left.
