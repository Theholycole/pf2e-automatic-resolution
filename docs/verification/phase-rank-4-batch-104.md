# Rank 4 batch 104 — Vital Luminance

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Vital Luminance (4) | PF2e's Effect (its light: bright 30 feet, dim to 60) goes on the caster for the minute. Its counter is the luminance reservoir: 4, plus 4 as each of the caster's later turns starts (+1 to both per rank above 4th). Two Ongoing controls: **(1)** when an undead in the bright light damages the caster, the GM targets it and it takes half the reservoir in vitality damage (once a round). **(2)** Dismiss into a targeted creature within the light: a living one is healed by the reservoir, an undead takes that much vitality damage, and the spell ends. A new casting ends the earlier one. |

## Rules

- **Luminance (`src/compiler/luminance.js`, compiled in `compileSpell`):**
  - It reads the four paragraphs and the heightening.
  - It proves PF2e's Effect: one TokenLight rule whose bright and dim radii match the text, and a counter badge.
- **Runtime:**
  - **New effect kind:** `luminance`. It ends an earlier casting by the same caster, then makes PF2e's Effect with its counter at the cast rank's start, on a native record carrying `luminance`.
  - **Each turn:** the native reconcile raises the counter once per caster turn after the casting round.
  - **The controls:** the Ongoing `luminance` controls (undead, dismiss), with the trait, distance and once-a-round checks.

## Tests

`test/rank-4-batch-104.test.js` is new. It covers the kind's data, and another light radius (not read).

A whole-corpus compile (b616 → b617) changed only Vital Luminance.

## Evidence

[Live evidence](phase-rank-4-batch-104-live-results.json), case `rank4Batch104`, in the `pftest` world, in combat, at 5th rank.

| Step | Result |
| --- | --- |
| The cast | PF2e's Effect (TokenLight), reservoir 5 |
| The caster's next turn | 10 |
| The undead in the light | 5 vitality (5 lost); again this round refused |
| A recast | The first casting ended; one Effect |
| The Dismiss into a living ally (50 HP) | Healed 5 (55); the spell ended |

**Cleanup:** fixtures and combat removed.
