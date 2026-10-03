# Cantrip / rank 1 batch 152 — Effects used once, and a duration override

2026-09-28. User decision (the text over PF2e's data): six data notes become automation.

| Spell | Was (data note) | Now |
| --- | --- | --- |
| Sure Strike | Rolls every attack twice this turn | Removed after the next attack roll (PF2e also removes it; the module tolerates that) |
| Bit of Luck | Doesn't remove itself | Removed after the target's next saving throw |
| Weapon Surge | Every Strike until your next turn | Removed after the Strike with the chosen weapon (its miss or its damage) |
| Precious Gleam | Dice on every hit | Removed after the next damage roll with the chosen weapon |
| Funeral Flames | The toggle adds ordinary damage; remove by hand | The toggle's dice are persistent, and the Effect is removed after that damage roll (Dismissed) |
| Serrate | Lasts until the end of your next turn | Lasts until the start of your next turn |

## Tests

764/764 pass. `rollConsumes` covers every event, a weapon mismatch, and the toggle. The earlier data-note tests now assert the structured fields.

## Coverage

**Census:** **655 enabled** (unchanged).
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-cantrip-rank-1-batch-152-live-results.json), case `cr1Batch152`, in the `pftest` world. It uses a character with a held club and PF2e's weapon prompt clicked.
- **Sure Strike:** present, then gone after an attack roll, and the caster's immunity was created.
- **Serrate:** `1 rounds turn-start`.
- **Weapon Surge:** kept after an attack with no target (no miss), and gone after the damage roll.
- **Precious Gleam:** kept after the attack, and gone after the damage roll.
- **Funeral Flames:** kept after plain damage. With the toggle on, the damage formula was persistent and the Effect was gone.
- **Bit of Luck:** gone after the target's Will save.
- **Cleanup:** fixtures removed, and no combats left.
