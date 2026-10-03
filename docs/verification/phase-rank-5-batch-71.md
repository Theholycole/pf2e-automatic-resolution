# Rank 5 batch 71 — Flammable Fumes

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Flammable Fumes (5) | **The cloud** is the placed area (PF2e's template, or a given region) for 1 minute. It deals 2d6 poison itself (+1d6 per 2 ranks) to a creature that enters it or starts its turn in it, once per round per creature. Creatures already inside when it's made haven't entered it; they take it at their turn start. **From a round after the cast**, the card's control "A flame or fire effect detonates the cloud" gives every creature inside a basic Reflex save against 10d6 fire (+2d6 per 2 ranks), and the spell ends. Before then it's refused. Its invisibility is a GM note. |

## Rules

- **`src/compiler/fume-cloud.js`:** reads every sentence and the Heightened entry, and checks PF2e's damage entry is the poison. `fumeCloudAt` gives both formulas at a rank.
- **`compile-ability`:** the blast's basic save is a compiled plan with the text's formula at the cast rank (the `phaseFormula` evidence).
- **`startRegionArea`:**
  - `hazardOncePerRound`: one hit per creature each round.
  - `seedMembers`: the creatures already inside are members, so they don't "enter".
- **Runtime:** new kind `fume-cloud`; `cardAction("fume-detonate")` / `fumeDetonate` (API).

## Interpretation

- **"One round after"** is a world-time round (6 seconds) after the cast; combat's round advance moves it.
- **The detonation's trigger** (an open flame, a fire effect) is the GM's call.

## Tests

`test/rank-5-batch-71.test.js` is new. It covers the data, the blast plan (supported) and an unrecognised clause (not read).

A whole-corpus compile (b679 → b680) changed only Flammable Fumes.

## Evidence

[Live evidence](phase-rank-5-batch-71-live-results.json), case `rank5Batch71`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| Cast with a creature already inside | No damage at the cast |
| Detonating in the first round | Refused |
| That creature's turn starts | 2d6 poison |
| Another creature enters during that turn | 2d6 poison |
| Its own turn starts, the same round | Nothing more (once per round) |
| Next round, the detonation | Both creatures' Reflex card (10d6 fire, failures applied); the spell ended |

**Cleanup:** fixtures, combat and the region removed.
