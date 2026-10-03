# Rank 4 batch 89 — Fallow Field

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Fallow Field (4) | A sustained, placed 15-foot burst. Each creature inside holds a marker. When it would regain Hit Points (PF2e's healing on it), the module keeps its Hit Points as they were, rolls its Will save at the spell DC, and restores the result's share: all on a critical success or success, half on a failure, none on a critical failure. A critical success also makes it immune to the area for 1 minute. |

## Rules

- **Fallow field (`src/compiler/fallow-field.js`):**
  - It reads the lead and the four rows.
  - The area is a sustained placed burst with no exposure events and a `healingSave` declaration: the save, each result's share, and the critical success's immunity.
- **The held healing (new):**
  - `syncHealingWatch` gives the creatures inside the marker and removes it from those that leave.
  - A `preUpdateActor` hook (like Reaper's Lantern's halving) holds PF2e's healing update on a marked, non-immune creature and asks for the area's save (`healing-save`).
  - `healingSave` rolls PF2e's save at the record's DC (the caster's spell DC when the cast gave none), restores the share, adds the immunity Effect after a critical success, and posts a chat line.
  - Validator: the exact shares, the immunity, and the compiled sentence.
- **Interpretation:** healing applied as PF2e healing (negative damage) is watched. A direct Hit Point edit isn't. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-89.test.js` is new. It covers the declaration, another share (refused), and another row (not read).

A whole-corpus compile (b579 → b580) changed only Fallow Field.

## Evidence

[Live evidence](phase-rank-4-batch-89-live-results.json), case `rank4Batch89`, in the `pftest` world, at 4th rank (caster level 7; DC 24).

| Step | Result |
| --- | --- |
| Markers | the creature inside has one; the one outside doesn't |
| Both healed 12 | inside: held, Will save a failure, regained 6 (100 → 106); outside: 100 → 112 |
| End | marker removed |

**Cleanup:** fixtures and region removed.
