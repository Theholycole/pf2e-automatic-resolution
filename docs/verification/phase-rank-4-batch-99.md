# Rank 4 batch 99 — Morass of Ages

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Morass of Ages (4) | The caster's sustained 5-foot emanation, the caster out of it. A creature in it when cast, or entering, saves (Fortitude) once: it's immune for the spell. Success: a note that the area's squares are difficult terrain for it while inside. Failure: that note, and Slowed 1 granted while it's inside (so it's slowed as its turn starts there). Critical failure: the same, and Restrained until it Escapes at the spell DC. After each Sustain the caster can expand it 5 feet, to a maximum of 60. Re-entry is a reminder. |

## Rules

- **Time morass (`src/compiler/time-morass.js`):**
  - It reads the preamble (who, once, growth) and the four rows.
  - The rows become in-area notes; the failing ones carry a GrantItem of Slowed 1. The critical failure keeps Restrained until it Escapes.
  - Post-hook: the per-result immunity, `excludeCaster`, the optional growth (`maximum` 60), and the reminder.
- **Interpretation:**
  - "Slowed 1 when it starts its turn in the area" is Slowed 1 while it's inside; a creature that enters mid-turn isn't affected until its next turn begins.
  - The difficult terrain for that creature alone is the GM's (a note).
  - Logged in `pending-user-decisions.md`.
- **Optional growth for the caster's emanation (extended):** `isOptionalExpansion` accepts a caster-centred emanation with a stated `maximum`. The expand control refuses to pass that maximum.

## Tests

`test/rank-4-batch-99.test.js` is new. It covers the declaration, the growth, the slowing rule, the escape, the exposures, a maximum below the radius (refused), and another growth limit (not read).

A whole-corpus compile (b594 → b595) changed only Morass of Ages.

## Evidence

[Live evidence](phase-rank-4-batch-99-live-results.json), case `rank4Batch99`, in the `pftest` world, at 4th rank (caster level 7), in combat.

| Step | Result |
| --- | --- |
| Failure beside the caster | Slowed 1 (its note) |
| Critical failure beside the caster | Restrained and Slowed 1 |
| The failed creature steps out | Slowed removed |
| Next round: Sustain, then expand | radius 10 feet |

**Cleanup:** fixtures and combat removed.
