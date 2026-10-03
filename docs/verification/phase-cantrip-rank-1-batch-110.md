# Cantrip / rank 1 batch 110 — Vindicator's Mark

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Target “your hunted prey”: GM-confirmed | Vindicator's Mark (1) |
| “Make a spell attack against the target. On a hit, you deal 2d4 spirit damage …”: the spell attack (critical hit double, PF2e's rule) | Vindicator's Mark |
| “… the target is marked … the marked target takes an additional +2 damage from all your weapon or unarmed attacks.”: on a hit, PF2e's Effect on the caster, marking the target's token (proved: TokenMark + Strike-damage bonus `ceil(level/2)+1`, i.e. +2, +1 per 2 ranks) | Vindicator's Mark |
| Invisible marked targets concealed rather than undetected: a GM note | Vindicator's Mark |
| “You can Dismiss the spell on your turn if your last action dealt damage to the target …, instantly dealing an additional (ceil(rank/2)+1)d6 spirit damage to it.”: a confirmed Dismiss control on the marked creature | Vindicator's Mark |

**Kept strict (tests):** it isn't read with any of these changes:
- another bonus;
- another heightening;
- an added condition;
- another Dismiss condition.

## Coverage

**Census:** **591 enabled**, up from 590.
- The b193 corpus diff against b192 changed only Vindicator's Mark.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 711/711 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-110-live-results.json), case `cr1Batch110`:
- **Before the GM confirmed the prey:** finalizing was refused.
- **The hit:** `2d4 spirit` (6 lost).
- **The mark:** PF2e's Effect on the caster, with the TokenMark bound to the prey's token.
- **The caster's Strike:** `1d6 + 2 slashing` against the prey, and `1d6 slashing` against another creature.
- **Dismiss:** `2d6 spirit` on the prey (4 lost), and the mark ended.

**Regressions:** `cr1Batch84` (Savor the Sting's mark) and `spellAttack` passed.
