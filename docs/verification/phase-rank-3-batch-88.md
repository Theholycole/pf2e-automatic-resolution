# Rank 3 batch 88 — Cyclone Rondo

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Cyclone Rondo (3) | A placed 10-foot square of difficult terrain for the sustained spell. When it appears, each creature in it attempts a Reflex save: on a failure or critical failure it is knocked Prone (no damage). On each Sustain, the GM moves the region up to 10 feet. Each creature in it then attempts a basic Reflex save against 4d6, plus 1d6 per rank above 3rd, with no Prone. Creatures it passed through are added on review. |

## Rules

- **Whirlwind (`src/compiler/whirlwind-rows.js`):**
  - It reads the appearance's save-or-Prone, the terrain and the Sustain sentence (move up to N feet; damage with a basic save), and checks the damage and heightening against PF2e's data.
  - The rows are rewritten to the Prone table, a non-basic save with no item damage. The lingering declaration is then built: initial, plus Sustain events, the placed area, the terrain and a note on moving it.
  - The Sustain's own damage is `sustainBasic`, `(4+(@item.rank - 3)*1)d6[untyped]`.
- **Core:**
  - A Sustain exposure with `sustainBasic` is a basic save of its own: the formula's damage, with no rows' conditions, at the automatic level.
  - The formula may use only the cast rank, and the minus is written with spaces so `@item.rank` is read as the rank. As with Steal the Sky, `@item.rank-3` would be read as an unknown name.
- **Ongoing:** the Sustain exposure plan is built when the declaration has `sustainBasic`.

## Interpretation

Creatures whose space the whirlwind passed through, but which aren't in it after the move, are the GM's to add on review (the note says so).

## Tests

`test/rank-3-batch-88.test.js` is new. It covers the declaration, the initial and Sustain exposures, a tampered formula (rejected), and another heightening (not read).

A whole-corpus compile (b604 → b605) changed only Cyclone Rondo.

## Evidence

[Live evidence](phase-rank-3-batch-88-live-results.json), case `rank3Batch88`, in the `pftest` world, in combat, at 4th rank.

| Step | Result |
| --- | --- |
| The cast: a creature in the square fails | Prone, no damage; the region has difficult terrain |
| Next round, the caster Sustains: it fails | 5d6 (21 lost of 21), no new Prone |

**Cleanup:** fixtures, region and combat removed.
