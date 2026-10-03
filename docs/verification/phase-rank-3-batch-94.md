# Rank 3 batch 94 — Moth's Supper

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Moth's Supper (3) | The caster gets the module's Effect for 1 hour. It heals the item's dice (2d4, +1d4 per rank) every 10 minutes of world time. A button on the spell's card gives the extra healing (4d4, +2d4 per rank), once. The blood-and-rot sense is a note on the Effect. |

## Rules

- **Interval healing (`src/compiler/interval-heal.js`, compiled in `compileSpell`):**
  - It reads the "three effects" list: the healing every stretch of time, the extra when treated, and the sense.
  - The healing's dice must be the item's healing entry. The heightened healing must equal PF2e's heightening; the extra's heightening is read from the text.
- **Runtime:**
  - **New effect kind:** `interval-heal`. The caster's Effect is flagged with the formula, the interval, the last healing and the end.
  - **`intervalHealTick`** runs on `updateWorldTime`, and on the Effect's deletion for the time up to its end. It heals once for each whole interval passed, up to the end, and never after it. The heal goes through PF2e's own damage application with the caster's token; an actor without one has its Hit Points raised directly.
  - **`intervalHealBonus`** (the card's button) rolls the extra healing once.

## Interpretation

- **The extra healing is a button.** PF2e 8.5's Treat Wounds is a dialog with no patient, so the module can't see who was treated. The player or GM presses the button after a successful Treat Wounds on the caster.
- **The sense is a note.** "Freshly spilled blood and rotten flesh" matches no PF2e sense.
- **The first healing comes 10 minutes after casting.** It is not immediate.

## Tests

`test/rank-3-batch-94.test.js` is new. It covers the data, and a healing heightening that differs from PF2e's (not read).

A whole-corpus compile (b618 → b619) changed only Moth's Supper.

## Evidence

[Live evidence](phase-rank-3-batch-94-live-results.json), case `rank3Batch94`, in the `pftest` world, cast at 4th rank.

| Step | Result |
| --- | --- |
| The cast | 3d4 every 10 minutes; the extra 6d4; the Effect for 1 hour |
| 25 minutes pass | Two healings of 3d4 |
| The button | 12 HP gained |
| The button again | Refused (used) |
| 60 more minutes pass | Six healings in all; the Effect gone |
| 20 more minutes pass | Still six |

**Cleanup:** fixtures removed.
