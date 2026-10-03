# Rank 3 batch 75 — Wall of Radiance

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Wall of Radiance (3) | The wall is a lingering line area (up to 60 feet) that the GM places as a region. A creature that moves into it saves (basic Fortitude) against PF2e's fire damage: 2d6, or 3d6 from 4th rank. A card reminder covers the placement rules, Dazzled for creatures adjacent to the wall, and the 4th-rank concealment across it. |

## Rules

- **Radiant wall (`src/compiler/radiant-wall.js`):**
  - It reads the lead (size, placement, dazzle, the damage on moving through) and the 4th-rank entry.
  - It rewrites the text into the lingering trigger "A creature that enters the wall takes …".
  - It gives the spell the text's line as its area, so the lingering workflow can run it.
- **Interpretation:** "move through" is "enters the region"; the dazzle and concealment are the GM's. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-75.test.js` is new. Its negative case is another trigger (not read).

A whole-corpus compile (b566 → b567) changed only Wall of Radiance.

## Evidence

[Live evidence](phase-rank-3-batch-75-live-results.json), case `rank3Batch75`, in the `pftest` world, at 4th rank (caster level 7). The wall was a 1×6-square region; the walker started outside it.

| Step | Result |
| --- | --- |
| Before walking in | no obligation |
| Walks into the wall | exposed; failure: 3d6 fire = 13, lost 13 |

**Cleanup:** fixtures removed.
