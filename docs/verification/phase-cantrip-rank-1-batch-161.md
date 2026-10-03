# Cantrip / rank 1 batch 161 — Strike spells (note-only before)

2026-09-28.

| Spell | Now |
| --- | --- |
| Shielding Strike | Raise a Shield if one is held, then a melee Strike button per melee Strike |
| Spinning Staff | Staff only: two Strike buttons, the second at −5. The different foe and the Spellstrike recharge are notes |
| Dimensional Assault | Teleport (move the token), then a melee Strike button |
| Sky Laughs at Waves | A one-handed sword only: fly (move the token), then Strike. Falling and disruption are notes |
| Shooting Star | Ranged or thrown only: a Strike button. Concealment, cover reduction and the trail are notes |

## Tests

776/776 pass. A whole-corpus compile changed only these 5 spells.

## Coverage

**Census:** **674 enabled**, up from 669.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-161-live-results.json), case `cr1Batch161`, in the `pftest` world. It uses a character with PF2e's Staff, Shortbow and Steel Shield.
- **Shielding Strike:** the Steel Shield was raised. The Strike buttons covered the Staff, the shield bash and the unarmed attack, not the Shortbow.
- **Spinning Staff:** two Staff buttons. Both rolled: MAP 0, then −5.
- **Sky Laughs at Waves:** refused, since there's no one-handed sword.
- **Shooting Star:** Shortbow only, with the cover note.
- **Cleanup:** fixtures removed, and no combats left.
