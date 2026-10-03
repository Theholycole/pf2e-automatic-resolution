# Rank 2 batch 65 — Steel Fortifications

2026-10-01. Follows the user's decisions of 2026-10-01: conjured structures with statistics become tokens, and terrain for only some creatures is the module's region (now per creature, here by size).

| Spell | Now |
| --- | --- |
| Steel Fortifications (2) | The cast asks how many (up to 3) and makes each as a PF2e hazard token near the caster: Large (2×2), AC 10, Hardness 9, 60 HP, BT 30, immune to critical hits and precision. The caster's players own them and move them into place within 120 feet. Each has a region on its spaces that follows its token and is difficult terrain for Medium and larger creatures only. When one reaches its Broken Threshold, it crumbles: its token, region and actor are removed, and a Reflex save card goes to the creatures adjacent to it or in its spaces (a failure is 2d6 persistent bleed). The cover, climbing and "enough room" sentences are GM notes on the card. The rest are removed when the 10 minutes end. |

## Rules

- **`fortifications.js` (new pre-pass, kind `fortifications`):**
  - It reads the creation, room, statistics, durability, crumbling, broken-save and terrain sentences, and the three cover and climb sentences, all exactly.
  - The broken save is compiled as a degree sub-plan (`crumblePlan`). It must be an executable save plan.
- **Runtime:**
  - `#executeFortifications` creates the hazard actors and tokens and the size-selective regions. One Ongoing record holds them, ordered token, region, actor; it ends at its maximum (`endsAtMaximum`).
  - `crumbleFortification` runs from an `updateActor` hook (the active GM) at or below the BT. It works out the adjacent or sharing creatures, removes the structure, and starts the save card through the save runtime (`runtime.saves`).
- **Selective-terrain wrapper (`main.js`):** a `bySize` rule (`min` size and difficulty) beside the per-actor list.
- **The follow hook:** a region flagged `followShape: "own"` keeps its token's own rectangle.
- **`ongoing-runtime.js`:** a native record with `endsAtMaximum` ends when its duration runs out. A first live run showed that native records only end through their Effects; this one has none.

## Tests

924/924 pass. `test/rank-2-batch-65.test.js` is new. It checks:
- the statistics, the terrain rule, the notes, and that the crumble sub-plan is executable;
- that a changed BT, terrain or save isn't read.

The count also includes `test/terrain-difficulties.test.js`, from a separate session's task on walk-only terrain.

A whole-corpus compile (b320 → b321) changed only Steel Fortifications.

## Coverage

**Census:** **1142 enabled**, up from 1141. Rank 2: 228 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-65-live-results.json), case `rank2Batch65`, in the `pftest` world.
- **Two structures:** each AC 10, 60 HP, BT 30, Hardness 9, Large, 2×2.
- **Moving one square into a structure's space** (Foundry's terrain path): the Medium creature paid 10 feet, and the Small one 5.
- **Breaking one** (45 slashing − Hardness 9 → 24 HP):
  - Its actor and region are gone.
  - The save card went to the Medium creature next to it and the Small creature inside it, not to the one far away.
  - The Medium creature failed and has persistent "2d6 bleed"; the Small creature succeeded and has none.
- **After 10 minutes:** the second structure's token, region and actor are gone.
- **Cleanup:** fixtures removed.

## Note

The browser session dropped to /join once. The client was rejoined as Gamemaster and the case re-run.
