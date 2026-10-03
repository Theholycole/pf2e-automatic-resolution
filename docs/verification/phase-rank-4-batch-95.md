# Rank 4 batch 95 — Door to Beyond

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Door to Beyond (4) | A placed 20-foot emanation around the door's space, the caster out of it. Large or smaller creatures save (Fortitude rows) as their turns begin or when they enter: a failure is pulled 10 feet toward the centre, a critical failure 20. The squares beside the door are a second area, started and ended with the first. A creature there (not the caster) takes PF2e's 4d6 slashing (+1d6 a rank) as its turn ends, with no save. Light objects, and objects taking the damage, are a note. The caster can Dismiss it. |

## Rules

- **Door beyond (`src/compiler/door-beyond.js`):**
  - It reads both paragraphs and the three rows.
  - The rows are written as "moves N feet toward the center" (the existing pull toward the area's centre).
  - The spell's damage entry is set aside: the lingering exposures carry no damage, and the door's area uses it.
  - Post-hook: the centre is placed, `excludeCaster`, Dismiss, `doorHazard`, the size predicate, and the note.
- **The door's area (new):**
  - `startLingering` makes a 3×3-square region around the area's centre square and starts it with `startRegionArea` (turn-end hazard damage at the cast rank, `excludeCaster`, `parentCastId`).
  - Ending the parent ends its children (`OngoingRuntime.end`).
  - Validator: the hazard's dice, die, type, base rank, and the compiled sentence.
- **Interpretation:** "adjacent to the door" is the 8 squares around the door's square. The pull is toward the area's centre (the door). Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-95.test.js` is new. It covers the declaration, the hazard, the pulls, the size, the exposures, a hazard without its sentence (refused), and another caster rule (not read).

A whole-corpus compile (b586 → b587) changed only Door to Beyond.

## Evidence

[Live evidence](phase-rank-4-batch-95-live-results.json), case `rank4Batch95`, in the `pftest` world, at 4th rank (caster level 7), in combat.

| Step | Result |
| --- | --- |
| Start | the child area beside the door: 4d6, the caster excluded |
| A creature two squares from the door starts its turn; failure | pulled 10 feet toward the centre; no damage |
| A creature beside the door ends its turn | lost 11 (4d6 slashing, no save) |
| End | both areas ended |

**Cleanup:** fixtures, combat and regions removed.
