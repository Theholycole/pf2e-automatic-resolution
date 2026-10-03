# Rank 2 batch 74 — Burrow Ward

2026-10-01. Follows the user's decision of 2026-10-01: terrain for only some creatures is the module's region, now per creature (batch 64). Forced movement stays the GM's, as with the module's other pushes.

| Spell | Now |
| --- | --- |
| Burrow Ward (2) | The cast asks the GM which creatures can burrow through stone; those with a burrow Speed are suggested. A sustained region around the caster follows its token: 15 feet, or 30 from 5th, for up to a minute. Burrowing into it costs double for those creatures only. That the others can't burrow through it at all is a GM note: Foundry's terrain can't forbid a move. The card's button rolls the Fortitude saves of the creatures the GM targets as underground in the area. A failure is ejected toward the surface; a success is forced out of the area but can stay underground. Both are GM notes to move the token. A missed Sustain ends the spell and removes the region. |

## Rules

- **`burrow-ward.js` (new pre-pass, kind `burrow-ward`):** the four sentences and the 5th-rank entry exactly. `burrowWardRadius` gives the radius by rank.
- **Runtime:**
  - `#executeBurrowWard` — the classification (`stoneBurrowers` in tests), the circular region with a burrow-only selective behaviour, and a native sustained record.
  - `burrowUnder` and its card button.
- **The follow hook:** handles `followShape: "emanation"`, a circle of a stored radius.

## Tests

942/942 pass. `test/rank-2-batch-74.test.js` is new. It checks:
- the radius by rank, the terrain and the outcomes;
- that a changed terrain or success row isn't read.

A whole-corpus compile (b329 → b330) changed only Burrow Ward.

## Coverage

**Census:** **1151 enabled**, up from 1150. Rank 2: 237 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-74-live-results.json), case `rank2Batch74`, in the `pftest` world.
- **The cast:** a 15-foot circular region.
- **Burrowing two squares** into the area: the stone burrower paid 15 feet, the other burrower 10.
- **The region followed** the caster's token.
- **The underground creature's save:** failed, so it is "ejected from the area toward the surface".
- **In combat, no Sustain:** the spell ended and the region went.
- **Cleanup:** fixtures removed.
