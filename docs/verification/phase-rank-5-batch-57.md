# Rank 5 batch 57 — Etheric Shards

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Etheric Shards (5) | A placed burst of difficult terrain, on the ground and in the air, for the minute (PF2e's heightening widens it 5 feet every 2 ranks). The GM's Ongoing control is used when a creature ends a move action through it: the GM targets the creature and gives the squares it traversed. That opens its basic Reflex card for 1d4 piercing per square (+1 per square every 2 ranks). Incorporeal creatures slowed by it are a note. |

## Rules

- **Shard field (`src/compiler/shard-field.js`):**
  - It reads the terrain, the movement sentence and the heightening, checked against PF2e's interval heightening (area and damage).
  - It writes the lingering declaration itself: a placed burst, no exposure events, terrain for walk and fly, and `moveSave`.
- **The move's save (new):**
  - `moveSaveExposurePlan` builds the basic save whose damage is the squares' dice (text-derived, typed).
  - The record's control (`move-save`) asks for the squares and opens the card at the cast rank and DC.
  - Validator: `moveSave` with the compiled sentence. The text-derived formula is accepted for this exposure only.
- **Interpretation:** "at the end of each move action they take through the area" is the GM's control. The squares are the GM's count. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-57.test.js` is new. It covers the declaration, the exposure formula at 5th and 7th, the plan's validity, zero squares (refused), and another rate (not read).

A whole-corpus compile (b587 → b588) changed only Etheric Shards.

## Evidence

[Live evidence](phase-rank-5-batch-57-live-results.json), case `rank5Batch57`, in the `pftest` world, at 7th rank (caster level 13).

| Step | Result |
| --- | --- |
| Area | 25-foot burst; difficult terrain on the region |
| The GM: 3 squares | card 3d4 + 3 piercing; failure = 12, lost 12 |

**Cleanup:** fixtures and region removed.
