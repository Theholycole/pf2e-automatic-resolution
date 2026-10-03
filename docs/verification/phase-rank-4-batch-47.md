# Rank 4 batch 47 — Living Terrain

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Living Terrain (4) | A sustained 10-foot burst, exposing creatures when cast and on the first Sustain each turn. Those it covers or passes over take 4d6 bludgeoning (+1d6 a rank) by their Reflex save. **Success:** Clumsy 1. **Failure:** Prone and Clumsy 1. **Critical failure:** Prone and Clumsy 2. The Clumsy lasts until the start of the caster's next turn. The GM moves the region, up to 15 feet in a straight line, and includes the passed-over creatures in the review. |

## Rules

- **Moving terrain (`moving-terrain.js` `rewriteMovingTerrain`):**
  - It reads the three lead sentences (the template, the move, the movement's damage and save) and the four written rows, where Prone and Clumsy are named by link once.
  - It writes the existing "When you Cast the Spell and the first time you Sustain it each turn on subsequent rounds, each creature in the area …" trigger and plain rows.
  - The movement is a note.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-47.test.js` is new. Its negative case is another movement rule (not read).

A whole-corpus compile (b494 → b495) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-47-live-results.json), case `rank4Batch47`, in the `pftest` world, at 5th rank.

| Step | Result |
| --- | --- |
| A creature inside when it's cast | Exposed |
| Failure | 5d6 bludgeoning = 11 lost, Prone, Clumsy 1 |

**Cleanup:** fixtures removed.
