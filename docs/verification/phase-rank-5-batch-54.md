# Rank 5 batch 54 — Mirror Malefactors

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mirror Malefactors (5) | Will, sustained, on one target: 7d8 mental (+1d8 per rank) with a basic save at the cast and on each round's first Sustain. The target is Frightened 1 while the spell lasts, and it can't reduce that value (PF2e's grant is restricted). A critical success on any of its saves shatters the mirrors and ends the spell. A card reminder covers the size limit and creatures without a reflection. |

## Rules

- **Mirror ring (`src/compiler/mirror-ring.js`):**
  - It reads both paragraphs and the damage entry.
  - It rewrites them into the existing sustained-target repeat ("takes … immediately and the first time each round you Sustain the Spell, with a basic … save") plus "Frightened 1 for as long as the effect persists".
  - It marks the critical success `endsSpellOn: "critical-success"` and the held condition `locked`.
- **Runtime:**
  - The basic save's card carries `criticalEndsSpell`, which the lingering record honours.
  - A locked member condition's grant is restricted, so PF2e won't lower it.
  - The validator allows both only with this evidence, and only on the critical success.

## Tests

`test/rank-5-batch-54.test.js` is new. Its negative cases are:

- a non-critical-success end (refused);
- another end rule (not read).

A whole-corpus compile (b565 → b566) changed only Mirror Malefactors.

## Evidence

[Live evidence](phase-rank-5-batch-54-live-results.json), case `rank5Batch54`, in the `pftest` world, at 5th rank.

| Step | Result |
| --- | --- |
| Cast, failure | 7d8 mental = 32 lost; Frightened 1 |
| A Frightened decrease | still 1 |
| Sustain, critical success | no damage; the spell ended; Frightened gone |

**Cleanup:** fixtures removed.
