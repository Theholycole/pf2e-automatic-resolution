# Rank 3 batch 58 — Dive and Breach

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Dive and Breach (3) | A basic Reflex save for 3d10 bludgeoning damage (+1d10 a rank) on the creatures the caster targets: those within 5 feet of where they dive in or exit. Each creature is targeted once. The card notes the movement (Leap 10 feet in, exit within 40 feet, Leap 10 feet out), which the player makes. |

## Rules

- **Splash path (`splash-path.js` `rewriteSplashPath`):**
  - It reads narration, then the dive sentence (Leap N feet, a splash), the exit sentence (within N feet, Leap out N feet), "Each splash deals XdY T damage to all creatures in a @Template[emanation|distance:R]; creatures in multiple splash zones take damage only once.", and the Heightened step.
  - The result is written out as an ordinary basic save on the targeted creatures. The movement and targeting are card notes.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-58.test.js` is new. Its negative case is another splash rule (not read). `test/compiler.test.js` now checks that Dive and Breach reads as the splash path (it was a gated example before).

A whole-corpus compile (b478 → b479) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-58-live-results.json), case `rank3Batch58`, in the `pftest` world, cast at 4th rank.

| Creature | Result | Lost |
| --- | --- | --- |
| One | Failure | 27 (4d10 bludgeoning = 27) |
| Two | Critical success | 0 |

The card shows the movement note.

**Cleanup:** fixtures removed.
