# Rank 5 batch 29 — Freezing Rain

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Freezing Rain (5) | A sustained 20-foot burst of difficult terrain, with no save when cast. The first Sustain each round exposes the creatures inside if the rain is frozen. They take 4d6 cold (+1d6 a rank) by their Reflex save; a failure adds Slowed 1 and a critical failure Slowed 2, both for 1 round. Moving the area, the freezing choice and the fires are notes. |

## Rules

- **Freezing rain (`freezing-rain.js` `rewriteFreezingRain`):**
  - It reads the narration, the terrain and fires sentence, the Sustain move-and-freeze sentence, and the freeze damage sentence, which must be the item's entry.
  - It writes "All surfaces in the area are difficult terrain. The first time you Sustain the spell each round, each creature in the area takes … and must attempt a … save." plus the notes.
- **Lingering trigger (`lingering-area-compiler.js`):** a new trigger phrase, "the first time you Sustain the spell each round" on its own, exposes only on a Sustain.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-29.test.js` is new. It also checks the new trigger phrase. Its negative case is freeze damage other than the item's (not read).

A whole-corpus compile (b493 → b494) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-29-live-results.json), case `rank5Batch29`, in the `pftest` world, in combat at 6th rank.

| Step | Result |
| --- | --- |
| Cast | No exposure |
| Caster's next turn: Sustain, frozen | The creature inside is exposed |
| Failure | 5d6 cold = 16 lost, Slowed 1 |

**Cleanup:** fixtures removed.
